# Migrating to FoundKey

Migrating from Misskey to FoundKey is relatively straightforward. However, additional steps are required as there are significant changes between the two projects.

## Backup
The process will take some time and it's possible something will go wrong. It's highly suggested to make a database dump using `pgdump` and backing up `.config/default.yml` and the `files/` directory before proceeding any further.

## Requirements
FoundKey has different version requirements compared to Misskey. Before continuing please check if you have the following minimum versions installed:
* Node (version 18)
* Postgresql (version 12)

## Reverting migrations
If you're migrating from Misskey 12.112.0 or higher, you'll need to revert some database migrations as they have diverged from that point. Specifically, you'll need to revert `nsfwDetection1655368940105` and newer migrations.

Run the following to revert those migrations:
```sh
cd packages/backend

LINE_NUM="$(npx typeorm migration:show -d ormconfig.js | grep -n nsfwDetection1655368940105 | cut -d ':' -f 1)"
NUM_MIGRATIONS="$(npx typeorm migration:show -d ormconfig.js | tail -n+"$LINE_NUM" | grep '\[X\]' | nl)"

for i in $(seq 1 $NUM_MIGRAIONS); do
	npx typeorm migration:revert -d ormconfig.js
done
```

## Switching repositories
To switch to the FoundKey repository, do the following in your Misskey install location:
```sh
git remote set-url origin https://akkoma.dev/FoundKeyGang/FoundKey.git
git fetch origin
```
We recommend using a local branch and merging in upstream releases as they get tagged. This allows for easy local customization of your install.

For example, say your local branch is `toast.cafe` and you want to use release `v13.0.0-preview1`. To create that branch:
```sh
git checkout tags/v13.0.0-preview1 -b toast.cafe
```

When a new release comes out, simply fetch and merge in the new tag. Here we opt to squash upstream commits as it allows for easy reverts in case something goes wrong.
```sh
git fetch -t
git merge tags/v13.0.0-preview2 --squash
  # you are now on the "next" release
```

## Making sure modern Yarn works
FoundKey uses modern Yarn instead of Classic (1.x) using [Corepack](https://github.com/nodejs/corepack). To make sure the `yarn` command will work going forward, run `corepack enable`.

If you previously had Yarn installed manually you have to remove it and install Corepack:
```sh
npm uninstall -g yarn
npm install -g corepack
corepack enable
```

## Rebuilding and running database migrations
This will be pretty much the same as a regular update of Misskey. Note that `yarn install` may take a while since dependency versions have been updated or removed and we use a newer version of Yarn.
```sh
yarn install
NODE_ENV=production yarn build
yarn migrate
```
If you encounter issues during the build process run `yarn clean-all` and run the install and build command again.

## Restarting your instance
To let the changes take effect restart your instance as usual:
```sh
# Systemd
systemctl restart misskey

# OpenRC
rc-service misskey restart
```

## Need help?
If you have any questions or troubles, feel free to contact us on IRC: `#foundkey` on `irc.akkoma.dev`, port `6697` with SSL
