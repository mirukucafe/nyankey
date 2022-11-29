import { nextTick, Ref, ref, defineAsyncComponent } from 'vue';
import getCaretCoordinates from 'textarea-caret';
import { toASCII } from 'punycode/';
import { popup } from '@/os';

export class Autocomplete {
	private suggestion: {
		x: Ref<number>;
		y: Ref<number>;
		q: Ref<string | null>;
		close: () => void;
	} | null;
	private textarea: HTMLInputElement | HTMLTextAreaElement;
	private currentType: string;
	private textRef: Ref<string>;
	private opening: boolean;

	private get text(): string {
		return this.textRef.value;
	}

	private set text(text: string) {
		this.textRef.value = text;
	}

	/**
	 * Initialize the object by giving it the targeted text area.
	 */
	constructor(textarea: HTMLInputElement | HTMLTextAreaElement, textRef: Ref<string>) {
		//#region BIND
		this.onInput = this.onInput.bind(this);
		this.complete = this.complete.bind(this);
		this.close = this.close.bind(this);
		//#endregion

		this.suggestion = null;
		this.textarea = textarea;
		this.textRef = textRef;
		this.opening = false;

		this.attach();
	}

	/**
	 * Starts capturing text area input.
	 */
	public attach() {
		this.textarea.addEventListener('input', this.onInput);
	}

	/**
	 * Stop capturing text area input.
	 */
	public detach() {
		this.textarea.removeEventListener('input', this.onInput);
		this.close();
	}

	private onInput() {
		const caretPos = this.textarea.selectionStart;
		const text = this.text.substr(0, caretPos).split('\n').pop()!;

		const mentionIndex = text.lastIndexOf('@');
		const hashtagIndex = text.lastIndexOf('#');
		const emojiIndex = text.lastIndexOf(':');
		const mfmTagIndex = text.lastIndexOf('$');

		const max = Math.max(
			mentionIndex,
			hashtagIndex,
			emojiIndex,
			mfmTagIndex);

		if (max === -1) {
			this.close();
			return;
		}

		const isMention = mentionIndex !== -1;
		const isHashtag = hashtagIndex !== -1;
		const isMfmTag = mfmTagIndex !== -1;
		const isEmoji = emojiIndex !== -1 && text.split(/:[a-z0-9_+\-]+:/).pop()!.includes(':');

		let opened = false;

		if (isMention) {
			const username = text.substr(mentionIndex + 1);
			if (username !== '' && username.match(/^[a-zA-Z0-9_]+$/)) {
				this.open('user', username);
				opened = true;
			} else if (username === '') {
				this.open('user', null);
				opened = true;
			}
		}

		if (isHashtag && !opened) {
			const hashtag = text.substr(hashtagIndex + 1);
			if (!hashtag.includes(' ')) {
				this.open('hashtag', hashtag);
				opened = true;
			}
		}

		if (isEmoji && !opened) {
			const emoji = text.substr(emojiIndex + 1);
			if (!emoji.includes(' ')) {
				this.open('emoji', emoji);
				opened = true;
			}
		}

		if (isMfmTag && !opened) {
			const mfmTag = text.substr(mfmTagIndex + 1);
			if (!mfmTag.includes(' ')) {
				this.open('mfmTag', mfmTag.replace('[', ''));
				opened = true;
			}
		}

		if (!opened) {
			this.close();
		}
	}

	/**
	 * Show suggestions.
	 */
	private async open(type: string, q: string | null) {
		if (type !== this.currentType) {
			this.close();
		}
		if (this.opening) return;
		this.opening = true;
		this.currentType = type;

		// calculate where the suggestion should appear
		const caretPosition = getCaretCoordinates(this.textarea, this.textarea.selectionStart);

		const rect = this.textarea.getBoundingClientRect();

		const x = rect.left + caretPosition.left - this.textarea.scrollLeft;
		const y = rect.top + caretPosition.top - this.textarea.scrollTop;

		if (this.suggestion) {
			this.suggestion.x.value = x;
			this.suggestion.y.value = y;
			this.suggestion.q.value = q;

			this.opening = false;
		} else {
			const _x = ref(x);
			const _y = ref(y);
			const _q = ref(q);

			const { dispose } = await popup(defineAsyncComponent(() => import('@/components/autocomplete.vue')), {
				textarea: this.textarea,
				close: this.close,
				type,
				q: _q,
				x: _x,
				y: _y,
			}, {
				done: (res) => {
					this.complete(res);
				},
			});

			this.suggestion = {
				q: _q,
				x: _x,
				y: _y,
				close: () => dispose(),
			};

			this.opening = false;
		}
	}

	/**
	 * Close suggestion.
	 */
	private close() {
		if (this.suggestion == null) return;

		this.suggestion.close();
		this.suggestion = null;

		this.textarea.focus();
	}

	/**
	 * Positions the cursor within the given text area.
	 */
	private positionCursor(pos) {
		nextTick(() => {
			this.textarea.focus();
			this.textarea.setSelectionRange(pos, pos);
		});
	}

	/**
	 * Write the suggestion to the textarea.
	 */
	private complete({ type, value }) {
		this.close();

		const caret = this.textarea.selectionStart;

		if (type === 'user') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('@'));
			const after = source.substr(caret);

			const acct = value.host === null ? value.username : `${value.username}@${toASCII(value.host)}`;

			this.text = `${trimmedBefore}@${acct} ${after}`;
			// add 2 for "@" and space
			this.positionCursor(trimmedBefore.length + acct.length + 2);
		} else if (type === 'hashtag') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('#'));
			const after = source.substr(caret);

			this.text = `${trimmedBefore}#${value} ${after}`;
			// add 2 for "#" and space
			this.positionCursor(trimmedBefore.length + value.length + 2);
		} else if (type === 'emoji') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf(':'));
			const after = source.substr(caret);

			this.text = trimmedBefore + value + after;
			this.positionCursor(trimmedBefore.length + value.length);
		} else if (type === 'mfmTag') {
			const source = this.text;

			const before = source.substr(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('$'));
			const after = source.substr(caret);

			this.text = `${trimmedBefore}$[${value} ]${after}`;
			this.positionCursor(trimmedBefore.length + value.length + 3);
		}
	}
}
