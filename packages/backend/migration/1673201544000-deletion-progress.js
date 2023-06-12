export class deletionProgress1673201544000 {
	name = 'deletionProgress1673201544000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "isDeleted" TO "isDeletedOld"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "isDeleted" integer`);
		await queryRunner.query(`UPDATE "user" SET "isDeleted" = CASE WHEN "host" IS NULL THEN -1 ELSE 0 END WHERE "isDeletedOld"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isDeletedOld"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "isDeleted" TO "isDeletedOld"`);
		await queryRunner.query(`ALTER TABLE "user" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`UPDATE "user" SET "isDeleted" = "isDeletedOld" IS NOT NULL`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isDeletedOld"`);
	}
}

