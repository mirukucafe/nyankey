export class movedTo1668977715500 {
	name = 'movedTo1668977715500';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "movedToId" character varying(32)`);
		await queryRunner.query(`ALTER TABLE "notification" ADD "moveTargetId" character varying(32)`);
		await queryRunner.query(`COMMENT ON COLUMN "notification"."moveTargetId" IS 'The ID of the moved to account.'`);
		await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_16fef167e4253ccdc8971b01f6e" FOREIGN KEY ("movedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_078db271ad52ccc345b7b2b026a" FOREIGN KEY ("moveTargetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TYPE "notification_type_enum" ADD VALUE 'move'`);
		await queryRunner.query(`ALTER TYPE "user_profile_mutingnotificationtypes_enum" ADD VALUE 'move'`);
	}

	async down(queryRunner) {
		// remove 'move' from user muting notifications type enum
		await queryRunner.query(`CREATE TYPE "public"."user_profile_mutingnotificationtypes_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app', 'pollEnded')`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" TYPE "public"."user_profile_mutingnotificationtypes_enum_old"[] USING "mutingNotificationTypes"::"text"::"public"."user_profile_mutingnotificationtypes_enum_old"[]`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "mutingNotificationTypes" SET DEFAULT '{}'`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_mutingnotificationtypes_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."user_profile_mutingnotificationtypes_enum_old" RENAME TO "user_profile_mutingnotificationtypes_enum"`);

		// remove 'move' from notification type enum
		await queryRunner.query(`DELETE FROM "notification" WHERE "type" = 'move'`);
		await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'pollEnded', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`);
		await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
		await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);

		await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_078db271ad52ccc345b7b2b026a"`);
		await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_16fef167e4253ccdc8971b01f6e"`);
		await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "moveTargetId"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedToId"`);
	}
}
