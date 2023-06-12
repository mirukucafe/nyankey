export class ffVisibilityNobody1684536337602 {
	name = 'ffVisibilityNobody1684536337602';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TYPE "public"."user_profile_ffvisibility_enum" RENAME TO "user_profile_ffvisibility_enum_old"`);
		await queryRunner.query(`CREATE TYPE "public"."user_profile_ffvisibility_enum" AS ENUM('public', 'followers', 'private', 'nobody')`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" TYPE "public"."user_profile_ffvisibility_enum" USING "ffVisibility"::"text"::"public"."user_profile_ffvisibility_enum"`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" SET DEFAULT 'public'`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_ffvisibility_enum_old"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`CREATE TYPE "public"."user_profile_ffvisibility_enum_old" AS ENUM('public', 'followers', 'private')`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" TYPE "public"."user_profile_ffvisibility_enum_old" USING "ffVisibility"::"text"::"public"."user_profile_ffvisibility_enum_old"`);
		await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "ffVisibility" SET DEFAULT 'public'`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_ffvisibility_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."user_profile_ffvisibility_enum_old" RENAME TO "user_profile_ffvisibility_enum"`);
	}
}
