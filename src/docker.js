const _ = require('lodash');
const Docker = require('dockerode');
const path = require('path');

const config = require('../config/config.json');

const dockerConn = new Docker();

const _displayStreamMessage = (msg) => {
    const ex = _.get(msg, 'stream');
    if (ex) {
        console.log(ex);
    }
}

const build = async (tagName) => {
    const stream = await dockerConn.buildImage({
        context: path.join(__dirname, '..', 'tmp'),
    }, {
        t: tagName,
    });

    return new Promise((resolve, reject) => {
        dockerConn.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res), _displayStreamMessage);
    });
};


const authconfig = {
    auth: '',
    email: _.get(config, 'credentials.docker_hub.email'),
    password: _.get(config, 'credentials.docker_hub.password'),
    serveraddress: 'https://index.docker.io/v1',
    username: _.get(config, 'credentials.docker_hub.username'),
};

const push = async (tagName) => {
    const img = await dockerConn.getImage(tagName);
    const stream = await img.push({
        authconfig,
    });

    return new Promise((resolve, reject) => {
        dockerConn.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res), _displayStreamMessage);
    });
};

module.exports = {
    build,
    push,
};
