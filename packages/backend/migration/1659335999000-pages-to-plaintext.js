export class pagesToPlaintext1659335999000 {
	name = 'pagesToPlaintext1659335999000'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "page" ADD "text" text`);

		async function noteUrl(noteId) {
			const note = await queryRunner.query(`SELECT "uri", "userHost" FROM "note" WHERE "id" = $1`, [noteId]);
			if (note.uri) return note.uri;
			// don't really have access to the configuration here so just guess
			else return `https://${note.userHost}/notes/${noteId}`;
		}

		async function fileUrl(fileId) {
			const file = await queryRunner.query(`SELECT "url" from "drive_file" WHERE "id" = $1`, [fileId]);
			return file.url;
		}

		async function convertBlock(block) {
			switch (block.type) {
				case 'note':
					if (block.note) return await noteUrl(block.note);
					else break;
				case 'section':
					return (await Promise.all(block.children.map(convertBlock))).join('\n');
				case 'text':
					return block.text;
				case 'textarea':
					return '```\n' + block.text + '```';
				case 'image':
					if (block.fileId) return '![image](' + await fileUrl(block.fileId) + ')';
					else break;
				case 'if': // no idea how to convert these
				case 'post': // new note form, why?
				case 'canvas': // there is some aiscript api for these but dont think anyone ever used it
				// interactive elements can also not be converted
				case 'button':
				case 'numberInput':
				case 'textInput':
				case 'switch':
				case 'radioButton':
				case 'counter':
					break;
			}

			return `(There was a/an ${block.type} here in a previous version but it is no longer supported.)`;
		}

		await queryRunner.query(`SELECT id, "content" FROM "page"`)
		.then(pages => Promise.all(pages.map(page => {
			return Promise.all(page.content.map(convertBlock))
			.then(texts => {
				queryRunner.query(`UPDATE "page" SET "text" = $1 WHERE "id" = $2`, [texts.join('\n'), page.id]);
			});
		})));

		await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "content"`);
		await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "variables"`);
		await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "script"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "page" ADD "content" jsonb default '[]'::jsonb`);
		await queryRunner.query(`ALTER TABLE "page" ADD "variables" jsonb default '[]'::jsonb`);
		await queryRunner.query(`ALTER TABLE "page" ADD "script" character varying(16384) default ''`);

		// The conversion from the previous page content to text is lossy,
		// so we can just convert it back to a big text block.
		await queryRunner.query(`SELECT "id", "text" FROM "page"`)
		.then(pages => Promise.all(pages.map(page => {
			const content = [{
				// just a random UUID to keep the data structure
				id: '0730b23f-ab5b-4d56-8bd1-f4ead3f72af7',
				type: 'text',
				text: page.text,
			}];
			return queryRunner.query(`UPDATE "page" SET "content" = $1 WHERE "id" = $2`, [JSON.stringify(content), page.id]);
		})));

		await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "text"`);
	}
}
