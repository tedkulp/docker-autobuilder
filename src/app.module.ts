import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DockerModule } from './docker/docker.module';
import { GitModule } from './git/git.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebModule } from './web/web.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
      },
    }),
    ConfigModule,
    DockerModule,
    GitModule,
    NotificationsModule,
    WebModule,
  ],
})
export class AppModule {}
