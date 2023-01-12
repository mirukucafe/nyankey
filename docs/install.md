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

## Install FoundKey
1. Login to the `foundkey` user

	`su - foundkey`

2. Clone the FoundKey repository

	`git clone --recursive https://akkoma.dev/FoundKeyGang/FoundKey foundkey`

3. Navigate to the repository

	`cd foundkey`

4. Install FoundKey's dependencies

	`yarn install`

## Configure FoundKey
1. Copy `.config/example.yml` to `.config/default.yml`.

	`cp .config/example.yml .config/default.yml`

2. Edit `default.yml` with a text editor
	- Make sure you set the PostgreSQL and Redis settings correctly.
	- Use a strong password for the PostgreSQL user and take note of it since it'll be needed later.

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

Run `systemctl --edit --full --force foundkey.service`, and paste the following:

```ini
[Unit]
Description=FoundKey daemon

[Service]
Type=simple
User=foundkey
ExecStart=/usr/bin/npm start
WorkingDirectory=/home/foundkey/foundkey
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
supervise_daemon_args=" -d /home/foundkey/foundkey -e NODE_ENV=\"production\""

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
Use git to pull in the latest changes and rerun the build and migration commands:

```sh
git pull
git submodule update --init
yarn install
# Use build-parallel if your system has 4GB or more RAM and want faster builds
NODE_ENV=production yarn build
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
