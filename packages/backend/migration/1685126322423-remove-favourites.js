export class removeFavourites1685126322423 {
	name = 'removeFavourites1685126322423';

	async up(queryRunner) {
		await queryRunner.query(`
			WITH "new_clips" AS (
				INSERT INTO "clip" ("id", "createdAt", "userId", "name")
				SELECT
					LEFT(MD5(RANDOM()::text), 10),
					NOW(),
					"userId",
					'⭐'
				FROM "note_favorite"
				GROUP BY "userId"
				RETURNING "id", "userId"
			)
			INSERT INTO "clip_note" ("id", "noteId", "clipId")
			SELECT
				"note_favorite"."id",
				"noteId",
				"new_clips"."id"
			FROM "note_favorite"
			JOIN "new_clips" ON "note_favorite"."userId" = "new_clips"."userId"
		`);
		await queryRunner.query(`DROP TABLE "note_favorite"`);
	}

	async down(queryRunner) {
		// can't revert the migration to clips, can only recreate the database table
		await queryRunner.query(`CREATE TABLE "note_favorite" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, CONSTRAINT "PK_af0da35a60b9fa4463a62082b36" PRIMARY KEY ("id"))`);
	}
}

