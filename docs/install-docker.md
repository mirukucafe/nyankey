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

##Configure

Copy example configuration files with following:

```sh
cp .config/docker_example.yml .config/default.yml
cp .config/docker_example.env .config/docker.env
cp ./docker-compose.yml.example ./docker-compose.yml
```

Edit `default.yml` and `docker.env` according to the instructions in the files.

Edit `docker-compose.yml` if necessary. (e.g. if you want to change the port).

## Build and initialize
The following command will build FoundKey and initialize the database.
This will take some time.

``` shell
docker compose build
docker compose run --rm web pnpm run init
```

## Launch
You can start FoundKey with the following command:

```sh
docker compose up -d
```

## How to update your FoundKey server
When updating, be sure to check the [release notes](https://akkoma.dev/FoundKeyGang/FoundKey/src/branch/main/CHANGELOG.md) to know in advance the changes and whether or not additional work is required (in most cases, it is not).

```sh
git stash
git checkout master
git pull
git stash pop
docker compose build
docker compose stop && docker compose up -d
```

It may take some time depending on the contents of the update and the size of the database.

## How to execute CLI commands
```sh
docker compose run --rm web node packages/backend/built/tools/foo bar
```
