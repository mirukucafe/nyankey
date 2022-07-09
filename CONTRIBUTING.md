# Contribution guide
We're glad you're interested in contributing to Foundkey! In this document you will find the information you need to contribute to the project.

The project uses English as its primary language. However due to being a fork of Misskey (which uses Japanese as its primary language) you may find things that are in Japanese.
If you make contributions (pull requests, commits, comments in newly added code etc.) we expect that these should be in English.

We won't mind if issues are not in English but we cannot guarantee we will understand you correctly.
However it might stíll be better if you write issues in your original language if you are not confident of your English skills because we might be able to use different translators or ask people to translate if we are not sure what you mean.
Please understand that in such cases we might edit your issue to translate it, to help us avoid duplicating issues.

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
misskey-develop|an older version of the original Misskey repository used for cherry-picking commits

For a production environment you might not want to follow the `main` branch directly but instead check out one of the git tags.

## Considerations to be made for all contributions

This project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).
Significant changes should be listed in the changelog (i.e. the file called `CHANGELOG.md`).
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

There are two ways you can contribute:

If you **have push access** to this repository, you can push stuff directly.
But y'know, "with great power comes great responsibility" and so on.
We most likely will not kick you out if you made a mistake, it happens to the best.
But this of course means that the erroneous contributions may be either fixed or undone.

Even if you have push access but are trying to make larger or sweeping changes, please consider also using the following way of contibuting.

If you do **not have push access** you can create a pull request.
Someone with push access should review your contribution.
If they are satisfied that what you are doing seems like a good idea and the considerations from the section above are fulfilled, they can merge your pull request.
Or, they might request another member to also review your changes.
Please be patient as nobody is getting paid to do this, so it might take a bit longer.

### Creating a PR

- Please prefix the title with the part of Misskey you are changing, i.e. `server:` or `client:`
- The rest of the title should roughly describe what you did.
- Make sure that the granularity of this PR is appropriate. Please do not include more than one type of change in a single PR.
- If there is an issue which will be resolved by this PR, please include a reference to the Issue in the text.
- If you have added a feature or fixed a bug, please add a test case if possible.
- Please make sure that tests and Lint are passed in advance.
  - You can run it with `npm run test` and `npm run lint`. [See more info](#testing)
- Don't forget to update the changelog and/or documentation as appropriate (see above).

Thanks for your cooperation!

## Release

Before a stable version is released, there should be a comment period which should usually be 7 days to give everyone the chance to comment.
If a (critical) bug or similar is found during the comment period, the release may be postponed until a fix is found.
For commenting, an issue should be created, and the comment period should also be announced in the `#foundkey-dev` [IRC](https://irc.akkoma.dev) channel.

Pre-releases do not require as much scrutiny and can be useful for "field testing" before a stable release is made.

All releases are managed as git tags. The name of the tag should be exactly identical to the version number.
I.e. if the released version is 1.2.3, the git tag should be called "1.2.3" (and **not** "v1.2.3").
The tag should contain the changelog section for the respective release.

## Localization (l10n)

We have not yet set up localization management, so updating of locales can currently only be done as commits changing the respective files in the repo.

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

## Continuous integration
Misskey uses GitHub Actions for executing automated tests.
Configuration files are located in [`/.github/workflows`](/.github/workflows).

## Vue
Misskey uses Vue(v3) as its front-end framework.
- Use TypeScript.
- When creating a new component, please use the Composition API (with [setup sugar](https://v3.vuejs.org/api/sfc-script-setup.html) and [ref sugar](https://github.com/vuejs/rfcs/discussions/369)) instead of the Options API.
	- Some of the existing components are implemented in the Options API, but it is an old implementation. Refactors that migrate those components to the Composition API are also welcome.

## Notes
### How to resolve conflictions occurred at yarn.lock?

Just execute `yarn` to fix it.

### INSERTするときにはsaveではなくinsertを使用する
#6441

### placeholder
SQLをクエリビルダで組み立てる際、使用するプレースホルダは重複してはならない
例えば
``` ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		qb.orWhere(`:type = ANY(note.attachedFileTypes)`, { type: type });
	}
}));
```
と書くと、ループ中で`type`というプレースホルダが複数回使われてしまいおかしくなる
だから次のようにする必要がある
```ts
query.andWhere(new Brackets(qb => {
	for (const type of ps.fileType) {
		const i = ps.fileType.indexOf(type);
		qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
	}
}));
```

### Not `null` in TypeORM
```ts
const foo = await Foos.findOne({
	bar: Not(null)
});
```
のようなクエリ(`bar`が`null`ではない)は期待通りに動作しない。
次のようにします:
```ts
const foo = await Foos.findOne({
	bar: Not(IsNull())
});
```

### `null` in SQL
SQLを発行する際、パラメータが`null`になる可能性のある場合はSQL文を出し分けなければならない
例えば
``` ts
query.where('file.folderId = :folderId', { folderId: ps.folderId });
```
という処理で、`ps.folderId`が`null`だと結果的に`file.folderId = null`のようなクエリが発行されてしまい、これは正しいSQLではないので期待した結果が得られない
だから次のようにする必要がある
``` ts
if (ps.folderId) {
	query.where('file.folderId = :folderId', { folderId: ps.folderId });
} else {
	query.where('file.folderId IS NULL');
}
```

### `[]` in SQL
SQLを発行する際、`IN`のパラメータが`[]`(空の配列)になる可能性のある場合はSQL文を出し分けなければならない
例えば
``` ts
const users = await Users.find({
	id: In(userIds)
});
```
という処理で、`userIds`が`[]`だと結果的に`user.id IN ()`のようなクエリが発行されてしまい、これは正しいSQLではないので期待した結果が得られない
だから次のようにする必要がある
``` ts
const users = userIds.length > 0 ? await Users.find({
	id: In(userIds)
}) : [];
```

### 配列のインデックス in SQL
SQLでは配列のインデックスは**1始まり**。
`[a, b, c]`の `a`にアクセスしたいなら`[0]`ではなく`[1]`と書く

### null IN
nullが含まれる可能性のあるカラムにINするときは、そのままだとおかしくなるのでORなどでnullのハンドリングをしよう。

### `undefined`にご用心
MongoDBの時とは違い、findOneでレコードを取得する時に対象レコードが存在しない場合 **`undefined`** が返ってくるので注意。
MongoDBは`null`で返してきてたので、その感覚で`if (x === null)`とか書くとバグる。代わりに`if (x == null)`と書いてください

### Migration作成方法
packages/backendで:
```sh
npx typeorm migration:generate -d ormconfig.js -o <migration name>
```

- 生成後、ファイルをmigration下に移してください
- 作成されたスクリプトは不必要な変更を含むため除去してください

### コネクションには`markRaw`せよ
**Vueのコンポーネントのdataオプションとして**misskey.jsのコネクションを設定するとき、必ず`markRaw`でラップしてください。インスタンスが不必要にリアクティブ化されることで、misskey.js内の処理で不具合が発生するとともに、パフォーマンス上の問題にも繋がる。なお、Composition APIを使う場合はこの限りではない(リアクティブ化はマニュアルなため)。

### JSONのimportに気を付けよう
TypeScriptでjsonをimportすると、tscでコンパイルするときにそのjsonファイルも一緒にdistディレクトリに吐き出されてしまう。この挙動により、意図せずファイルの書き換えが発生することがあるので、jsonをimportするときは書き換えられても良いものかどうか確認すること。書き換えされて欲しくない場合は、importで読み込むのではなく、`fs.readFileSync`などの関数を使って読み込むようにすればよい。

### コンポーネントのスタイル定義でmarginを持たせない
コンポーネント自身がmarginを設定するのは問題の元となることはよく知られている
marginはそのコンポーネントを使う側が設定する

## その他
### HTMLのクラス名で follow という単語は使わない
広告ブロッカーで誤ってブロックされる
