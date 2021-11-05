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
  async webhook(@Body() _body: unknown) {
    return null;
  }
}
