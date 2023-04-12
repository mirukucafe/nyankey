# Create FoundKey instance with Docker Compose

This guide describes how to install and setup FoundKey with Docker Compose.

**WARNING:**
Never change the domain name (hostname) of an instance once you start using it!


## Requirements
- Docker or Podman
- Docker Compose plugin (or podman-compose)

If using Podman, replace `docker` with `podman`. Commands using `docker compose` should be replaced with `podman-compose`.

You may need to prefix `docker` commands with `sudo` unless your user is in the `docker` group or you are running Docker in rootless mode.

## Get the repository
```sh
git clone https://akkoma.dev/FoundKeyGang/FoundKey.git
cd FoundKey
```

To make it easier to perform your own changes on top, we suggest making a branch based on the latest tag.
In this example, we'll use `v13.0.0-preview1` as the tag to check out and `my-branch` as the branch name.
```sh
git checkout tags/v13.0.0-preview1 -b my-branch
```

## Configure

Copy example configuration files with following:

```sh
cp .config/docker_example.yml .config/default.yml
cp .config/docker_example.env .config/docker.env
```

Edit `default.yml` and `docker.env` according to the instructions in the files.
You will need to set the database host to `db` and Redis host to `redis` in order to use the internal container network for these services.


Edit `docker-compose.yml` if necessary. (e.g. if you want to change the port).
If you are using SELinux (eg. you're on Fedora or a RHEL derivative), you'll want to add the `Z` mount flag to the volume mounts to allow the containers to access the contents of those volumes.

## Build and initialize
The following command will build FoundKey and initialize the database.
This will take some time.

``` shell
docker compose build
docker compose run --rm web yarn run init
```

## Launch
You can start FoundKey with the following command:

```sh
docker compose up -d
```

In case you are encountering issues, you can run `docker compose logs -f` to get the log output of the running containers.

## How to update your FoundKey server
When updating, be sure to check the [release notes](https://akkoma.dev/FoundKeyGang/FoundKey/src/branch/main/CHANGELOG.md) to know in advance the changes and whether or not additional work is required (in most cases, it is not).

To update your branch to the latest tag (in this example `v13.0.0-preview2`), you can do the following:
```sh
git fetch -t

# Use --squash if you want to merge all of the changes in the tag into a single commit.
# Useful if you have made additional changes.
git merge tags/v13.0.0-preview2

# Rebuild and restart the docker container.
docker compose build
docker compose down && docker compose up -d
```

It may take some time depending on the contents of the update and the size of the database.

## How to execute CLI commands
```sh
docker compose run --rm web node packages/backend/built/tools/foo bar
```
