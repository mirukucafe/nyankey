export class tokenPermissions1667653936442 {
	name = 'tokenPermissions1667653936442'

	async up(queryRunner) {
		// Carry over the permissions from the app for tokens that have an associated app.
		await queryRunner.query(`UPDATE "access_token" SET permission = (SELECT permission FROM "app" WHERE "app"."id" = "access_token"."appId") WHERE "appId" IS NOT NULL AND CARDINALITY("permission") = 0`);
		// The permission column should now always be set explicitly, so the default is not needed any more.
		await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "permission" DROP DEFAULT`);
		// Drop all currently running authorization sessions. Already created tokens remain untouched.
		// If you were registering an app just before upgrade started, try again later. ¯\_(ツ)_/¯
		await queryRunner.query(`TRUNCATE TABLE "auth_session"`);
		// Refactor scheme to allow multiple access tokens per app.
		await queryRunner.query(`ALTER TABLE "auth_session" DROP CONSTRAINT "FK_c072b729d71697f959bde66ade0"`);
		await queryRunner.query(`ALTER TABLE "auth_session" RENAME COLUMN "userId" TO "accessTokenId"`);
		await queryRunner.query(`ALTER TABLE "auth_session" ADD CONSTRAINT "UQ_8e001e5a101c6dca37df1a76d66" UNIQUE ("accessTokenId")`);
		await queryRunner.query(`ALTER TABLE "auth_session" ADD CONSTRAINT "FK_8e001e5a101c6dca37df1a76d66" FOREIGN KEY ("accessTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		// Drop all currently running authorization sessions. Already created tokens remain untouched.
		// If you were registering an app just before downgrade started, try again later. ¯\_(ツ)_/¯
		await queryRunner.query(`TRUNCATE TABLE "auth_session"`);

		await queryRunner.query(`ALTER TABLE "auth_session" DROP CONSTRAINT "FK_8e001e5a101c6dca37df1a76d66"`);
		await queryRunner.query(`ALTER TABLE "auth_session" DROP CONSTRAINT "UQ_8e001e5a101c6dca37df1a76d66"`);
		await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "permission" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "auth_session" RENAME COLUMN "accessTokenId" TO "userId"`);
		await queryRunner.query(`ALTER TABLE "auth_session" ADD CONSTRAINT "FK_c072b729d71697f959bde66ade0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "permission" SET DEFAULT '{}'::varchar[]`);
		await queryRunner.query(`UPDATE "access_token" SET permission = '{}'::varchar[] WHERE "appId" IS NOT NULL`);
	}
}
