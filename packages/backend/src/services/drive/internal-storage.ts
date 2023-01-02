import * as fs from 'node:fs';
import * as Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import config from '@/config/index.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

export class InternalStorage {
	private static readonly path = config.internalStoragePath || Path.resolve(_dirname, '../../../../../files');

	public static resolvePath = (key: string): string => Path.resolve(InternalStorage.path, key);

	public static read(key: string): fs.ReadStream {
		return fs.createReadStream(InternalStorage.resolvePath(key));
	}

	public static saveFromPath(key: string, srcPath: string): string {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		const target = InternalStorage.resolvePath(key);
		fs.copyFileSync(srcPath, target);
		fs.chmodSync(target, 0o644);
		return `${config.url}/files/${key}`;
	}

	public static saveFromBuffer(key: string, data: Buffer): string {
		fs.mkdirSync(InternalStorage.path, { recursive: true });
		fs.writeFileSync(InternalStorage.resolvePath(key), data);
		return `${config.url}/files/${key}`;
	}

	public static del(key: string): void {
		fs.unlink(InternalStorage.resolvePath(key), () => {});
	}
}
