export class removeAds1657570176749 {
    name = 'removeAds1657570176749';

    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE "ad"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TABLE public.ad ("id" character varying(32) NOT NULL, "createdAt" timestamp with time zone NOT NULL, "expiresAt" timestamp with time zone NOT NULL, "place" character varying(32) NOT NULL, "priority" character varying(32) NOT NULL, "url" character varying(1024) NOT NULL, "imageUrl" character varying(1024) NOT NULL, "memo" character varying(8192) NOT NULL, "ratio" integer DEFAULT 1 NOT NULL)`);
    }

}
