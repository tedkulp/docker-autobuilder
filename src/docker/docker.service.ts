import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';
import { join } from 'path';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private docker = new Docker();

  constructor(private configService: ConfigService) {}

  private displayStreamMessage(msg: { stream?: string; status?: string }) {
    const ex = msg?.stream || msg?.status;
    if (ex) {
      this.logger.debug(ex);
    }
  }

  async build(tagName: string) {
    const stream = await this.docker.buildImage(
      {
        context: join(__dirname, '..', '..', 'tmp'),
        src: ['.'],
      },
      {
        t: tagName,
      },
    );

    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(
        stream,
        (err, res) => {
          err && this.logger.error(err);
          return err ? reject(err) : resolve(res);
        },
        (msg) => this.displayStreamMessage(msg),
      );
    });
  }

  private generateAuthConfig() {
    const authConfig = {
      password: this.configService.get<string>(
        'credentials.docker_hub.password',
      ),
      serveraddress: 'https://index.docker.io/v1',
      username: this.configService.get<string>(
        'credentials.docker_hub.username',
      ),
    };

    if (this.configService.get('credentials.docker_hub.email')) {
      authConfig['email'] = this.configService.get<string>(
        'credentials.docker_hub.email',
      );
    }

    return authConfig;
  }

  async push(tagName: string) {
    const authConfig = this.generateAuthConfig();
    const img = this.docker.getImage(tagName);

    const stream = await img.push({
      authconfig: authConfig,
    });

    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(
        stream,
        (err, res) => {
          err && this.logger.error(err);
          return err ? reject(err) : resolve(res);
        },
        (msg) => this.displayStreamMessage(msg),
      );
    });
  }
}
