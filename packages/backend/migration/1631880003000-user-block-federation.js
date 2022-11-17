export class userBlockFederation1631880003000 {
	name = 'userBlockFederation1631880003000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "federateBlocks" boolean NOT NULL DEFAULT true`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "federateBlocks"`);
	}

}
