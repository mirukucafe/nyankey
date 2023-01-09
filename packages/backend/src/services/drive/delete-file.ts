import { v4 as uuid } from 'uuid';
import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';
import { driveChart, perUserDriveChart, instanceChart } from '@/services/chart/index.js';
import { createDeleteObjectStorageFileJob } from '@/queue/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { InternalStorage } from './internal-storage.js';
import { getS3 } from './s3.js';

export async function deleteFile(file: DriveFile, isExpired = false): Promise<void> {
	if (file.storedInternal) {
		InternalStorage.del(file.accessKey!);

		if (file.thumbnailUrl) {
			InternalStorage.del(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			InternalStorage.del(file.webpublicAccessKey!);
		}
	} else if (!file.isLink) {
		createDeleteObjectStorageFileJob(file.accessKey!);

		if (file.thumbnailUrl) {
			createDeleteObjectStorageFileJob(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			createDeleteObjectStorageFileJob(file.webpublicAccessKey!);
		}
	}

	postProcess(file, isExpired);
}

export async function deleteFileSync(file: DriveFile, isExpired = false): Promise<void> {
	if (file.storedInternal) {
		InternalStorage.del(file.accessKey!);

		if (file.thumbnailUrl) {
			InternalStorage.del(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			InternalStorage.del(file.webpublicAccessKey!);
		}
	} else if (!file.isLink) {
		const promises = [];

		promises.push(deleteObjectStorageFile(file.accessKey!));

		if (file.thumbnailUrl) {
			promises.push(deleteObjectStorageFile(file.thumbnailAccessKey!));
		}

		if (file.webpublicUrl) {
			promises.push(deleteObjectStorageFile(file.webpublicAccessKey!));
		}

		await Promise.all(promises);
	}

	postProcess(file, isExpired);
}

async function postProcess(file: DriveFile, isExpired = false): Promise<void> {
	// Turn into a direct link after expiring a remote file.
	if (isExpired && file.userHost != null && file.uri != null) {
		const id = uuid();
		DriveFiles.update(file.id, {
			isLink: true,
			url: file.uri,
			thumbnailUrl: null,
			webpublicUrl: null,
			storedInternal: false,
			accessKey: id,
			thumbnailAccessKey: 'thumbnail-' + id,
			webpublicAccessKey: 'webpublic-' + id,
		});
	} else {
		DriveFiles.delete(file.id);
	}

	// update statistics
	driveChart.update(file, false);
	perUserDriveChart.update(file, false);
	if (file.userHost != null) {
		instanceChart.updateDrive(file, false);
	}
}

export async function deleteObjectStorageFile(key: string): Promise<void> {
	const meta = await fetchMeta();

	const s3 = getS3(meta);

	await s3.deleteObject({
		Bucket: meta.objectStorageBucket!,
		Key: key,
	}).promise();
}
