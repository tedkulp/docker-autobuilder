export type ConfigCredentials = {
  github: Record<string, string>;
  docker_hub: Record<string, string>;
  apprise?: Record<string, string>;
};

export type GithubProjectDetails = {
  repo: string;
  secret?: string;
};

export type ConfigProject = {
  // test:
  //   github:
  //     repo: user/repo
  //     secret: 12345
  //   docker_hub: user/repo
  //   branches:
  //     master: latest
  //     '*': '{branch_name}'
  //   notifications:
  //     - pushbullet
  //     - telegram
  github: GithubProjectDetails;
  docker_hub: string;
  branches: Record<string, string>;
  notifications?: string[];
};

export type BuildJob = {
  project: ConfigProject;
  githubBranch: string;
  commitId?: string;
};
