const express = require('express');
const bodyParser = require('body-parser');
const shutdownMgr = require('@moebius/http-graceful-shutdown');

const handler = require('./src/handler');

const app = express();
app.use(bodyParser.json());
app.get('/ping', (req, res) => res.send('PONG'));
app.post('/webhook', handler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

const shutdownManager = new shutdownMgr.GracefulShutdownManager(server);
var shuttingDown = false;

// Handle ctrl-c
const shutdown = async () => {
    if (!shuttingDown) {
        shuttingDown = true;
    } else {
        return;
    }

    console.log('Shutting down gracefully');

    shutdownManager.terminate(() => {
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGUSR2', shutdown);
