export class removeRooms1662489803045 {
	name = 'removeRooms1662489803045'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "room"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "room" jsonb NOT NULL DEFAULT '{}'`);
	}
}
