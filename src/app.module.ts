import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DockerModule } from './docker/docker.module';
import { GitModule } from './git/git.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebModule } from './web/web.module';

@Module({
  imports: [
    DockerModule,
    GitModule,
    WebModule,
    ConfigModule,
    NotificationsModule,
  ],
})
export class AppModule {}
