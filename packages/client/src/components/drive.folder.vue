<template>
<div
	class="rghtznwe"
	:class="{ draghover, isSelected }"
	draggable="true"
	:title="title"
	@click="selected"
	@contextmenu.stop="onContextmenu"
	@mouseover="onMouseover"
	@mouseout="onMouseout"
	@dragover.prevent.stop="onDragover"
	@dragenter.prevent="onDragenter"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
	@dragstart="onDragstart"
	@dragend="onDragend"
>
	<div class="thumbnail" @click.stop="emit('move', folder)">
		<i class="fas fa-folder-open fa-fw hover"></i>
		<i class="fas fa-folder fa-fw"></i>
	</div>
	<p class="name">
		{{ folder.name }}
	</p>
	<p v-if="defaultStore.state.uploadFolder == folder.id" class="upload">
		{{ i18n.ts.uploadFolder }}
	</p>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import * as foundkey from 'foundkey-js';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	folder: foundkey.entities.DriveFolder;
	isSelected?: boolean;
	selectMode?: boolean;
}>(), {
	isSelected: false,
	selectMode: false,
});

const emit = defineEmits<{
	(ev: 'chosen', v: foundkey.entities.DriveFolder, extendSelection: boolean): void;
	(ev: 'move', v: foundkey.entities.DriveFolder): void;
	(ev: 'upload', file: File, folder: foundkey.entities.DriveFolder);
	(ev: 'removeFile', v: foundkey.entities.DriveFile['id']): void;
	(ev: 'removeFolder', v: foundkey.entities.DriveFolder['id']): void;
	(ev: 'dragstart'): void;
	(ev: 'dragend'): void;
}>();

const hover = ref(false);
const draghover = ref(false);
const isDragging = ref(false);

const title = computed(() => props.folder.name);

function selected(ev: MouseEvent) {
	if (props.selectMode) {
		emit('chosen', props.folder, ev.ctrlKey);
	}
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// 自分自身がドラッグされている場合
	if (isDragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
		return;
	}

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	const isDriveFolder = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FOLDER_;

	if (isFile || isDriveFile || isDriveFolder) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}
}

function onDragenter() {
	if (!isDragging.value) draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		for (const file of Array.from(ev.dataTransfer.files)) {
			emit('upload', file, props.folder);
		}
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		emit('removeFile', file.id);
		os.api('drive/files/update', {
			fileId: file.id,
			folderId: props.folder.id,
		});
	}
	//#endregion

	//#region ドライブのフォルダ
	const driveFolder = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);
	if (driveFolder != null && driveFolder !== '') {
		const folder = JSON.parse(driveFolder);

		// 移動先が自分自身ならreject
		if (folder.id === props.folder.id) return;

		emit('removeFolder', folder.id);
		os.api('drive/folders/update', {
			folderId: folder.id,
			parentId: props.folder.id,
		}).then(() => {
			// noop
		}).catch(err => {
			switch (err) {
				case 'detected-circular-definition':
					os.alert({
						title: i18n.ts.unableToProcess,
						text: i18n.ts.circularReferenceFolder,
					});
					break;
				default:
					os.alert({
						type: 'error',
						text: i18n.ts.somethingHappened,
					});
			}
		});
	}
	//#endregion
}

function onDragstart(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	ev.dataTransfer.effectAllowed = 'move';
	ev.dataTransfer.setData(_DATA_TRANSFER_DRIVE_FOLDER_, JSON.stringify(props.folder));
	isDragging.value = true;

	// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
	// (=あなたの子供が、ドラッグを開始しましたよ)
	emit('dragstart');
}

function onDragend() {
	isDragging.value = false;
	emit('dragend');
}

function rename() {
	os.inputText({
		title: i18n.ts.renameFolder,
		placeholder: i18n.ts.inputNewFolderName,
		default: props.folder.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api('drive/folders/update', {
			folderId: props.folder.id,
			name,
		});
	});
}

function deleteFolder() {
	os.api('drive/folders/delete', {
		folderId: props.folder.id,
	}).then(() => {
		if (defaultStore.state.uploadFolder === props.folder.id) {
			defaultStore.set('uploadFolder', null);
		}
	}).catch(err => {
		switch (err.code) {
			case 'HAS_CHILD_FILES_OR_FOLDERS':
				os.alert({
					type: 'error',
					title: i18n.ts.unableToDelete,
					text: i18n.ts.hasChildFilesOrFolders,
				});
				break;
			default:
				os.alert({
					type: 'error',
					text: i18n.ts.unableToDelete,
				});
		}
	});
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu([{
		text: i18n.ts.openInWindow,
		icon: 'fas fa-window-restore',
		action: () => {
			os.popup(defineAsyncComponent(() => import('./drive-window.vue')), {
				initialFolder: props.folder,
			}, {
			}, 'closed');
		},
	}, null, {
		text: i18n.ts.rename,
		icon: 'fas fa-i-cursor',
		action: rename,
	}, null, {
		text: i18n.ts.delete,
		icon: 'fas fa-trash-alt',
		danger: true,
		action: deleteFolder,
	}], ev);
}
</script>

<style lang="scss" scoped>
.rghtznwe {
	position: relative;
	padding: 8px;
	min-height: 180px;
	border-radius: 8px;

	&, * {
		cursor: pointer;
	}

	> .thumbnail {
		/* same style as drive.file.vue */
		width: 8em;
		height: 8em;
		margin: auto;

		/* same style as drive-file-thumbnail.vue */
		position: relative;
		display: flex;
		background: var(--panel);
		border-radius: 8px;
		overflow: clip;

		> i {
			pointer-events: none;
			margin: auto;
			font-size: 33px;
			color: #777;
		}

		&:not(:hover) > i.hover,
		&:hover > i:not(.hover) { display: none; }
	}

	&.draghover {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -4px;
			right: -4px;
			bottom: -4px;
			left: -4px;
			border: 2px dashed var(--focus);
			border-radius: 4px;
		}
	}

	&.isSelected {
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
		}

		> .name {
			color: #fff;
		}

		> .thumbnail {
			color: #fff;
		}
	}

	> .name {
		display: block;
		margin: 4px 0 0 0;
		font-size: 0.8em;
		text-align: center;
		word-break: break-all;
		color: var(--fg);
		overflow: hidden;
	}

	> .upload {
		margin: 4px 4px;
		font-size: 0.8em;
		text-align: center;
		opacity: 0.7;
	}
}
</style>
