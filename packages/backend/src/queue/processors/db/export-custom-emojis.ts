import * as fs from 'node:fs';
import archiver from 'archiver';
import Bull from 'bull';
import { format as dateFormat } from 'date-fns';
import mime from 'mime-types';
import { In, IsNull } from 'typeorm';
import config from '@/config/index.js';
import { createTemp, createTempDir } from '@/misc/create-temp.js';
import { downloadUrl } from '@/misc/download-url.js';
import { Users, Emojis } from '@/models/index.js';
import { addFile } from '@/services/drive/add-file.js';
import { queueLogger } from '@/queue/logger.js';

const logger = queueLogger.createSubLogger('export-custom-emojis');

export async function exportCustomEmojis(job: Bull.Job, done: () => void): Promise<void> {
	logger.info('Exporting custom emojis ...');

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	const [path, cleanup] = await createTempDir();

	logger.info(`Temp dir is ${path}`);

	const metaPath = path + '/meta.json';

	fs.writeFileSync(metaPath, '', 'utf-8');

	const metaStream = fs.createWriteStream(metaPath, { flags: 'a' });

	const writeMeta = (text: string): Promise<void> => {
		return new Promise<void>((res, rej) => {
			metaStream.write(text, err => {
				if (err) {
					logger.error(err);
					rej(err);
				} else {
					res();
				}
			});
		});
	};

	await writeMeta(`{"metaVersion":2,"host":"${config.host}","exportedAt":"${new Date().toString()}","emojis":[`);

	const customEmojis = await Emojis.find({
		where: {
			host: IsNull(),
			...(job.data.ids ? { id: In(job.data.ids) } : {}),
		},
		order: {
			id: 'ASC',
		},
	});

	for (const emoji of customEmojis) {
		if (!/^[a-zA-Z0-9_]+$/.test(emoji.name)) {
			this.logger.error(`invalid emoji name: ${emoji.name}, skipping in emoji export`);
			continue;
		}
		const ext = mime.extension(emoji.type);
		const fileName = emoji.name + (ext ? '.' + ext : '');
		const emojiPath = path + '/' + fileName;
		fs.writeFileSync(emojiPath, '', 'binary');
		let downloaded = false;

		try {
			await downloadUrl(emoji.originalUrl, emojiPath);
			downloaded = true;
		} catch (e) { // TODO: 何度か再試行
			logger.error(e instanceof Error ? e : new Error(e as string));
		}

		if (!downloaded) {
			fs.unlinkSync(emojiPath);
		}

		const content = JSON.stringify({
			fileName,
			downloaded,
			emoji,
		});
		const isFirst = customEmojis.indexOf(emoji) === 0;

		await writeMeta(isFirst ? content : ',\n' + content);
	}

	await writeMeta(']}');

	metaStream.end();

	// Create archive
	const [archivePath, archiveCleanup] = await createTemp();
	const archiveStream = fs.createWriteStream(archivePath);
	const archive = archiver('zip', {
		zlib: { level: 0 },
	});
	archiveStream.on('close', async () => {
		logger.succ(`Exported to: ${archivePath}`);

		const fileName = 'custom-emojis-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.zip';
		const driveFile = await addFile({ user, path: archivePath, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
		cleanup();
		archiveCleanup();
		done();
	});
	archive.pipe(archiveStream);
	archive.directory(path, false);
	archive.finalize();
}
