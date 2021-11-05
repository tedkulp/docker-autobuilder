import { Injectable, Logger } from '@nestjs/common';
import * as execa from 'execa';
import { createInterface } from 'readline';
import { ConfigService } from 'src/config/config.service';
import { ConfigProject } from 'src/types';
import { Readable } from 'stream';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {}

  private linkLogger(stream: Readable, cb: (message: string) => void) {
    createInterface({
      input: stream,
    }).on('line', (line) => {
      cb(`apprise: ${line}`);
    });
  }

  private getCredentialsForProject(project: ConfigProject): string[] {
    const creds = this.configService.getCredentials('apprise');
    return (
      project?.notifications?.map((v) => creds[v]).filter((x) => !!x) || []
    );
  }

  async sendNotification(project: ConfigProject, title: string, body: string) {
    const creds = this.getCredentialsForProject(project);
    this.logger.verbose(`Found creds: ${JSON.stringify(creds)}`);
    if (!creds.length) return;

    const args = ['--title', title, '--body', body, '-vvv'];

    let result = false;

    try {
      const child = execa('apprise', [...args, ...creds]);

      this.linkLogger(child.stdout, (msg) => this.logger.debug(msg));
      this.linkLogger(child.stderr, (msg) => this.logger.error(msg));

      // Wait for the promise to finish and send out log messages
      await child;

      result = child.exitCode === 0;
    } catch (err) {
      this.logger.error(err);
    }

    return result;
  }
}
