export class sync1667503570994 {
	name = 'sync1667503570994'

	async up(queryRunner) {
		await Promise.all([
			// the migration for renote mutes added the index to the wrong table
			queryRunner.query(`DROP INDEX "public"."IDX_renote_muting_createdAt"`),
			queryRunner.query(`DROP INDEX "public"."IDX_renote_muting_muteeId"`),
			queryRunner.query(`DROP INDEX "public"."IDX_renote_muting_muterId"`),
			queryRunner.query(`CREATE INDEX "IDX_d1259a2c2b7bb413ff449e8711" ON "renote_muting" ("createdAt") `),
			queryRunner.query(`CREATE INDEX "IDX_7eac97594bcac5ffcf2068089b" ON "renote_muting" ("muteeId") `),
			queryRunner.query(`CREATE INDEX "IDX_7aa72a5fe76019bfe8e5e0e8b7" ON "renote_muting" ("muterId") `),

			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."createdAt" IS 'The created date of the Muting.'`),
			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."muteeId" IS 'The mutee user ID.'`),
			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."muterId" IS 'The muter user ID.'`),
			queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "text" SET NOT NULL`),
			queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "text" SET DEFAULT ''`),
			queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d801c609cec4e9eb4b6b4490c" ON "renote_muting" ("muterId", "muteeId") `),
			queryRunner.query(`ALTER TABLE "renote_muting" ADD CONSTRAINT "FK_7eac97594bcac5ffcf2068089b6" FOREIGN KEY ("muteeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`),
			queryRunner.query(`ALTER TABLE "renote_muting" ADD CONSTRAINT "FK_7aa72a5fe76019bfe8e5e0e8b7d" FOREIGN KEY ("muterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`),
		]);
	}

	async down(queryRunner) {
		await Promise.all([
			queryRunner.query(`ALTER TABLE "renote_muting" DROP CONSTRAINT "FK_7aa72a5fe76019bfe8e5e0e8b7d"`),
			queryRunner.query(`ALTER TABLE "renote_muting" DROP CONSTRAINT "FK_7eac97594bcac5ffcf2068089b6"`),
			queryRunner.query(`DROP INDEX "public"."IDX_0d801c609cec4e9eb4b6b4490c"`),
			queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "text" DROP DEFAULT`),
			queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "text" DROP NOT NULL`),
			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."muterId" IS NULL`),
			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."muteeId" IS NULL`),
			queryRunner.query(`COMMENT ON COLUMN "renote_muting"."createdAt" IS NULL`),

			queryRunner.query(`DROP INDEX "public"."IDX_7aa72a5fe76019bfe8e5e0e8b7"`),
			queryRunner.query(`DROP INDEX "public"."IDX_7eac97594bcac5ffcf2068089b"`),
			queryRunner.query(`DROP INDEX "public"."IDX_d1259a2c2b7bb413ff449e8711"`),
			queryRunner.query(`CREATE INDEX "IDX_renote_muting_muterId" ON "muting" ("muterId") `),
			queryRunner.query(`CREATE INDEX "IDX_renote_muting_muteeId" ON "muting" ("muteeId") `),
			queryRunner.query(`CREATE INDEX "IDX_renote_muting_createdAt" ON "muting" ("createdAt") `),
		]);
	}
}
