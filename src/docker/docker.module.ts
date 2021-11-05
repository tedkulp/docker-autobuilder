import { Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';

import { DockerService } from './docker.service';

@Module({
  imports: [ConfigModule],
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}
