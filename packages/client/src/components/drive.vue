<template>
<div class="yfudmmck">
	<nav>
		<div class="path" @contextmenu.prevent.stop="() => {}">
			<XNavFolder
				:class="{ current: folder == null }"
				:parent-folder="folder"
				@move="move"
				@upload="upload"
				@removeFile="removeFile"
				@removeFolder="removeFolder"
			/>
			<template v-for="f in hierarchyFolders">
				<span class="separator"><i class="fas fa-angle-right"></i></span>
				<XNavFolder
					:folder="f"
					:parent-folder="folder"
					@move="move"
					@upload="upload"
					@removeFile="removeFile"
					@removeFolder="removeFolder"
				/>
			</template>
			<span v-if="folder != null" class="separator"><i class="fas fa-angle-right"></i></span>
			<span v-if="folder != null" class="folder current">{{ folder.name }}</span>
		</div>
		<button class="menu _button" @click="showMenu"><i class="fas fa-ellipsis-h"></i></button>
	</nav>
	<div
		ref="main" class="main"
		:class="{ uploading: uploadings.length > 0 }"
		@dragover.prevent.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.prevent.stop="onDrop"
		@contextmenu.stop="onContextmenu"
	>
		<MkPagination
			ref="paginationElem"
			:pagination="pagination"
			class="contents"
		>
			<template #empty>
				<p v-if="folder == null" class="empty"><strong>{{ i18n.ts.emptyDrive }}</strong></p>
				<p v-else class="empty">{{ i18n.ts.emptyFolder }}</p>
			</template>

			<template #default="{ items }">
				<template v-for="(f, i) in items">
					<XFile
						v-if="'size' in f"
						:key="f.id"
						v-anim="i"
						:file="f"
						:select-mode="select !== 'folder'"
						:is-selected="selected.some(x => x.id === f.id)"
						@chosen="choose"
						@dragstart="isDragSource = true"
						@dragend="isDragSource = false"
					/>
					<XFolder
						v-else
						:key="f.id"
						v-anim="i"
						:folder="f"
						:select-mode="select !== 'file'"
						:is-selected="selected.some(x => x.id === f.id)"
						@chosen="choose"
						@move="move"
						@upload="upload"
						@removeFile="removeFile"
						@removeFolder="removeFolder"
						@dragstart="isDragSource = true"
						@dragend="isDragSource = false"
					/>
				</template>
			</template>
		</MkPagination>
	</div>
	<div v-if="draghover" class="dropzone"></div>
	<input ref="fileInput" type="file" accept="*/*" multiple tabindex="-1" @change="onChangeFileInput"/>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import * as foundkey from 'foundkey-js';
import XNavFolder from './drive.nav-folder.vue';
import XFolder from './drive.folder.vue';
import XFile from './drive.file.vue';
import MkButton from './ui/button.vue';
import MkPagination from './ui/pagination.vue';
import * as os from '@/os';
import { stream } from '@/stream';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { uploadFile, uploads } from '@/scripts/upload';

const props = withDefaults(defineProps<{
	initialFolder?: foundkey.entities.DriveFolder;
	multiple?: boolean;
	select?: 'file' | 'folder' | null;
}>(), {
	multiple: false,
	select: null,
});

const emit = defineEmits<{
	(ev: 'selected', v: foundkey.entities.DriveFile | foundkey.entities.DriveFolder): void;
	(ev: 'change-selection', v: Array<foundkey.entities.DriveFile | foundkey.entities.DriveFolder>): void;
	(ev: 'move-root'): void;
	(ev: 'cd', v: foundkey.entities.DriveFolder | null): void;
	(ev: 'open-folder', v: foundkey.entities.DriveFolder): void;
}>();

let paginationElem = $ref<InstanceType<typeof MkPagination>>();

let fileInput = $ref<HTMLInputElement>();

const uploadings = uploads;
const connection = stream.useChannel('drive');

let folder = $ref<foundkey.entities.DriveFolder | null>(null);
let hierarchyFolders = $ref<foundkey.entities.DriveFolder[]>([]);
let selected = $ref<Array<foundkey.entities.DriveFile | foundkey.entities.DriveFolder>>([]);
let keepOriginal = $ref<boolean>(defaultStore.state.keepOriginalUploading);

// ドロップされようとしているか
let draghover = $ref(false);

// 自身の所有するアイテムがドラッグをスタートさせたか
// (自分自身の階層にドロップできないようにするためのフラグ)
let isDragSource = $ref(false);

watch($$(folder), () => {
	emit('cd', folder)
	if (props.select === 'folder') {
		// convenience: entering a folder selects it
		selected = [folder];
		emit('change-selection', selected);
	}
});

function onStreamDriveFileCreated(file: foundkey.entities.DriveFile) {
	addFile(file, true);
}

function onStreamDriveFileUpdated(file: foundkey.entities.DriveFile) {
	const current = folder?.id ?? null;
	if (current !== file.folderId) {
		removeFile(file);
	} else {
		addFile(file, true);
	}
}

function onStreamDriveFileDeleted(fileId: string) {
	removeFile(fileId);
}

function onStreamDriveFolderCreated(createdFolder: foundkey.entities.DriveFolder) {
	addFolder(createdFolder, true);
}

function onStreamDriveFolderUpdated(updatedFolder: foundkey.entities.DriveFolder) {
	const current = folder?.id ?? null;
	if (current !== updatedFolder.parentId) {
		removeFolder(updatedFolder);
	} else {
		addFolder(updatedFolder, true);
	}
}

function onStreamDriveFolderDeleted(folderId: string) {
	removeFolder(folderId);
}

function onDragover(ev: DragEvent): any {
	if (!ev.dataTransfer) return;

	if (isDragSource) {
		// We are the drag source, do not allow to drop.
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

	return false;
}

function onDragenter() {
	if (!isDragSource) draghover = true;
}

function onDragleave() {
	draghover = false;
}

function onDrop(ev: DragEvent): any {
	draghover = false;

	if (!ev.dataTransfer) return;

	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	const driveFolder = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);

	if (ev.dataTransfer.files.length > 0) {
		// dropping operating system files
		for (const file of Array.from(ev.dataTransfer.files)) {
			upload(file, folder);
		}
	} else if (driveFile != null && driveFile !== '') {
		// dropping drive files
		const file = JSON.parse(driveFile);

		// cannot move file within parent folder
		if (folder.id === file.folderId) return;

		removeFile(file.id);
		os.api('drive/files/update', {
			fileId: file.id,
			folderId: folder?.id ?? null,
		});
	} else if (driveFolder != null && driveFolder !== '') {
		// dropping drive folders
		const droppedFolder = JSON.parse(driveFolder);

		// cannot move folder into itself
		if (droppedFolder.id === folder?.id) return false;
		// cannot move folder within parent folder
		if (folder.id === droppedFolder.parentId) return false;

		removeFolder(droppedFolder.id);
		os.api('drive/folders/update', {
			folderId: droppedFolder.id,
			parentId: folder?.id ?? null,
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
}

function selectLocalFile() {
	fileInput?.click();
}

function urlUpload() {
	os.inputText({
		title: i18n.ts.uploadFromUrl,
		type: 'url',
		placeholder: i18n.ts.uploadFromUrlDescription,
	}).then(({ canceled, result: url }) => {
		if (canceled || !url) return;
		os.api('drive/files/upload-from-url', {
			url,
			folderId: folder?.id ?? undefined,
		});

		os.alert({
			title: i18n.ts.uploadFromUrlRequested,
			text: i18n.ts.uploadFromUrlMayTakeTime,
		});
	});
}

function createFolder() {
	os.inputText({
		title: i18n.ts.createFolder,
		placeholder: i18n.ts.folderName,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api('drive/folders/create', {
			name,
			parentId: folder?.id ?? undefined,
		});
	});
}

function renameFolder(folderToRename: foundkey.entities.DriveFolder) {
	os.inputText({
		title: i18n.ts.renameFolder,
		placeholder: i18n.ts.inputNewFolderName,
		default: folderToRename.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api('drive/folders/update', {
			folderId: folderToRename.id,
			name,
		}).then(updatedFolder => {
			// FIXME: 画面を更新するために自分自身に移動
			move(updatedFolder);
		});
	});
}

function deleteFolder(folderToDelete: foundkey.entities.DriveFolder) {
	os.api('drive/folders/delete', {
		folderId: folderToDelete.id,
	}).then(() => {
		// 削除時に親フォルダに移動
		move(folderToDelete.parentId);
	}).catch(err => {
		switch (err.id) {
			case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
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

function onChangeFileInput() {
	if (!fileInput?.files) return;
	for (const file of Array.from(fileInput.files)) {
		upload(file, folder);
	}
}

function upload(file: File, folderToUpload?: foundkey.entities.DriveFolder | null) {
	uploadFile(file, folderToUpload?.id ?? null, undefined, keepOriginal);
}

function choose(choice: foundkey.entities.DriveFile | foundkey.entities.DriveFolder, extendSelection: boolean) {
	const alreadySelected = selected.some(f => f.id === file.id);

	const action = (() => {
		if (props.select != null) {
			// file picker mode, extendSelection is disregarded
			if (props.multiple && alreadySelected) {
				return 'remove';
			} else if (props.multiple) {
				return 'add';
			} else if (!props.multiple && alreadySelected) {
				return 'emit';
			} else {
				return 'set';
			}
		} else {
			// explorer mode, props.multiple is disregarded
			if (extendSelection && alreadySelected) {
				return 'remove';
			} else if (extendSelection) {
				return 'add';
			} else if (!alreadySelected) {
				return 'set';
			}
			// already selected && ! extend selection is a noop
		}
	})();

	switch (action) {
		case 'emit':
			emit('selected', choice);
			return; // don't emit the change-selection event
		case 'add':
			selected.push(choice);
			break;
		case 'set':
			selected = [choice];
			break;
		case 'remove':
			selected = selected.filter(f => f.id !== choice.id);
			break;
	}
	emit('change-selection', selected);
}

function move(target?: string | foundkey.entities.DriveFolder) {
	if (!target) {
		goRoot();
		return;
	}

	const targetId = typeof target === 'string' ? target : target.id;

	os.api('drive/folders/show', {
		folderId: targetId,
	}).then(folderToMove => {
		folder = folderToMove;

		// display new folder hierarchy appropriately
		hierarchyFolders = [];
		let parent = folderToMove.parent;
		while (parent) {
			hierarchyFolders.unshift(parent);
			parent = parent.parent;
		}

		emit('open-folder', folderToMove);
	});
}

function addFolder(folderToAdd: foundkey.entities.DriveFolder, unshift = false) {
	const current = folder?.id ?? null;
	if (current !== folderToAdd.parentId) return;

	const exist = paginationElem.items.some(f => f.id === folderToAdd.id);
	if (exist) {
		paginationElem.updateItem(folderToAdd.id, () => folderToAdd);
	} else if (unshift) {
		paginationElem.prepend(folderToAdd);
	} else {
		paginationElem.append(folderToAdd);
	}
}

function addFile(fileToAdd: foundkey.entities.DriveFile, unshift = false) {
	const current = folder?.id ?? null;
	if (current !== fileToAdd.folderId) return;

	const exist = paginationElem.items.some(f => f.id === fileToAdd.id);
	if (exist) {
		paginationElem.updateItem(fileToAdd.id, () => fileToAdd);
	} else if (unshift) {
		paginationElem.prepend(fileToAdd);
	} else {
		paginationElem.append(fileToAdd);
	}
}

function removeFolder(folderToRemove: foundkey.entities.DriveFolder | string): void {
	const folderIdToRemove = typeof folderToRemove === 'object' ? folderToRemove.id : folderToRemove;
	paginationElem.removeItem(item => item.id === folderIdToRemove);
}

function removeFile(fileToRemove: foundkey.entities.DriveFile | string): void {
	const fileIdToRemove = typeof fileToRemove === 'object' ? fileToRemove.id : fileToRemove;
	paginationElem.removeItem(item => item.id === fileIdToRemove);
}

function goRoot() {
	// do nothing if already at root
	if (folder == null) return;

	folder = null;
	hierarchyFolders = [];
	emit('move-root');
}

const pagination = {
	endpoint: 'drive/show' as const,
	limit: 30,
	params: computed(() => ({
		folderId: folder?.id ?? null,
	})),
};

function getMenu() {
	return [{
		type: 'switch',
		text: i18n.ts.keepOriginalUploading,
		ref: $$(keepOriginal),
	}, null, {
		text: i18n.ts.addFile,
		type: 'label',
	}, {
		text: i18n.ts.upload,
		icon: 'fas fa-upload',
		action: () => { selectLocalFile(); },
	}, {
		text: i18n.ts.fromUrl,
		icon: 'fas fa-link',
		action: () => { urlUpload(); },
	}, null, {
		text: folder?.name ?? i18n.ts.drive,
		type: 'label',
	}, folder != null ? {
		text: i18n.ts.renameFolder,
		icon: 'fas fa-i-cursor',
		action: () => { renameFolder(folder); },
	} : undefined, folder != null ? {
		text: i18n.ts.deleteFolder,
		icon: 'fas fa-trash-alt',
		action: () => { deleteFolder(folder as foundkey.entities.DriveFolder); },
	} : undefined, {
		text: i18n.ts.createFolder,
		icon: 'fas fa-folder-plus',
		action: () => { createFolder(); },
	}];
}

function showMenu(ev: MouseEvent) {
	os.popupMenu(getMenu(), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

onMounted(() => {
	connection.on('fileCreated', onStreamDriveFileCreated);
	connection.on('fileUpdated', onStreamDriveFileUpdated);
	connection.on('fileDeleted', onStreamDriveFileDeleted);
	connection.on('folderCreated', onStreamDriveFolderCreated);
	connection.on('folderUpdated', onStreamDriveFolderUpdated);
	connection.on('folderDeleted', onStreamDriveFolderDeleted);

	if (props.initialFolder) {
		move(props.initialFolder);
	}
});

onBeforeUnmount(() => {
	connection.dispose();
});
</script>

<style lang="scss" scoped>
.yfudmmck {
	display: flex;
	flex-direction: column;
	height: 100%;

	> nav {
		display: flex;
		z-index: 2;
		width: 100%;
		padding: 0 8px;
		box-sizing: border-box;
		overflow: auto;
		font-size: 0.9em;
		box-shadow: 0 1px 0 var(--divider);

		&, * {
			user-select: none;
		}

		> .path {
			display: inline-block;
			vertical-align: bottom;
			line-height: 50px;
			white-space: nowrap;

			> * {
				display: inline-block;
				margin: 0;
				padding: 0 8px;
				line-height: 50px;
				cursor: pointer;

				* {
					pointer-events: none;
				}

				&:hover {
					text-decoration: underline;
				}

				&.current {
					font-weight: bold;
					cursor: default;

					&:hover {
						text-decoration: none;
					}
				}

				&.separator {
					margin: 0;
					padding: 0;
					opacity: 0.5;
					cursor: default;

					> i {
						margin: 0;
					}
				}
			}
		}

		> .menu {
			margin-left: auto;
			padding: 0 12px;
		}
	}

	> .main {
		flex: 1;
		overflow: auto;
		padding: var(--margin);

		&, * {
			user-select: none;
		}

		&.uploading {
			height: calc(100% - 38px - 100px);
		}

		> .contents {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: .5em;
		}

		> .empty {
			padding: 16px;
			text-align: center;
			pointer-events: none;
			opacity: 0.5;
			margin: 0;
		}
	}

	> .dropzone {
		position: absolute;
		left: 0;
		top: 38px;
		width: 100%;
		height: calc(100% - 38px);
		border: dashed 2px var(--focus);
		pointer-events: none;
	}

	> input {
		display: none;
	}
}
</style>
