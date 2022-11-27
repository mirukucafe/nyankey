export class detectDeeplPro1669545702493 {
	name = 'detectDeeplPro1669545702493';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deeplIsPro"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "deeplIsPro" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`UPDATE "meta" SET "deeplIsPro" = true WHERE "deeplAuthKey" IS NOT NULL AND "deeplAuthKey" NOT LIKE '%:fx'`);
	}
}
