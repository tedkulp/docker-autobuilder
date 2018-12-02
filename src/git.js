const Git = require("nodegit");
const fs = require('fs-extra');

const cloneRepo = (cloneUrl) => {
    return fs.emptyDir('./tmp').then(() => {
        return Git.Clone(cloneUrl, "./tmp");
    });
}

const checkoutCommit = (repoObj, commitId) => {
    if (repoObj) {
        return repoObj.getCommit(commitId);
    }

    return Promise.reject();
};

module.exports = {
    cloneRepo,
    checkoutCommit,
};
