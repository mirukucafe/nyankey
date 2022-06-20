export class threadMuteNotifications1655793461890 {
	name = 'threadMuteNotifications1655793461890'

	async up(queryRunner) {
		await queryRunner.query(`CREATE TYPE "public"."note_thread_muting_mutingnotificationtypes_enum" AS ENUM('mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded')`);
		await queryRunner.query(`ALTER TABLE "note_thread_muting" ADD "mutingNotificationTypes" "public"."note_thread_muting_mutingnotificationtypes_enum" array NOT NULL DEFAULT '{}'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note_thread_muting" DROP COLUMN "mutingNotificationTypes"`);
		await queryRunner.query(`DROP TYPE "public"."note_thread_muting_mutingnotificationtypes_enum"`);
	}
}
