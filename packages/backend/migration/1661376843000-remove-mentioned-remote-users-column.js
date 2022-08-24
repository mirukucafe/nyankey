export class removeMentionedRemoteUsersColumn1661376843000 {
	name = 'removeMentionedRemoteUsersColumn1661376843000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "mentionedRemoteUsers"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "mentionedRemoteUsers" TEXT NOT NULL DEFAULT '[]'::text`);
		await queryRunner.query(`UPDATE "note" SET "mentionedRemoteUsers" = (SELECT COALESCE(json_agg(row_to_json("data"))::text, '[]') FROM (SELECT "url", "uri", "username", "host" FROM "user" JOIN "user_profile" ON "user"."id" = "user_profile". "userId" WHERE "user"."host" IS NOT NULL AND "user"."id" = ANY("note"."mentions")) AS "data")`);
	}
}
