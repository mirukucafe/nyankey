# FoundKey Setup and Installation Guide

This guide will assume that you have administrative rights, either as root or a user with sudo permissions. If you are using a non-root user, prefix the commands with `sudo` except when you are logged into the foundkey user with `su`.

This guide will also assume you're using Debian or a derivative like Ubuntu. If you are using another OS, you will need to adapt the comamnds and package names to match those that your OS uses.

## Install dependencies
FoundKey requires the following packages to run:

### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)** (18.x)
* **[PostgreSQL](https://www.postgresql.org/)** (12.x minimum; 13.x+ is preferred)
* **[Redis](https://redis.io/)**
* **[Yarn](https://yarnpkg.com/)**

The following are needed to compile native npm modules:
* A C/C++ compiler like **GCC** or **Clang**
* Build tools like **make**
* **[Python](https://python.org/)** (3.x)

### Optional
* [FFmpeg](https://www.ffmpeg.org/)

To install the dependiencies on Debian (or derivatives like Ubuntu) you can use the following commands:
```sh
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install build-essential python3 nodejs postgresql redis
corepack enable # for yarn

# Optional dependencies
apt install ffmpeg
```

## Create FoundKey user
Create a separate non-root user to run FoundKey:

```sh
adduser --disabled-password --disabled-login foundkey
```

The following steps will require logging into the `foundkey` user, so do that now.
```sh
su - foundkey
```

## Install FoundKey
We recommend using a local branch and merging in upstream releases as they get tagged. This allows for easy local customization of your install.

First, clone the FoundKey repo:
```sh
git clone https://akkoma.dev/FoundKeyGang/FoundKey
cd FoundKey
```

Now create your local branch. In this example, we'll be using `toast.cafe` as the local branch name and release `v13.0.0-preview1` as the tag to track. To create that branch:
```sh
git checkout tags/v13.0.0-preview1 -b toast.cafe
```

Updating will be covered in a later section. For now you'll want to install the dependencies using Yarn:
```sh
yarn install
```

## Configure FoundKey
1. Copy `.config/example.yml` to `.config/default.yml`.

	`cp .config/example.yml .config/default.yml`

2. Edit `default.yml` with a text editor
	- Make sure you set the PostgreSQL and Redis settings correctly.
	- Use a strong password for the PostgreSQL user and take note of it since it'll be needed later.

### Reverse proxy
For production use and for HTTPS termination you will have to use a reverse proxy.
There are instructions for setting up [nginx](./nginx.md) for this purpose.

### Changing the default Reaction
You can change the default reaction that is used when an ActivityPub "Like" is received from '👍' to '⭐' by changing the boolean value `meta.useStarForReactionFallback` in the databse respectively.

### Environment variables
There are some behaviour changes which can be accomplished using environment variables.

|variable name|meaning|
|---|---|
|`FK_ONLY_QUEUE`|If set, only the queue processing will be run. The frontend will not be available. Cannot be combined with `FK_ONLY_SERVER` or `FK_DISABLE_CLUSTERING`.|
|`FK_ONLY_SERVER`|If set, only the frontend will be run. Queues will not be processed. Cannot be combined with `FK_ONLY_QUEUE` or `FK_DISABLE_CLUSTERING`.|
|`FK_NO_DAEMONS`|If set, the server statistics and queue statistics will not be run.|
|`FK_DISABLE_CLUSTERING`|If set, all work will be done in a single thread instead of different threads for frontend and queue. (not recommended)|
|`FK_WITH_LOG_TIME`|If set, a timestamp will be appended to all log messages.|
|`FK_SLOW`|If set, all requests will be delayed by 3s. (not recommended, useful for testing)|
|`FK_LOG_LEVEL`|Sets the log level. Messages below the set log level will be suppressed. Available log levels are `quiet` (suppress all), `error`, `warning`, `success`, `info`, `debug`.|

If the `NODE_ENV` environment variable is set to `testing`, then the flags `FK_DISABLE_CLUSTERING` and `FK_NO_DAEMONS` will always be set, and the log level will always be `quiet`.

## Build FoundKey

Build foundkey with the following:

`NODE_ENV=production yarn build`

If your system has at least 4GB of RAM, run `NODE_ENV=production yarn build-parallel` to speed up build times.

If you're still encountering errors about some modules, use node-gyp:

1. `npx node-gyp configure`
2. `npx node-gyp build`
3. `NODE_ENV=production yarn build`

## Setting up the database
Create the appropriate PostgreSQL users with respective passwords, and empty database as named in the configuration file.
	
Make sure the database connection also works correctly when run from the user that will later run FoundKey, or it could cause problems later. The encoding of the database should be UTF-8.

```sh
sudo -u postgres psql
```

```sql
create database foundkey with encoding = 'UTF8';
create user foundkey with encrypted password '{YOUR_PASSWORD}';
grant all privileges on database foundkey to foundkey;
\q
```

Next, initialize the database:
	`yarn run init`

## Running FoundKey
You can either run FoundKey manually or use the system service manager to start FoundKey automatically on startup.

### Launching manually
Run `NODE_ENV=production npm start` to launch FoundKey manually. To stop the server, use Ctrl-C.

### Launch with systemd

Run `systemctl edit --full --force foundkey.service`, and paste the following:

```ini
[Unit]
Description=FoundKey daemon

[Service]
Type=simple
User=foundkey
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/foundkey/FoundKey
Environment="NODE_ENV=production"
TimeoutSec=60
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=foundkey
Restart=always

[Install]
WantedBy=multi-user.target
```

Save the file, then enable and start FoundKey.
```sh
systemctl enable --now foundkey
```

You can check if the service is running with `systemctl status foundkey`.

### Launch with OpenRC

Copy the following text to `/etc/init.d/foundkey`:

```sh
#!/sbin/openrc-run

name=foundkey
description="FoundKey daemon"

command="/usr/bin/npm"
command_args="start"
command_user="foundkey"

supervisor="supervise-daemon"
supervise_daemon_args=" -d /home/foundkey/FoundKey -e NODE_ENV=\"production\""

pidfile="/run/${RC_SVCNAME}.pid"

depend() {
	need net
	use logger

	# alternatively, uncomment if using nginx reverse proxy
	#use logger nginx
}
```

Mark the script as executable and enable the service to start on boot:

```sh
chmod +x /etc/init.d/foundkey
rc-update add foundkey
```

Start the FoundKey service:

```sh
rc-service foundkey start
```

You can check if the service is running with `rc-service foundkey status`.

### Updating FoundKey
When a new release comes out, simply fetch and merge in the new tag. If you plan on making additional changes on top of that tag, we suggest using the `--squash` option with `git merge`.
```sh
git fetch -t
git merge tags/v13.0.0-preview2
# you are now on the "next" release
```

Now you'll want to update your dependencies and rebuild:
```sh
yarn install
# Use build-parallel if your system has 4GB or more RAM and want faster builds
NODE_ENV=production yarn build
```

Next, run the database migrations:
```sh
yarn migrate
```

Then restart FoundKey if it's still running.
```sh
# Systemd
systemctl restart foundkey

# OpenRC
rc-service foundkey restart
```

If you encounter any problems with updating, please try the following:
1. `yarn clean` or `yarn cleanall`
2. Retry update (Don't forget `yarn install`)

## Need Help?
If you have any questions or troubles, feel free to contact us on IRC: `#foundkey` on `irc.akkoma.dev`, port `6697` with SSL
