const Git = require("nodegit");
const fs = require('fs-extra');

const cloneRepo = (cloneUrl) => {
    return fs.emptyDir('./tmp').then(() => {
        return Git.Clone(cloneUrl, "./tmp");
    });
}

const checkoutCommit = (repoObj, commitId) => {
    return repoObj
        .getCommit(commitId)
        .then(commit => {
            return Git.Checkout
                .tree(repoObj, commit, {checkoutStrategy: Git.Checkout.STRATEGY.SAFE})
                .then(function () {
                    return repoObj.setHeadDetached(commit, repoObj.defaultSignature, "Checkout: HEAD " + commit.id());
                });
        });
};

module.exports = {
    cloneRepo,
    checkoutCommit,
};
