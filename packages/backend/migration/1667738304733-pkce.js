export class pkce1667738304733 {
    name = 'pkce1667738304733'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "auth_session" ADD "pkceChallenge" text`);
        await queryRunner.query(`COMMENT ON COLUMN "auth_session"."pkceChallenge" IS 'PKCE code_challenge value, if provided (OAuth only)'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "auth_session" DROP COLUMN "pkceChallenge"`);
    }
}
