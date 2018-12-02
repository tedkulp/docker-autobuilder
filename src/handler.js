const _ = require('lodash');
const PushBullet = require('pushbullet');

const git = require('./git');
const docker = require('./docker');
const config = require('../config/config.json');

const findItemInConfig = (repoName) => {
    if (!config) {
        return config;
    }

    return config.repos.find(item => {
        return _.get(item, 'github.repo') === repoName;
    });
};

const findTagInConfig = (foundConfig, branchName) => {
    const branches = _.get(foundConfig, 'branches', {});
    const regex = new RegExp('\{branch_name\}', 'g')

    branchName = branchName.replace('refs/heads/', '');

    if (branches[branchName]) {
        return branches[branchName].replace(regex, branchName);
    }

    if (branches['*']) {
        return branches['*'].replace(regex, branchName);
    }
};

const sendMessage = (foundConfig, title, message) => {
    const shouldSend = _.get(foundConfig, 'pushbullet.message', false);
    if (shouldSend) {
        const apiKey = _.get(config, 'credentials.pushbullet.apiKey');
        if (apiKey) {
            pusher = new PushBullet(apiKey);
            return pusher.note({}, title, message);
        }
    }

    return Promise.resolve();
};

const handler = async (req, res) => {
    console.log('We have a request');
    const repoName = _.get(req, 'body.repository.full_name');
    if (repoName) {
        const foundConfig = findItemInConfig(repoName);
        console.log('foundConfig', foundConfig);
        if (foundConfig) {
            const foundTag = findTagInConfig(foundConfig, _.get(req, 'body.ref'));
            console.log('foundTag', foundTag);
            if (foundTag) {
                const fullTagName = [_.get(foundConfig, 'docker_hub.repo'), foundTag].filter(e => !!e).join(':');
                console.log('fullTagName', fullTagName);
                const repoObj = await git.cloneRepo(_.get(req, 'body.repository.clone_url'));
                console.log('repoObj', repoObj);
                if (repoObj) {
                    const commit = await git.checkoutCommit(repoObj, _.get(req, 'body.after'));
                    if (commit) {
                        const finishBuild = await docker.build(fullTagName).catch(err => console.error('Error Building...', err));
                        if (finishBuild) {
                            docker.push(fullTagName).then((msgs) => {
                                return sendMessage(foundConfig, 'Finished Build', `Build has been pushed to ${fullTagName}`);
                            }).catch(err => console.error('Error Pushing to Docker Hub', err));
                        }
                    }
                }
            }
        }
    }
    res.send('OK');
};

module.exports = handler;
