FoundKey Setup and Installation Guide
================================================================

We thank you for your interest in setting up your FoundKey server!
This guide describes how to install and setup FoundKey.

----------------------------------------------------------------

*1.* Create FoundKey user
----------------------------------------------------------------
Running FoundKey as root is not a good idea. Create a separate user to run FoundKey.
In debian for exemple :

```sh
adduser --disabled-password --disabled-login foundkey
```

*2.* Install dependencies
----------------------------------------------------------------
FoundKey requires the following packages to run:

#### Dependencies :package:
* **[Node.js](https://nodejs.org/en/)** (16.x)
* **[PostgreSQL](https://www.postgresql.org/)** (12.x / 13.x is preferred)
* **[Redis](https://redis.io/)**
* A C/C++ compiler toolchain like **GCC** or **Clang**.
* **[Python](https://python.org/)** (3.x)

##### Optional
* [Yarn](https://yarnpkg.com/) - *Optional but recommended for security reasons. If you won't install it, use `npx yarn` instead of `yarn`.*
* [FFmpeg](https://www.ffmpeg.org/)

To install the dependiencies on Debian (or derivatives like Ubuntu) you can use the following commands:
```sh
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install build-essential python nodejs postgresql redis

# Optional dependencies
apt install ffmpeg
corepack enable # for yarn
```
Other OSes will have different package names and package managers to install the dependencies.

*3.* Install FoundKey
----------------------------------------------------------------
1. Connect to the `foundkey` user

	`su - foundkey`

2. Clone the FoundKey repository

	`git clone --recursive https://akkoma.dev/FoundKeyGang/FoundKey`

3. Navigate to the repository

	`cd foundkey`

4. Install FoundKey's dependencies

	`yarn install`

*4.* Configure FoundKey
----------------------------------------------------------------
1. Copy the `.config/example.yml` and rename it to `default.yml`.

	`cp .config/example.yml .config/default.yml`

2. Edit `default.yml`

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

*7.* That is it.
----------------------------------------------------------------
Well done! Now, you can begin using FoundKey.

### Launch normally
Just `NODE_ENV=production npm start`. GLHF!

### Launch with systemd

1. Create a systemd service here

	`/etc/systemd/system/foundkey.service`

2. Edit it, and paste this and save:

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

3. Reload systemd and enable the foundkey service.

	`systemctl daemon-reload ; systemctl enable foundkey`

4. Start the foundkey service.

	`systemctl start foundkey`

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
