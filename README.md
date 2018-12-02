# docker-autobuild

Because sometimes Docker Hub's autobuild function just won't cut it.

## Description

This is a homegrown replacement for Docker Hub's autobuild. In theory, it's a convenient system, but it can sometimes take hours to get a build to finish. This will let you build the container on your own hardware and push it to Docker Hub automatically when it's complete.

This will:

*  Listen for a `push` webhook from Github
*  Look in config.json for a matching config entry
*  Pull the repo
*  Checkout the correct commit
*  Build the container
*  Push it to Docker Hub
*  Notify you via Pushbullet when it's done

## Deployment

The easiest thing to do is deploy this with docker:

* Create a config file somewhere:

`curl https://raw.githubusercontent.com/tedkulp/docker-autobuilder/master/config/config.json.example > config.json`

* Modify config file with actual credentials
* Run w/ docker:

``docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -p 3000:3000 -v `pwd`/config:/app/config tedkulp/docker-autobuilder:latest``

* Create _push_ webhook in repository to point to `https://mynodeserver:3000/webhooks`
* Profit?
