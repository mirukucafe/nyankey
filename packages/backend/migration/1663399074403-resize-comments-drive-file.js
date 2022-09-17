
export class resizeCommentsDriveFile1663399074403 {
    constructor() {
      this.name = 'resizeCommentsDriveFile1663399074403';
    }

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "comment" TYPE character varying(2048)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "comment" TYPE character varying(512)`);
    }
}
