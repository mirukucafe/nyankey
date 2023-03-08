export class syncOrm1674499888924 {
	name = 'syncOrm1674499888924'

	async up(queryRunner) {
		await queryRunner.query(`COMMENT ON COLUMN "user"."token" IS 'The native access token of local users, or null.'`);
		await queryRunner.query(`ALTER TABLE "auth_session" DROP CONSTRAINT "UQ_8e001e5a101c6dca37df1a76d66"`);

		// remove human readable URL from notes where it is duplicated, so the index can be added
		await queryRunner.query(`UPDATE "note" SET "url" = NULL WHERE "url" IN (SELECT "url" FROM "note" GROUP BY "url" HAVING COUNT("url") > 1)`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71d35fceee0d0fa62b2fa8f3b2" ON "note" ("url") `);

		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d9ecaed8c6dc43f3592c229282" ON "user_group_joining" ("userId", "userGroupId") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_d9ecaed8c6dc43f3592c229282"`);

		await queryRunner.query(`DROP INDEX "public"."IDX_71d35fceee0d0fa62b2fa8f3b2"`);

		await queryRunner.query(`ALTER TABLE "auth_session" ADD CONSTRAINT "UQ_8e001e5a101c6dca37df1a76d66" UNIQUE ("accessTokenId")`);
		await queryRunner.query(`COMMENT ON COLUMN "user"."token" IS 'The native access token of the User. It will be null if the origin of the user is local.'`);
	}
}
