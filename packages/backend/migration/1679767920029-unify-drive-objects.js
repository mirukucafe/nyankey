export class unifyDriveObjects1679767920029 {
	name = 'unifyDriveObjects1679767920029';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "drive_file" RENAME COLUMN "folderId" TO "parentId"`);
		await queryRunner.query(`ALTER TABLE "drive_folder" ALTER COLUMN "name" TYPE character varying(256)`);
		// The column name changed so the name that typeorm generates for indices and foreign keys changes too.
		// To avoid reindexing, just rename them.
		await queryRunner.query(`ALTER TABLE "drive_file" RENAME CONSTRAINT "FK_bb90d1956dafc4068c28aa7560a" TO "FK_84b4e3038e7e64a68764dd7ea3e"`);
		await queryRunner.query(`ALTER INDEX "IDX_bb90d1956dafc4068c28aa7560" RENAME TO "IDX_84b4e3038e7e64a68764dd7ea3"`);
		await queryRunner.query(`ALTER INDEX "IDX_55720b33a61a7c806a8215b825" RENAME TO "IDX_7c607687cd487292d16617b23e"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "drive_file" RENAME CONSTRAINT "FK_84b4e3038e7e64a68764dd7ea3e" TO "FK_bb90d1956dafc4068c28aa7560a"`);
		await queryRunner.query(`ALTER INDEX "IDX_84b4e3038e7e64a68764dd7ea3" RENAME TO "IDX_bb90d1956dafc4068c28aa7560"`);
		await queryRunner.query(`ALTER INDEX "IDX_7c607687cd487292d16617b23e" RENAME TO "IDX_55720b33a61a7c806a8215b825"`);

		await queryRunner.query(`ALTER TABLE "drive_folder" ALTER COLUMN "name" TYPE character varying(128) USING substr("name", 1, 128)`);
		await queryRunner.query(`ALTER TABLE "drive_file" RENAME COLUMN "parentId" TO "folderId"`);
	}
}
