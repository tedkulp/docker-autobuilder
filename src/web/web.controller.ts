import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { PushEvent } from '@octokit/webhooks-types';

import { WebService } from './web.service';

@Controller()
export class WebController {
  private readonly logger = new Logger(WebController.name);

  constructor(private webService: WebService) { }

  @Get('trigger/:project_id/:branch?')
  async triggerGet(
    @Param('project_id') projectId: string,
    @Param('branch') branch = 'master',
  ) {
    return this.trigger(projectId, branch);
  }

  @Post('trigger/:project_id/:branch?')
  async triggerPost(
    @Param('project_id') projectId: string,
    @Param('branch') branch = 'master',
  ) {
    return this.trigger(projectId, branch);
  }

  private trigger(projectId: string, branch = 'master') {
    this.logger.debug(
      `Received trigger for project: ${projectId}, branch: ${branch}`,
    );

    const foundProject = this.webService.getProject(projectId);
    if (!foundProject) {
      throw new HttpException('Project Not Found', HttpStatus.NOT_FOUND);
    }

    this.webService.startBuild(foundProject, branch);

    return foundProject;
  }

  @Post('webhook/github')
  async githubWebhook(@Body() body: PushEvent, @Headers('x-hub-signature-256') signature: string) {
    const { projectId, branch, commitId, project } =
      this.webService.parseGithubPushEvent(body);

    if (!projectId || !branch) {
      this.logger.error('Invalid webhook payload');
      throw new HttpException(
        'Invalid push event payload',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (project?.github?.secret) {
      const isValid = await this.webService.checkGithubSignature(project, body, signature);
      if (!isValid) {
        this.logger.error('Payload failed validation');
        throw new HttpException(
          'Payload failed validation',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    }

    this.logger.debug(
      `Received Github push payload for project: ${projectId}, branch: ${branch}, commit: ${commitId}`,
    );

    if (!project) {
      throw new HttpException('Project Not Found', HttpStatus.NOT_FOUND);
    }

    this.webService.startBuild(project, branch, commitId);

    return project;
  }
}
