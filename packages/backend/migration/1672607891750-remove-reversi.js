export class removeReversi1672607891750 {
	name = 'removeReversi1672607891750';

	async up(queryRunner) {
		await queryRunner.query(`DROP TABLE "reversi_matching"`);
		await queryRunner.query(`DROP TABLE "reversi_game"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`CREATE TABLE "reversi_game" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE, "user1Id" character varying(32) NOT NULL, "user2Id" character varying(32) NOT NULL, "user1Accepted" boolean NOT NULL DEFAULT false, "user2Accepted" boolean NOT NULL DEFAULT false, "black" integer, "isStarted" boolean NOT NULL DEFAULT false, "isEnded" boolean NOT NULL DEFAULT false, "winnerId" character varying(32), "surrendered" character varying(32), "logs" jsonb NOT NULL DEFAULT '[]', "map" character varying(64) array NOT NULL, "bw" character varying(32) NOT NULL, "isLlotheo" boolean NOT NULL DEFAULT false, "canPutEverywhere" boolean NOT NULL DEFAULT false, "loopedBoard" boolean NOT NULL DEFAULT false, "form1" jsonb DEFAULT null, "form2" jsonb DEFAULT null, "crc32" character varying(32), CONSTRAINT "PK_76b30eeba71b1193ad7c5311c3f" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_b46ec40746efceac604142be1c" ON "reversi_game" ("createdAt")`);
		await queryRunner.query(`CREATE TABLE "reversi_matching" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "parentId" character varying(32) NOT NULL, "childId" character varying(32) NOT NULL, CONSTRAINT "PK_880bd0afbab232f21c8b9d146cf" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE INDEX "IDX_b604d92d6c7aec38627f6eaf16" ON "reversi_matching" ("createdAt")`);
		await queryRunner.query(`CREATE INDEX "IDX_3b25402709dd9882048c2bbade" ON "reversi_matching" ("parentId")`);
		await queryRunner.query(`CREATE INDEX "IDX_e247b23a3c9b45f89ec1299d06" ON "reversi_matching" ("childId")`);
		await queryRunner.query(`ALTER TABLE "reversi_game" ADD CONSTRAINT "FK_f7467510c60a45ce5aca6292743" FOREIGN KEY ("user1Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "reversi_game" ADD CONSTRAINT "FK_6649a4e8c5d5cf32fb03b5da9f6" FOREIGN KEY ("user2Id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "reversi_matching" ADD CONSTRAINT "FK_3b25402709dd9882048c2bbade0" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "reversi_matching" ADD CONSTRAINT "FK_e247b23a3c9b45f89ec1299d066" FOREIGN KEY ("childId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}
}
