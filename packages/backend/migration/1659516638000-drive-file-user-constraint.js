export class driveFileUserConstraint1659516638000 {
	name = 'driveFileUserConstraint1659516638000';

    async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "drive_file" DROP CONSTRAINT "FK_860fa6f6c7df5bb887249fba22e"`);
		await queryRunner.query(`ALTER TABLE "drive_file" ADD CONSTRAINT "FK_860fa6f6c7df5bb887249fba22e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT`);
    }

    async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "drive_file" DROP CONSTRAINT "FK_860fa6f6c7df5bb887249fba22e"`);
		await queryRunner.query(`ALTER TABLE "drive_file" ADD CONSTRAINT "FK_860fa6f6c7df5bb887249fba22e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL`);
    }
}
