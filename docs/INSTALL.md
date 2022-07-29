FoundKey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your FoundKey server!
This guide describes how to install and setup FoundKey.

----------------------------------------------------------------

*1.* Create FoundKey user
----------------------------------------------------------------
Running FoundKey as root is not a good idea. Create a separate user to run FoundKey.

In debian for example:

```sh
adduser --disabled-password --disabled-login foundkey
```

*2.* Install dependencies
----------------------------------------------------------------
FoundKey requires the following packages to run:

### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)** (16.x)
* **[PostgreSQL](https://www.postgresql.org/)** (12.x / 13.x is preferred)
* **[Redis](https://redis.io/)**

The following are needed to compile native npm modules:
* A C/C++ compiler toolchain like **GCC** or **Clang**.
* **[Python](https://python.org/)** (3.x)

### Optional
* [Yarn](https://yarnpkg.com/) - *If you decide not to install it, use `npx yarn` instead of `yarn`.*
* [FFmpeg](https://www.ffmpeg.org/)

To install the dependiencies on Debian (or derivatives like Ubuntu) you can use the following commands:
```sh
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install build-essential python3 nodejs postgresql redis

# Optional dependencies
apt install ffmpeg
corepack enable # for yarn
```
You will need to adapt this for whichever OS you are using to host FoundKey.

*3.* Install FoundKey
----------------------------------------------------------------
1. Connect to the `foundkey` user

	`su - foundkey`

2. Clone the FoundKey repository

	`git clone --recursive https://akkoma.dev/FoundKeyGang/FoundKey foundkey`

3. Navigate to the repository

	`cd foundkey`

4. Install FoundKey's dependencies

	`yarn install`

*4.* Configure FoundKey
----------------------------------------------------------------
1. Copy `.config/example.yml` to `.config/default.yml`.

	`cp .config/example.yml .config/default.yml`

2. Edit `default.yml` with a text editor
	- Make sure you set the PostgreSQL and Redis settings correctly.
	- Use a strong password for the PostgreSQL user and take note of it since it'll be needed later.

*5.* Build FoundKey
----------------------------------------------------------------

Build foundkey with the following:

`NODE_ENV=production yarn build`

If you're still encountering errors about some modules, use node-gyp:

1. `npx node-gyp configure`
2. `npx node-gyp build`
3. `NODE_ENV=production yarn build`

*6.* Init DB
----------------------------------------------------------------
1. Create the appropriate PostgreSQL users with respective passwords,
	and empty database as named in the configuration file.
	Make sure the database connection also works correctly when run from the
	user that will later run FoundKey, or it could cause problems later.
	The encoding of the database should be UTF-8.

```sh
sudo -u postgres psql
```

```sql
create database foundkey with encoding = 'UTF8';
create user foundkey with encrypted password '{YOUR_PASSWORD}';
grant all privileges on database foundkey to foundkey;
\q
```

2. Run the database initialisation
	`yarn run init`

*7.* Running FoundKey
----------------------------------------------------------------
Well done! Now, you can begin using FoundKey.

### Launching manually
Run `NODE_ENV=production npm start` to launch FoundKey manually. To stop the server, use Ctrl-C.

### Launch with systemd

1. Run `systemctl --edit --full --force foundkey.service`, and paste the following:

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

2. Save the file, then enable and start FoundKey.

	`systemctl enable --now foundkey`


You can check if the service is running with `systemctl status foundkey`.

### Launch with OpenRC

1. Copy the following text to `/etc/init.d/foundkey`:

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

2. Set the service to start on boot

	`rc-update add foundkey`

3. Start the FoundKey service

	`rc-service foundkey start`

You can check if the service is running with `rc-service foundkey status`.

### How to update your FoundKey server to the latest version
1. `git pull`
2. `git submodule update --init`
3. `yarn install`
4. `NODE_ENV=production yarn build`
5. `yarn migrate`
6. Restart your FoundKey process to apply changes
7. Enjoy

If you encounter any problems with updating, please try the following:
1. `yarn clean` or `yarn cleanall`
2. Retry update (Don't forget `yarn install`)

----------------------------------------------------------------

If you have any questions or troubles, feel free to contact us on IRC (`#foundkey` on `irc.akkoma.dev`, port `6697` with SSL)!
