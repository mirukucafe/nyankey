export class addLibretranslate1668661888188 {
    name = 'addLibretranslate1668661888188'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."meta_translationservice_enum" AS ENUM('deepl', 'libretranslate')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "translationService" "public"."meta_translationservice_enum"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "libreTranslateAuthKey" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "libreTranslateEndpoint" character varying(2048)`);
				// Set translationService to 'deepl' if auth key is already set
				await queryRunner.query(`UPDATE "meta" SET "translationService"='deepl' WHERE "deeplAuthKey" IS NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "libreTranslateEndpoint"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "libreTranslateAuthKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "translationService"`);
        await queryRunner.query(`DROP TYPE "public"."meta_translationservice_enum"`);
    }
}
