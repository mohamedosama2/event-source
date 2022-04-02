import { CacheModule, Module, UseInterceptors } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PhoneConfirmationModule } from './phone-confirmation/phone-confirmation.module';
import { DatabaseModule } from './database.module';
import { ChatModule } from './chat/chat.module';
import { MessageQueueModule } from './message-queue/message-queue-publisher.module';
import { CacheConfigService } from './cache/cacheConfigService';
import { cacheOperationsModule } from './cache/cache.module';
import { NotificationModule } from './notification/notification.module';
import { RateModule } from './rate/rate.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PhoneConfirmationModule,
    ChatModule,
    NotificationModule,
    RateModule,
    // MessageQueueModule,
    // cacheOperationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
