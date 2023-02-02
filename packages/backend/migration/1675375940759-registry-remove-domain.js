export class registryRemoveDomain1675375940759 {
    name = 'registryRemoveDomain1675375940759'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_0a72bdfcdb97c0eca11fe7ecad"`);
        await queryRunner.query(`ALTER TABLE "registry_item" DROP COLUMN "domain"`);
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "key" TYPE text USING "key"::text`);
        // delete existing duplicated entries, keeping the latest updated one
        await queryRunner.query(`DELETE FROM "registry_item" AS "a" WHERE "updatedAt" != (SELECT MAX("updatedAt") OVER (PARTITION BY "userId", "key", "scope") FROM "registry_item" AS "b" WHERE "a"."userId" = "b"."userId" AND "a"."key" = "b"."key" AND "a"."scope" = "b"."scope")`);
        await queryRunner.query(`ALTER TABLE "registry_item" ADD CONSTRAINT "UQ_b8d6509f847331273ab99daccc7" UNIQUE ("userId", "key", "scope")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registry_item" DROP CONSTRAINT "UQ_b8d6509f847331273ab99daccc7"`);
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "key" TYPE character varying(1024) USING "key"::varchar(1024)`);
        await queryRunner.query(`ALTER TABLE "registry_item" ADD "domain" character varying(512)`);
        await queryRunner.query(`CREATE INDEX "IDX_0a72bdfcdb97c0eca11fe7ecad" ON "registry_item" ("domain") `);
    }
}
