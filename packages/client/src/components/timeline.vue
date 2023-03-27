<template>
<XNotes ref="tlComponent" :no-gap="!$store.state.showGapBetweenNotesInTimeline" :pagination="pagination" @queue="emit('queue', $event)"/>
</template>

<script lang="ts" setup>
import { computed, provide, onUnmounted } from 'vue';
import XNotes from './notes.vue';
import { stream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';

const props = defineProps<{
	src: 'antenna' | 'home' | 'local' | 'social' | 'global' | 'mentions' | 'directs' | 'list' | 'channel';
	list?: string;
	antenna?: string;
	channel?: string;
	sound?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
}>();

provide('inChannel', computed(() => props.src === 'channel'));

const tlComponent: InstanceType<typeof XNotes> = $ref();

const prepend = note => {
	tlComponent.pagingComponent?.prepend(note);

	emit('note');

	if (props.sound) {
		sound.play($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
};

const onUserAdded = () => {
	tlComponent.pagingComponent?.reload();
};

const onUserRemoved = () => {
	tlComponent.pagingComponent?.reload();
};

const onChangeFollowing = () => {
	if (!tlComponent.pagingComponent?.backed) {
		tlComponent.pagingComponent?.reload();
	}
};

let endpoint;
let query;
let connection;
let connection2;

switch (props.src) {
	case 'antenna':
		endpoint = 'antennas/notes';
		query = {
			antennaId: props.antenna,
		};
		connection = stream.useChannel('antenna', {
			antennaId: props.antenna,
		});
		connection.on('note', prepend);
		break;
	case 'home':
		endpoint = 'notes/timeline';
		connection = stream.useChannel('homeTimeline');
		connection.on('note', prepend);

		connection2 = stream.useChannel('main');
		connection2.on('follow', onChangeFollowing);
		connection2.on('unfollow', onChangeFollowing);
		break;
	case 'local':
		endpoint = 'notes/local-timeline';
		connection = stream.useChannel('localTimeline');
		connection.on('note', prepend);
		break;
	case 'social':
		endpoint = 'notes/hybrid-timeline';
		connection = stream.useChannel('hybridTimeline');
		connection.on('note', prepend);
		break;
	case 'global':
		endpoint = 'notes/global-timeline';
		connection = stream.useChannel('globalTimeline');
		connection.on('note', prepend);
		break;
	case 'mentions':
		endpoint = 'notes/mentions';
		connection = stream.useChannel('main');
		connection.on('mention', prepend);
		break;
	case 'directs':
		endpoint = 'notes/mentions';
		query = {
			visibility: 'specified',
		};
		connection = stream.useChannel('main');
		connection.on('mention', note => {
			if (note.visibility === 'specified') {
				prepend(note);
			}
		});
		break;
	case 'list':
		endpoint = 'notes/user-list-timeline';
		query = {
			listId: props.list,
		};
		connection = stream.useChannel('userList', {
			listId: props.list,
		});
		connection.on('note', prepend);
		connection.on('userAdded', onUserAdded);
		connection.on('userRemoved', onUserRemoved);
		break;
	case 'channel':
		endpoint = 'channels/timeline';
		query = {
			channelId: props.channel,
		};
		connection = stream.useChannel('channel', {
			channelId: props.channel,
		});
		connection.on('note', prepend);
		break;
}

const pagination = {
	endpoint,
	limit: 10,
	params: query,
};

onUnmounted(() => {
	connection.dispose();
	if (connection2) connection2.dispose();
});

/* TODO
const timetravel = (date?: Date) => {
	this.date = date;
	this.$refs.tl.reload();
};
*/
</script>
