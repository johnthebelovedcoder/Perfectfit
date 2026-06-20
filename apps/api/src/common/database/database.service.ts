import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@thread/database";

/**
 * Prisma client with a connect-retry on startup. Serverless Postgres (Neon, etc.)
 * can briefly refuse connections while compute resumes from idle; without a retry
 * a transient blip at boot would crash the API. Per-query transient errors are
 * handled by `withRetry()` for the hot read path.
 */
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt === maxAttempts) {
          this.logger.error(`Database connection failed after ${maxAttempts} attempts: ${msg}`);
          throw err;
        }
        const delayMs = Math.min(250 * 2 ** (attempt - 1), 4000); // 250ms,500,1000,2000...
        this.logger.warn(`DB connect attempt ${attempt}/${maxAttempts} failed (${msg}); retrying in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run a query with retry on transient connection errors (Prisma P1001/P1002,
   * "Can't reach database server"). Use for important reads/writes that should
   * survive a serverless cold-resume blip rather than surfacing a 500.
   */
  async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastErr: unknown;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const code = (err as { code?: string })?.code;
        const msg = err instanceof Error ? err.message : String(err);
        const transient = code === "P1001" || code === "P1002" || /can't reach database server/i.test(msg);
        if (!transient || i === attempts) throw err;
        const delayMs = 200 * i;
        this.logger.warn(`Transient DB error (${code ?? "?"}); retry ${i}/${attempts - 1} in ${delayMs}ms`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    throw lastErr;
  }
}
