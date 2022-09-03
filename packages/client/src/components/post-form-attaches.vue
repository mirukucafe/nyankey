<template>
<div v-show="files.length != 0" class="skeikyzd">
	<XDraggable v-model="_files" class="files" item-key="id" animation="150" delay="100" delay-on-touch-only="true">
		<template #item="{element}">
			<div @click="showFileMenu(element, $event)" @contextmenu.prevent="showFileMenu(element, $event)">
				<MkDriveFileThumbnail :data-id="element.id" class="thumbnail" :file="element" fit="cover"/>
				<div v-if="element.isSensitive" class="sensitive">
					<i class="fas fa-exclamation-triangle icon"></i>
				</div>
			</div>
		</template>
	</XDraggable>
	<p class="remain">{{ 16 - files.length }}/16</p>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed } from 'vue';
import { DriveFile } from 'foundkey-js/built/entities';
import MkDriveFileThumbnail from './drive-file-thumbnail.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const XDraggable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	files: DriveFile[];
	detachMediaFn?: (id: string) => void;
}>();

const emit = defineEmits<{
	(ev: 'updated', value: DriveFile[]): void;
	(ev: 'detach', id: string): void;
	(ev: 'changeSensitive', file: DriveFile, isSensitive: boolean): void;
	(ev: 'changeName', file: DriveFile, name: string): void;
}>();

let menu: Promise<null> | null = $ref(null);
const _files = computed({
	get() {
		return props.files;
	},
	set(value: DriveFile[]) {
		emit('updated', value);
	},
});

function detachMedia(id: string): void {
	if (props.detachMediaFn) {
		props.detachMediaFn(id);
	} else {
		emit('detach', id);
	}
}

function toggleSensitive(file: DriveFile): void {
	os.api('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emit('changeSensitive', file, !file.isSensitive);
	});
}

async function rename(file: DriveFile): Promise<void> {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.enterFileName,
		default: file.name,
	});
	if (canceled) return;
	os.api('drive/files/update', {
		fileId: file.id,
		name: result,
	}).then(() => {
		emit('changeName', file, result);
		file.name = result;
	});
}

async function describe(file: DriveFile): Promise<void> {
	os.popup(defineAsyncComponent(() => import('@/components/media-caption.vue')), {
		title: i18n.ts.describeFile,
		input: {
			placeholder: i18n.ts.inputNewDescription,
			default: file.comment ?? '',
		},
		file,
	}, {
		done: result => {
			if (!result || result.canceled) return;
			let comment = result.result.length === 0 ? null : result.result;
			os.api('drive/files/update', {
				fileId: file.id,
				comment,
			}).then(() => {
				file.comment = comment;
			});
		},
	}, 'closed');
}

function showFileMenu(file: DriveFile, ev: MouseEvent): void {
	if (menu) return;
	menu = os.popupMenu([{
		text: i18n.ts.renameFile,
		icon: 'fas fa-i-cursor',
		action: () => { rename(file); },
	}, {
		text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: file.isSensitive ? 'fas fa-eye-slash' : 'fas fa-eye',
		action: () => { toggleSensitive(file); },
	}, {
		text: i18n.ts.describeFile,
		icon: 'fas fa-i-cursor',
		action: () => { describe(file); },
	}, {
		text: i18n.ts.attachCancel,
		icon: 'fas fa-times-circle',
		action: () => { detachMedia(file.id); },
	}], ev.currentTarget as HTMLElement | null ?? ev.target as HTMLElement).then(() => menu = null);
}
</script>

<style lang="scss" scoped>
.skeikyzd {
	padding: 8px 16px;
	position: relative;

	> .files {
		display: flex;
		flex-wrap: wrap;

		> div {
			position: relative;
			width: 64px;
			height: 64px;
			margin-right: 4px;
			border-radius: 4px;
			overflow: hidden;
			cursor: move;

			&:hover > .remove {
				display: block;
			}

			> .thumbnail {
				width: 100%;
				height: 100%;
				z-index: 1;
				color: var(--fg);
			}

			> .sensitive {
				display: flex;
				position: absolute;
				width: 64px;
				height: 64px;
				top: 0;
				left: 0;
				z-index: 2;
				background: rgba(17, 17, 17, .7);
				color: #fff;

				> .icon {
					margin: auto;
				}
			}
		}
	}

	> .remain {
		display: block;
		position: absolute;
		top: 8px;
		right: 8px;
		margin: 0;
		padding: 0;
	}
}
</style>
