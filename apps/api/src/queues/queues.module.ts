import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config";
import { URL } from "url";
import { NOTIFICATION_QUEUE, PAYOUT_QUEUE, SEARCH_SYNC_QUEUE, IMAGE_MIGRATE_QUEUE } from "./queue.constants";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.get<string>("REDIS_URL")!);
        const tls = redisUrl.protocol === "rediss:";
        return {
          redis: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || (tls ? 6379 : 6380),
            username: redisUrl.username || "default",
            password: decodeURIComponent(redisUrl.password),
            tls: tls ? { rejectUnauthorized: false } : undefined,
            // Resilience: keep reconnecting with backoff instead of crashing the
            // process when Redis is briefly unreachable. maxRetriesPerRequest:null
            // is required by Bull and stops commands from throwing while offline.
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: (times: number) => Math.min(times * 200, 5000),
            reconnectOnError: () => true,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: PAYOUT_QUEUE },
      { name: SEARCH_SYNC_QUEUE },
      { name: IMAGE_MIGRATE_QUEUE }
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
