import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { envSchema } from "./config/env";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { ItemsModule } from "./modules/items/items.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PayoutsModule } from "./modules/payouts/payouts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { DatabaseModule } from "./common/database/database.module";
import { QueuesModule } from "./queues/queues.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    // Global IP rate limit: 120 requests per minute. Tighter limits on sensitive
    // routes (e.g. login) are applied per-endpoint with @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    QueuesModule,
    AuthModule,
    UsersModule,
    SellersModule,
    SubmissionsModule,
    ItemsModule,
    OrdersModule,
    PaymentsModule,
    PayoutsModule,
    NotificationsModule,
    SearchModule,
    UploadsModule,
    ReviewsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    // Apply the rate limiter globally.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
