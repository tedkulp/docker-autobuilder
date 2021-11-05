import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { DockerModule } from 'src/docker/docker.module';
import { GitModule } from 'src/git/git.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

import { WebController } from './web.controller';
import { WebService } from './web.service';

@Module({
  imports: [ConfigModule, DockerModule, GitModule, NotificationsModule],
  providers: [WebService],
  controllers: [WebController],
})
export class WebModule {}
