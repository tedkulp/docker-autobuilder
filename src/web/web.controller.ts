import {
  Body,
  Controller,
  Get,
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

  constructor(private webService: WebService) {}

  @Get('trigger/:project_id/:branch?')
  async trigger(
    @Param('project_id') projectId: string,
    @Param('branch') branch = 'master',
  ) {
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

  @Post('webhook')
  async webhook(@Body() body: PushEvent) {
    const { projectId, branch, commitId, project } =
      this.webService.parsePushEvent(body);

    if (!projectId || !branch) {
      this.logger.error('Invalid webhook payload');
      throw new HttpException(
        'Invalid push event payload',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    this.logger.debug(
      `Received webhook payload for project: ${projectId}, branch: ${branch}, commit: ${commitId}`,
    );

    if (!project) {
      throw new HttpException('Project Not Found', HttpStatus.NOT_FOUND);
    }

    this.webService.startBuild(project, branch, commitId);

    return project;
  }
}
