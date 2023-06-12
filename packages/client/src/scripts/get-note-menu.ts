import { defineAsyncComponent, Ref } from 'vue';
import * as foundkey from 'foundkey-js';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { noteActions } from '@/store';

export function getNoteMenu(props: {
	note: foundkey.entities.Note;
	menuButton: Ref<HTMLElement>;
	translation: Ref<any>;
	translating: Ref<boolean>;
	isDeleted: Ref<boolean>;
	currentClipPage?: Ref<foundkey.entities.Clip>;
}) {
	const appearNote = foundkey.entities.isPureRenote(props.note)
		? props.note.renote as foundkey.entities.Note
		: props.note;

	function del(): void {
		os.confirm({
			type: 'warning',
			text: i18n.ts.noteDeleteConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id,
			});
		});
	}

	function delEdit(): void {
		os.confirm({
			type: 'warning',
			text: i18n.ts.deleteAndEditConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id,
			});

			os.post({ initialNote: appearNote, renote: appearNote.renote, reply: appearNote.reply, channel: appearNote.channel });
		});
	}

	function toggleWatch(watch: boolean): void {
		os.apiWithDialog(watch ? 'notes/watching/create' : 'notes/watching/delete', {
			noteId: appearNote.id,
		});
	}

	function muteThread(): void {
		// show global settings by default
		const includingTypes = foundkey.notificationTypes.filter(x => !$i.mutingNotificationTypes.includes(x));
		os.popup(defineAsyncComponent(() => import('@/components/notification-setting-window.vue')), {
			includingTypes,
			showGlobalToggle: false,
			message: i18n.ts.threadMuteNotificationsDesc,
			notificationTypes: foundkey.noteNotificationTypes,
		}, {
			done: async (res) => {
				const { includingTypes: value } = res;
				let mutingNotificationTypes: string[] | undefined;
				if (value != null) {
					mutingNotificationTypes = foundkey.noteNotificationTypes.filter(x => !value.includes(x));
				}

				await os.apiWithDialog('notes/thread-muting/create', {
					noteId: appearNote.id,
					mutingNotificationTypes,
				});
			},
		}, 'closed');
	}

	function unmuteThread(): void {
		os.apiWithDialog('notes/thread-muting/delete', {
			noteId: appearNote.id,
		});
	}

	function copyContent(): void {
		copyToClipboard(appearNote.text);
		os.success();
	}

	function copyLink(): void {
		copyToClipboard(`${url}/notes/${appearNote.id}`);
		os.success();
	}

	function togglePin(pin: boolean): void {
		os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
			noteId: appearNote.id,
		}, undefined, null, res => {
			if (res.code === 'PIN_LIMIT_EXCEEDED') {
				os.alert({
					type: 'error',
					text: i18n.ts.pinLimitExceeded,
				});
			}
		});
	}

	async function clip(): Promise<void> {
		const clips = await os.api('clips/list');
		os.popupMenu([{
			icon: 'fas fa-plus',
			text: i18n.ts.createNew,
			action: async () => {
				const { canceled, result } = await os.form(i18n.ts.createNewClip, {
					name: {
						type: 'string',
						label: i18n.ts.name,
					},
					description: {
						type: 'string',
						required: false,
						multiline: true,
						label: i18n.ts.description,
					},
					isPublic: {
						type: 'boolean',
						label: i18n.ts.public,
						default: false,
					},
				});
				if (canceled) return;

				const clip = await os.apiWithDialog('clips/create', result);

				os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: appearNote.id });
			},
		}, null, ...clips.map(clip => ({
			text: clip.name,
			action: () => {
				os.promiseDialog(
					os.api('clips/add-note', { clipId: clip.id, noteId: appearNote.id }),
					null,
					async (err) => {
						if (err.id === 'ALREADY_CLIPPED') {
							const confirm = await os.confirm({
								type: 'warning',
								text: i18n.t('confirmToUnclipAlreadyClippedNote', { name: clip.name }),
							});
							if (!confirm.canceled) {
								os.apiWithDialog('clips/remove-note', { clipId: clip.id, noteId: appearNote.id });
								if (props.currentClipPage?.value.id === clip.id) props.isDeleted.value = true;
							}
						} else {
							os.alert({
								type: 'error',
								text: err.message + '\n' + err.id,
							});
						}
					},
				);
			},
		}))], props.menuButton.value, {
		}).then(focus);
	}

	async function unclip(): Promise<void> {
		os.apiWithDialog('clips/remove-note', { clipId: props.currentClipPage.value.id, noteId: appearNote.id });
		props.isDeleted.value = true;
	}

	function share(): void {
		navigator.share({
			title: i18n.t('noteOf', { user: appearNote.user.name || appearNote.user.username }),
			text: appearNote.text,
			url: `${url}/notes/${appearNote.id}`,
		});
	}

	async function translate(): Promise<void> {
		if (props.translation.value != null) return;
		props.translating.value = true;

		let targetLang = localStorage.getItem('lang') || navigator.language;
		targetLang = targetLang.toUpperCase();
		if (!['EN-GB', 'EN-US', 'PT-BR', 'PT-PT'].includes(targetLang)) {
			// only the language code without country code is allowed
			targetLang = targetLang.split('-', 1)[0];
		}

		const res = await os.api('notes/translate', {
			noteId: appearNote.id,
			targetLang,
		});
		props.translating.value = false;
		props.translation.value = res;
	}

	let menu;
	if ($i) {
		const statePromise = os.api('notes/state', {
			noteId: appearNote.id,
		});

		menu = [
			...(
				props.currentClipPage?.value.userId === $i.id ? [{
					icon: 'fas fa-circle-minus',
					text: i18n.ts.unclip,
					danger: true,
					action: unclip,
				}, null] : []
			),
			{
				icon: 'fas fa-copy',
				text: i18n.ts.copyContent,
				action: copyContent,
			}, {
				icon: 'fas fa-link',
				text: i18n.ts.copyLink,
				action: copyLink,
			}, (appearNote.url || appearNote.uri) ? {
				icon: 'fas fa-external-link-square-alt',
				text: i18n.ts.showOnRemote,
				action: () => {
					window.open(appearNote.url || appearNote.uri, '_blank');
				},
			} : undefined,
			{
				icon: 'fas fa-share-alt',
				text: i18n.ts.share,
				action: share,
			},
			instance.translatorAvailable ? {
				icon: 'fas fa-language',
				text: i18n.ts.translate,
				action: translate,
			} : undefined,
			null,
			{
				icon: 'fas fa-paperclip',
				text: i18n.ts.clip,
				action: () => clip(),
			},
			(appearNote.userId !== $i.id) ? statePromise.then(state => state.isWatching ? {
				icon: 'fas fa-eye-slash',
				text: i18n.ts.unwatch,
				action: () => toggleWatch(false),
			} : {
				icon: 'fas fa-eye',
				text: i18n.ts.watch,
				action: () => toggleWatch(true),
			}) : undefined,
			statePromise.then(state => state.isMutedThread ? {
				icon: 'fas fa-comment-slash',
				text: i18n.ts.unmuteThread,
				action: () => unmuteThread(),
			} : {
				icon: 'fas fa-comment-slash',
				text: i18n.ts.muteThread,
				action: () => muteThread(),
			}),
			appearNote.userId === $i.id ? ($i.pinnedNoteIds || []).includes(appearNote.id) ? {
				icon: 'fas fa-thumbtack',
				text: i18n.ts.unpin,
				action: () => togglePin(false),
			} : {
				icon: 'fas fa-thumbtack',
				text: i18n.ts.pin,
				action: () => togglePin(true),
			} : undefined,
			...(appearNote.userId !== $i.id ? [
				null,
				{
					icon: 'fas fa-exclamation-circle',
					text: i18n.ts.reportAbuse,
					action: () => {
						const u = appearNote.url || appearNote.uri || `${url}/notes/${appearNote.id}`;
						os.popup(defineAsyncComponent(() => import('@/components/abuse-report-window.vue')), {
							user: appearNote.user,
							urls: [u],
						}, {}, 'closed');
					},
				}]
			: []
			),
			...(appearNote.userId === $i.id || $i.isModerator || $i.isAdmin ? [
				null,
				appearNote.userId === $i.id ? {
					icon: 'fas fa-edit',
					text: i18n.ts.deleteAndEdit,
					action: delEdit,
				} : undefined,
				{
					icon: 'fas fa-trash-alt',
					text: i18n.ts.delete,
					danger: true,
					action: del,
				}]
			: []
			)]
		.filter(x => x !== undefined);
	} else {
		menu = [{
			icon: 'fas fa-copy',
			text: i18n.ts.copyContent,
			action: copyContent,
		}, {
			icon: 'fas fa-link',
			text: i18n.ts.copyLink,
			action: copyLink,
		}, (appearNote.url || appearNote.uri) ? {
			icon: 'fas fa-external-link-square-alt',
			text: i18n.ts.showOnRemote,
			action: () => {
				window.open(appearNote.url || appearNote.uri, '_blank');
			},
		} : undefined]
		.filter(x => x !== undefined);
	}

	if (noteActions.length > 0) {
		menu = menu.concat([null, ...noteActions.map(action => ({
			icon: 'fas fa-plug',
			text: action.title,
			action: () => {
				action.handler(appearNote);
			},
		}))]);
	}

	return menu;
}
