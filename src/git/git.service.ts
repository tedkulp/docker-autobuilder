import { Injectable, Logger } from '@nestjs/common';
import { emptyDir } from 'fs-extra';
import { Checkout, Clone, Commit, Oid, Repository } from 'nodegit';

const TMP_DIR = './tmp';

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);

  async cloneRepo(cloneUrl: string) {
    await emptyDir(TMP_DIR);
    return await Clone.clone(cloneUrl, TMP_DIR);
  }

  async checkoutBranch(repoObj: Repository, branchName: string) {
    const branch = await repoObj.getBranch(`remotes/origin/${branchName}`);
    return this.checkoutCommit(repoObj, branch.target());
  }

  async checkoutCommit(repoObj: Repository, commitId: string | Commit | Oid) {
    return repoObj.getCommit(commitId).then(async (commit) => {
      await Checkout.tree(repoObj, commit, {
        checkoutStrategy: Checkout.STRATEGY.SAFE,
      });

      const detachResult = repoObj.setHeadDetached(commit.id());
      return {
        result: detachResult,
        commitId: commitId.toString(),
      };
    });
  }
}
