import { reactive, ref } from 'vue';
import * as foundkey from 'foundkey-js';
import { readAndCompressImage } from 'browser-image-resizer';
import { defaultStore } from '@/store';
import { apiUrl } from '@/config';
import { $i } from '@/account';
import { alert } from '@/os';

type Uploading = {
	id: string;
	name: string;
	progressMax: number | undefined;
	progressValue: number | undefined;
	img: string;
};
export const uploads = ref<Uploading[]>([]);

const compressTypeMap = {
	'image/jpeg': { quality: 0.85, mimeType: 'image/jpeg' },
	'image/webp': { quality: 0.85, mimeType: 'image/jpeg' },
	'image/svg+xml': { quality: 1, mimeType: 'image/png' },
} as const;

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

export function uploadFile(
	file: File,
	folder?: string | Record<string, any>,
	name?: string,
	keepOriginal: boolean = defaultStore.state.keepOriginalUploading,
): Promise<foundkey.entities.DriveFile> {
	const folderId = typeof folder === 'string' ? folder : folder?.id;

	return new Promise((resolve, reject) => {
		const id = Math.random().toString();

		const reader = new FileReader();
		reader.onload = async (ev) => {
			const ctx = reactive<Uploading>({
				id,
				name: name || file.name || 'untitled',
				progressMax: undefined,
				progressValue: undefined,
				img: window.URL.createObjectURL(file),
			});

			uploads.value.push(ctx);

			let resizedImage: any;
			if (!keepOriginal && file.type in compressTypeMap) {
				const imgConfig = compressTypeMap[file.type];

				const config = {
					maxWidth: 2048,
					maxHeight: 2048,
					debug: true,
					...imgConfig,
				};

				try {
					resizedImage = await readAndCompressImage(file, config);
					ctx.name = file.type !== imgConfig.mimeType ? `${ctx.name}.${mimeTypeMap[compressTypeMap[file.type].mimeType]}` : ctx.name;
				} catch (err) {
					console.error('Failed to resize image', err);
				}
			}

			const formData = new FormData();
			formData.append('force', 'true');
			formData.append('file', resizedImage || file);
			formData.append('name', ctx.name);
			if (folderId) formData.append('folderId', folderId);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.setRequestHeader('Authorization', `Bearer ${$i.token}`);
			xhr.onload = (ev) => {
				if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
					// TODO: 消すのではなくて再送できるようにしたい
					uploads.value = uploads.value.filter(x => x.id !== id);

					alert({
						type: 'error',
						title: 'Failed to upload',
						text: `${JSON.stringify(ev.target?.response)}, ${JSON.stringify(xhr.response)}`,
					});

					reject();
					return;
				}

				const driveFile = JSON.parse(ev.target.response);

				resolve(driveFile);

				uploads.value = uploads.value.filter(x => x.id !== id);
			};

			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable) {
					ctx.progressMax = ev.total;
					ctx.progressValue = ev.loaded;
				}
			};

			xhr.send(formData);
		};
		reader.readAsArrayBuffer(file);
	});
}
