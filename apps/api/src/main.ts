import "reflect-metadata";
import { EventEmitter } from "events";
// Bull opens several Redis connections (one per queue × client/subscriber/bclient),
// each attaching error/ready/end listeners to a shared emitter — this legitimately
// exceeds Node's default of 10. Raise the cap to silence the false-positive warning.
EventEmitter.defaultMaxListeners = 25;
import * as Sentry from "@sentry/node";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

// Initialise error tracking as early as possible. No-op when SENTRY_DSN is unset
// (e.g. local dev), so it's safe to always call.
if (process.env["SENTRY_DSN"]) {
  Sentry.init({
    dsn: process.env["SENTRY_DSN"],
    environment: process.env["NODE_ENV"] ?? "development",
    tracesSampleRate: 0.1,
  });
}

async function bootstrap() {
  // rawBody is required so Stripe webhook signatures can be verified
  // against the exact bytes that were signed.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Graceful shutdown: on SIGTERM/SIGINT, run OnModuleDestroy hooks so Prisma
  // disconnects and Bull queues close cleanly before the process exits.
  app.enableShutdownHooks();

  // Security headers (CSP, HSTS, no-sniff, frameguard, etc.).
  app.use(helmet());

  app.setGlobalPrefix("v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const allowedOrigins = [
    process.env["NEXT_PUBLIC_STOREFRONT_URL"] ?? "http://localhost:3000",
    process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002",
    process.env["NEXT_PUBLIC_ADMIN_URL"] ?? "http://localhost:3003",
  ];

  // Fail fast on misconfiguration: never allow localhost origins in production.
  if (process.env["NODE_ENV"] === "production") {
    const localhostOrigins = allowedOrigins.filter((o) => /localhost|127\.0\.0\.1/.test(o));
    if (localhostOrigins.length > 0) {
      throw new Error(
        `CORS misconfigured for production — localhost origins not allowed: ${localhostOrigins.join(", ")}. ` +
          "Set NEXT_PUBLIC_STOREFRONT_URL / NEXT_PUBLIC_SELLER_URL / NEXT_PUBLIC_ADMIN_URL to your real domains."
      );
    }
  }

  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = process.env["PORT"] ?? 3001;
  await app.listen(port);
}

bootstrap();
