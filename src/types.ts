export type ConfigCredentials = {
  github: Record<string, string>;
  docker_hub: Record<string, string>;
  apprise?: Record<string, string>;
};

export type ConfigProject = {
  // test:
  //   github: user/repo
  //   docker_hub: user/repo
  //   branches:
  //     master: latest
  //     '*': '{branch_name}'
  //   notifications:
  //     - pushbullet
  //     - telegram
  github: string;
  docker_hub: string;
  branches: Record<string, string>;
  notifications?: string[];
};
