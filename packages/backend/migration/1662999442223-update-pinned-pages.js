export class updatePinnedPages1662999442223 {
    name = 'updatePinnedPages1662999442223'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "pinnedPages" SET DEFAULT '{"/featured", "/channels", "/explore", "/pages", "/about-foundkey"}'::varchar[]`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "pinnedPages" SET DEFAULT '{"/featured", "/channels", "/explore", "/pages", "/about-misskey"}'::varchar[]`);
    }
}
