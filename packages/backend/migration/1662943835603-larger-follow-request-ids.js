export class largerFollowRequestIds1662943835603 {
	name = 'largerFollowRequestIds1662943835603';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "follow_request" ALTER COLUMN "requestId" TYPE VARCHAR(2048)`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "follow_request" ALTER COLUMN "requestId" TYPE VARCHAR(128)`);
	}

}
