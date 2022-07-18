export class removeRepoUrl1658146000392 {
	name = 'removeRepoUrl1658146000392';

    async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "repositoryUrl"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "feedbackUrl"`);
    }

    async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "repositoryUrl" character varying(512) not null default 'https://github.com/misskey-dev/misskey'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "feedbackUrl" character varying(512) default 'https://github.com/misskey-dev/misskey/issues/new'`);
    }
}
