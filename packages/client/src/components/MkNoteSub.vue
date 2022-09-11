<template>
<div v-size="{ max: [450] }" class="wrpstxzv" :class="{ children: depth > 1 }">
	<div class="main">
		<MkAvatar class="avatar" :user="note.user"/>
		<div class="body">
			<XNoteHeader class="header" :note="note" :mini="true"/>
			<div class="body">
				<p v-if="note.cw != null" class="cw">
					<Mfm v-if="note.cw != ''" class="text" :text="note.cw" :author="note.user" :i="$i" :custom-emojis="note.emojis"/>
					<XCwButton v-model="showContent" :note="note"/>
				</p>
				<div v-show="note.cw == null || showContent" class="content">
					<MkNoteSubNoteContent class="text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="conversation">
		<template v-if="depth < 5">
			<MkNoteSub v-for="reply in replies" :key="reply.id" :note="reply" class="reply" :conversation="conversation" :depth="depth + 1"/>
		</template>
		<div v-else-if="replies.length > 0" class="more">
			<MkA class="text _link" :to="notePage(note)">{{ i18n.ts.continueThread }} <i class="fas fa-angle-double-right"></i></MkA>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import * as foundkey from 'foundkey-js';
import XNoteHeader from './note-header.vue';
import MkNoteSubNoteContent from './sub-note-content.vue';
import XCwButton from './cw-button.vue';
import { notePage } from '@/filters/note';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	note: foundkey.entities.Note;
	conversation?: foundkey.entities.Note[] | null;

	// how many notes are in between this one and the note being viewed in detail
	depth?: number;
}>(), {
	conversation: null,
	depth: 1,
});

let showContent = $ref(false);
const replies: foundkey.entities.Note[] = props.conversation?.filter(item => item.replyId === props.note.id || item.renoteId === props.note.id) ?? [];
</script>

<style lang="scss" scoped>
.wrpstxzv {
	padding: 16px 32px;
	font-size: 0.9em;

	&.max-width_450px {
		padding: 14px 16px;
	}

	&.children {
		padding: 10px 0 0 16px;
		font-size: 1em;

		&.max-width_450px {
			padding: 10px 0 0 8px;
		}
	}

	> .main {
		display: flex;

		> .avatar {
			flex-shrink: 0;
			display: block;
			margin: 0 8px 0 0;
			width: 38px;
			height: 38px;
			border-radius: 8px;
		}

		> .body {
			flex: 1;
			min-width: 0;

			> .header {
				margin-bottom: 2px;
			}

			> .body {
				> .cw {
					cursor: default;
					display: block;
					margin: 0;
					padding: 0;
					overflow-wrap: break-word;

					> .text {
						margin-right: 8px;
					}
				}

				> .content {
					> .text {
						margin: 0;
						padding: 0;
					}
				}
			}
		}
	}

	> .reply, > .more {
		border-left: solid 0.5px var(--divider);
		margin-top: 10px;
	}

	> .more {
		padding: 10px 0 0 16px;
	}
}
</style>
