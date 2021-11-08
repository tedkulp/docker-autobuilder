# docker-autobuild

## Description

Docker Hub recently made autobuilds an Pro-only feature. This container does basically the
same thing, but on your own infrastructure.

This will:

- Listen for a `push` webhook from Github
- Look in config.json for a matching config entry
- Pull the repo
- Checkout the correct commit
- Build the container
- Push it to Docker Hub
- Notify you via various notification methods when it's done

### Direct trigger

There is also an option to trigger a build directly without a push event.

Send a GET request to: `http://mynodeserver:3000/trigger/projectName/branchName`. This will
follow the same series of events as the webhook, but will checkout the tip of whatever branch
is in the URL.

## Deployment

The easiest thing to do is deploy this with docker:

- Create a config file somewhere:

`curl https://raw.githubusercontent.com/tedkulp/docker-autobuilder/master/config/config.yaml.example > config.yaml`

- Modify config file with actual credentials
- Run w/ docker:

`` docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -p 3000:3000 -v `pwd`/config.json:/app/config/config.json tedkulp/docker-autobuilder:latest ``

- Create _push_ webhook in repository to point to `http://mynodeserver:3000/webhook/github` and has a content type of `application/json`.
- Wait patiently for new docker container to be pushed to Docker Hub

### Redis

Docker-autobuilder does require redis for queueing builds. The default hostname is `localhost`, which can be overridden with the
`REDIS_HOST` environment variable. See the included docker-compose.yaml file for a idea on how to set it up.
