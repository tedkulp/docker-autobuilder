import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Webhooks } from '@octokit/webhooks';
import { PushEvent } from '@octokit/webhooks-types';
import { Job, Queue } from 'bull';
import { ConfigService } from 'src/config/config.service';
import { DockerService } from 'src/docker/docker.service';
import { GitService } from 'src/git/git.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { BuildJob, ConfigProject } from 'src/types';

@Injectable()
@Processor('build')
export class WebService {
  private readonly logger = new Logger(WebService.name);

  constructor(
    private configService: ConfigService,
    private gitService: GitService,
    private dockerService: DockerService,
    private notificationService: NotificationsService,
    @InjectQueue('build') private readonly buildQueue: Queue,
  ) {}

  parseGithubPushEvent(body: PushEvent): {
    projectId: any;
    branch: any;
    commitId: any;
    repo: any;
    project: ConfigProject;
  } {
    this.logger.verbose(body);

    const fullName = body.repository?.full_name;
    // TODO: This is gross
    const { projectId, project } = this.getProjectFromRepo(fullName) || {
      projectId: undefined,
      project: undefined,
    };

    const result = {
      projectId: projectId,
      branch: body.ref,
      commitId: body.after,
      repo: fullName,
      project: project,
    };

    this.logger.verbose(result);

    return result;
  }

  async checkGithubSignature(
    project: ConfigProject,
    body: PushEvent,
    signature: string,
  ) {
    const wh = new Webhooks({ secret: project?.github?.secret.toString() });
    return wh.verify(body, signature);
  }

  getProjectFromRepo(repo: string): {
    project?: ConfigProject;
    projectId?: string;
  } {
    const projects =
      this.configService.get<Record<string, ConfigProject>>('projects');

    const projectId = Object.keys(projects).find(
      (projectId) => repo === projects[projectId]?.github?.repo,
    );

    return {
      project: projects[projectId] || undefined,
      projectId: projectId,
    };
  }

  getProject(projectId: string): ConfigProject | undefined {
    const projects =
      this.configService.get<Record<string, ConfigProject>>('projects');

    return projects[projectId] || undefined;
  }

  getDockerTagFromBranchName(project: ConfigProject, branchName = 'master') {
    if (!project || !project.branches || !branchName) return;

    const branches = project.branches;
    const regex = new RegExp('{branch_name}', 'g');

    // Replace logic is used when parsing webhooks from
    // github, as all of the branch names have their full
    // ref path.  It's redundant when using trigger.
    branchName = branchName.replace('refs/heads/', '');

    if (branches[branchName]) {
      return branches[branchName].replace(regex, branchName);
    }

    if (branches['*']) {
      return branches['*'].replace(regex, branchName);
    }
  }

  private sendBuildNotification(
    project: ConfigProject,
    success: boolean,
    msg?: string,
  ) {
    let body = `${project.docker_hub} built and pushed successfully!`;
    if (!success) {
      body = `${project.docker_hub} had errors building`;
      if (msg) {
        body += `\n${msg}`;
      }
    }

    const emoji = success ? '✅' : '❌';

    this.notificationService.sendNotification(
      project,
      `${emoji} Docker-autobuilder ${emoji}`,
      body,
    );
  }

  async startBuild(
    project: ConfigProject,
    githubBranch = 'master',
    commitId?: string,
  ) {
    await this.buildQueue.add('build', {
      project,
      githubBranch,
      commitId,
    });
  }

  @Process('build')
  async handleBuild(job: Job<BuildJob>) {
    this.logger.verbose(`Received job: ${JSON.stringify(job)}`);

    const { project, githubBranch, commitId } = job.data;

    const dockerTag = this.getDockerTagFromBranchName(project, githubBranch);
    const fullPathToDest = `${project.docker_hub}:${dockerTag}`;

    if (!dockerTag) {
      this.logger.debug(`No tag found for ${project}:${githubBranch}`);
      return;
    }

    this.logger.debug(
      `Starting build of repo ${project.github.repo}:${githubBranch} to ${fullPathToDest}`,
    );

    const repo = await this.gitService.cloneRepo(
      `https://github.com/${project.github.repo}.git`,
    );

    this.logger.verbose(JSON.stringify(repo));

    if (repo) {
      const commit = commitId
        ? await this.gitService.checkoutCommit(repo, commitId)
        : await this.gitService.checkoutBranch(repo, githubBranch);
      this.logger.verbose(commit, 'commit');

      if (commit && commit.result === 0) {
        await this.dockerService.build(fullPathToDest).catch((err) => {
          this.sendBuildNotification(project, false, err);
          this.logger.error(err, 'Error During Build');
          throw err;
        });
        this.logger.debug('build complete');

        await this.dockerService.push(fullPathToDest).catch((err) => {
          this.logger.error(err, 'Error During Push');
          this.sendBuildNotification(project, false, err);
          throw err;
        });
        this.logger.debug('push complete');

        this.sendBuildNotification(project, true);
      }
    }
  }
}
