# Contribution guide
We're glad you're interested in contributing to Foundkey! In this document you will find the information you need to contribute to the project.

The project uses English as its primary language. However due to being a fork of Misskey (which uses Japanese as its primary language) you may find things that are in Japanese.
If you make contributions (pull requests, commits, comments in newly added code etc.) we expect that these should be in English.

We won't mind if issues are not in English but we cannot guarantee we will understand you correctly.
However it might stíll be better if you write issues in your original language if you are not confident of your English skills because we might be able to use different translators or ask people to translate if we are not sure what you mean.
Please understand that in such cases we might edit your issue to translate it, to help us avoid duplicating issues.

## Development platform
FoundKey generally assumes that it is running on a Unix-like platform (e.g. Linux or macOS). If you are using Windows for development, we highly suggest using the Windows Subsystem for Linux (WSL) as the development environment. 

## Roadmap
See [ROADMAP.md](./ROADMAP.md)

## Issues
Issues are intended for feature requests and bug tracking.

For technical support or if you are not sure if what you are experiencing is a bug you can talk to people on the [IRC server](https://irc.akkoma.dev) in the `#foundkey` channel first.

Please do not close issues that are about to be resolved. It should remain open until a commit that actually resolves it is merged.

## Well-known branches
branch|what it's for
---|---
main|development branch
translate|managed by weblate, see [section about translation](#Translation)

For a production environment you might not want to follow the `main` branch directly but instead check out one of the git tags.

## Considerations to be made for all contributions

This project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).
Significant changes should be listed in the changelog (i.e. the file called `CHANGELOG.md`, see also section "Changelog Trailer" below).
Although Semantic Versioning talks about "the API", changes to the user interface should also be tracked.

Consider if any of the existing documentation has to be updated because of your contribution.

Some more points you might want to consider are:

- Scope
	- Are the goals of the PR clear?
	- Is the granularity of the PR appropriate?
- Security
	- Does merging this PR create a vulnerability?
- Performance
	- Will merging this PR cause unexpected performance degradation?
	- Is there a more efficient way?
- Testing
	- Does the test ensure the expected behavior?
	- Are there any omissions or gaps?
	- Does it check for anomalies?

## Code contributions

There are different "rules" of how you can contribute, depending on your access privileges to the repository.

### Without push access

If you do not have push access, you have to create a pull request to get your changes into Foundkey.
Someone with push access should review your contribution.
If they are satisfied that what you are doing seems like a good idea and the considerations from the section above are fulfilled, they can merge your pull request.
Or, they might request another member to also review your changes.
Please be patient as nobody is getting paid to do this, so it might take a bit longer.

### With push access

You can push stuff directly to any branch.
But y'know, "with great power comes great responsibility" and so on, be sensible.
We most likely will not kick you out if you made a mistake, it happens to the best.
But this of course means that the erroneous contributions may be either fixed or undone.

Alternatively, you can also proceed as for "without push access" above.
In this case it will be assumed that you wish for a review of the changes you want to make.
Instead of having someone else merge the pull request when they have approved your changes, you can also merge yourself if you think the given feedback is sufficient.

### Changelog Trailer

To keep track of changes that should go into the CHANGELOG, we use a standard [trailer](https://git-scm.com/docs/git-interpret-trailers).
For single-commits that should be included in the changeset, include the trailer directly.
For multiple commits, the merge commit (in case of a branch) or an empty final commit should include the trailer.

Valid values for the trailer are: "Added", "Changed", "Removed", "Fixed", "Security".
For breaking changes, include a "BREAKING:" in the summary.
Any additional notes should go into the commit body.

If you forget to include it, you can create an empty commit after the fact with it (`--allow-empty`).
Try not to include invalid values in the trailer.

Here is an example complete breaking commit with notes.

```
BREAKING: client: remove rooms

Rooms were removed by syuilo some time ago.
This commit is an example of what the changelog trailer usage is like.
Admins should ensure to run migrations on startup, else foundkey will fail to start.

Changelog: Removed
```

### Creating a PR

- Please prefix the title with the part of FoundKey you are changing, i.e. `server:` or `client:`
- The rest of the title should roughly describe what you did.
- Make sure that the granularity of this PR is appropriate. Please do not include more than one type of change in a single PR.
- If there is an issue which will be resolved by this PR, please include a reference to the Issue in the text.
- If you have added a feature or fixed a bug, please add a test case if possible.
- Please make sure that tests and Lint are passed in advance.
  - You can run it with `npm run test` and `npm run lint`. [See more info](#testing)
- Don't forget to update the changelog and/or documentation as appropriate (see above).

Thanks for your cooperation!

## Release

### Fork transition

**Note:**
Since Foundkey was forked from Misskey recently, there might be some breaking changes we want to make.
For this purpose there will be several pre-release versions of 13.0.0 (e.g. `13.0.0-preview1`).
Until major version 13 is released, the below process is not fully in effect.

### Release process
Before a stable version is released, there should be a comment period which should usually be 7 days to give everyone the chance to comment.
If a (critical) bug or similar is found during the comment period, the release may be postponed until a fix is found.
For commenting, an issue should be created, and the comment period should also be announced in the `#foundkey-dev` [IRC](https://irc.akkoma.dev) channel.

Pre-releases do not require as much scrutiny and can be useful for "field testing" before a stable release is made.

All releases are managed as git tags.
If the released version is 1.2.3, the git tag should be "v1.2.3".
Pre-releases are marked "previewN".
The first pre-release for 1.2.3 should be tagged "v1.2.3-preview1".
The tag should be a "lightweight" tag (not annotated) of the commit that modifies the CHANGELOG and package.json version.

To generate the changelog, we use a standard shortlog command: `git shortlog --format='%h %s' --group=trailer:changelog LAST_TAG..`.
The person performing the release process should build the next CHANGELOG section based on this output, not use it as-is.
Full releases should also remove any pre-release CHANGELOG sections.

Here is the step by step checklist:
1. If **stable** release, announce the comment period. Restart the comment period if a blocker bug is found and fixed.
2. Edit various `package.json`s to the new version.
3. Write a new entry into the changelog.
   You should use the `git shortlog --format='%h %s' --group=trailer:changelog LAST_TAG..` command to get general data,
   then rewrite it in a human way.
4. Tag the commit with the changes in 2 and 3 (if together, else the latter).

## Translation

[![Translation status](http://translate.akkoma.dev/widgets/foundkey/-/svg-badge.svg)](http://translate.akkoma.dev/engage/foundkey/)

<small>a.k.a. Localization (l10n) or Internationalization (i18n)</small>

To translate text used in Foundkey, we use weblate at <https://translate.akkoma.dev/projects/foundkey/>.

Localization files are found in `/locales/` and are YAML files using the `yml` file extension.
The file name consists of the [IETF BCP 47](https://www.rfc-editor.org/info/bcp47) language code.

## Development
During development, it is useful to use the `npm run dev` command.
This command monitors the server-side and client-side source files and automatically builds them if they are modified.
In addition, it will also automatically start the Misskey server process.

## Testing
- Test codes are located in [`/test`](/test).

### Run test
Create a config file.
```
cp test/test.yml .config/
```
Prepare DB/Redis for testing.
```
docker-compose -f test/docker-compose.yml up
```
Alternatively, prepare an empty (data can be erased) DB and edit `.config/test.yml`. 

Run all test.
```
npm run test
```

#### Run specify test
```
npx cross-env TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT="./test/tsconfig.json" npx mocha test/foo.ts --require ts-node/register
```

### e2e tests
TODO

## Continuous integration (CI)

Foundkey uses Woodpecker for executing automated tests and lints.
CI runs can be found at [ci.akkoma.dev](https://ci.akkoma.dev/FoundKeyGang/FoundKey)
Configuration files are located in `/.woodpecker/`.

## Vue
Misskey uses Vue(v3) as its front-end framework.
- Use TypeScript functionality.
	- Use the type only variant of `defineProps` and `defineEmits`.
- When creating a new component, please use the Composition API (with [setup sugar](https://v3.vuejs.org/api/sfc-script-setup.html) and [ref sugar](https://github.com/vuejs/rfcs/discussions/369)) instead of the Options API.
	- Some of the existing components are implemented in the Options API, but it is an old implementation. Refactors that migrate those components to the Composition API are welcome.
	  You might be able to use this shell command to find components that have not yet been refactored: `find packages/client/src -name '*.vue' | xargs grep '<script' | grep -v 'setup'`

## Notes
### How to resolve `yarn.lock` conflicts?

Just execute `yarn` to fix it.

### Use `insert` instead of `save` to create new objects
When using `save`, you may accidentally update an existing item, because `save` circumvents uniqueness constraints.

See also <https://github.com/misskey-dev/misskey/issues/6441>.

### typeorm placeholders
The names of placeholders used in queries must be unique in each query.

For example
``` ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		qb.orWhere(`:type = ANY(note.attachedFileTypes)`, { type: type });
	}
}));
```
would mean that `type` is used multiple times because it is used in a loop.
This is incorrect. instead you would need to do something like the following:
```ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		const i = ps.fileType.indexOf(type);
		qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
	}
}));
```

### `null` (JS/TS) and `NULL` (SQL)
#### in TypeORM FindOptions
Using the JavaScript/TypeScript `null` constant is not supported in Typeorm. Instead you need to use the special `Null()` function Typeorm provides.
It can also be combined with other similar TypeORM functions.

For example to make a condition similar to SQL `IS NOT NULL`, do the following:
```ts
import { IsNull, Not } from 'typeorm';

const foo = await Foos.findOne({
	bar: Not(IsNull())
});
```

#### in SQL queries or `QueryBuilder`s
In SQL statements, you need to have separate statements for cases where parameters may be `null`.

Take for example this snippet:
``` ts
query.where('file.folderId = :folderId', { folderId: ps.folderId });
```
If `ps.folderId === null`, the resulting query would be `file.folderId = null` which is incorrect and might produce unexpected results.

What you need to do instead is something like the following:
``` ts
if (ps.folderId != null) {
	query.where('file.folderId = :folderId', { folderId: ps.folderId });
} else {
	query.where('file.folderId IS NULL');
}
```

### Empty array handling in TypeORM FindOptions
If you are using the `In` function in `FindOptions`, there must be different behaviour if it may receive empty arrays.

``` ts
const users = await Users.find({
	id: In(userIds)
});
```
This would produce erroneous SQL, i.e. `user.id IN ()`.
To fix this you would need separate handling for an empty array, for example like this:
``` ts
const users = userIds.length > 0 ? await Users.find({
	id: In(userIds)
}) : [];
```

### typeorm: selecting only specific columns

If you select specific columns of a table only, you will probably not be able to use the usual `getOne`, `getMany` etc.
Instead you might want to try using `getRawOne` and `getRawMany`.
For that, you may also want to add aliases to the columns you select, which can be done using the second parameter of `select` or `addSelect`.

### Array indexing in SQL
PostgreSQL array indices **start at 1**.

### `NULL IN ...`
When `IN` is performed on a column that may contain `NULL` values, use `OR` or similar to handle `NULL` values.

### creating migrations
First make changes to the entity files in `packages/backend/src/models/entities/`.

Then, in `packages/backend`, run:
```sh
yarn build
npx typeorm migration:generate -d ormconfig.js -o <migration name>
```

After generating (and potentially editing) the file, move it to the `packages/backend/migration` folder.

### `markRaw` for connections
When setting up a foundkey-js streaming connection as a data option to a Vue component, be sure to wrap it in `markRaw`.
Unnecessarily reactivating a connection causes problems with processing in foundkey-js and leads to performance issues.
This does not apply when using the Composition API since reactivation is manual.

### JSON imports
If you import json in TypeScript, the json file will be spit out together with the TypeScript file into the dist directory when compiling with tsc. This behavior may cause unintentional rewriting of files, so when importing json files, be sure to check whether the files are allowed to be rewritten or not. If you do not want the file to be rewritten, you should make sure that the file can be rewritten by importing the json file. If you do not want the file to be rewritten, use functions such as `fs.readFileSync` to read the file instead of importing it.

### Component style definitions do not have a `margin`
~~Setting the `margin` of a component may be confusing. Instead, it should always be the user of a component that sets a `margin`.~~
This was a philosophy used previously. Hoever it now seems a better idea to add a default margin to the top level element of a component which can be easily overwritten on the usage of that component with a `style` attribute.

### Do not use the word "follow" in HTML class names
This has caused things to be blocked by an ad blocker in the past.
