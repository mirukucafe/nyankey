<template>
<section class="_section">
	<div class="_title">{{ $t('_auth.shareAccess', { name: app.name }) }}</div>
	<div class="_content">
		<h2>{{ app.name }}</h2>
		<p class="id">{{ app.id }}</p>
		<p class="description">{{ app.description }}</p>
	</div>
	<div class="_content">
		<h2>{{ $ts._auth.permissionAsk }}</h2>
		<ul>
			<li v-for="p in app.permission" :key="p">{{ $t(`_permissions.${p}`) }}</li>
		</ul>
	</div>
	<div class="_footer">
		<MkButton inline @click="cancel">{{ $ts.cancel }}</MkButton>
		<MkButton inline primary @click="accept">{{ $ts.accept }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

const emit = defineEmits<{
	(ev: 'denied'): void;
	(ev: 'accepted'): void;
}>();

const props = defineProps<{
	session: {
		app: {
			name: string;
			id: string;
			description: string;
			permission: string[];
		};
		token: string;
	};
}>();

const app = props.session.app;

function cancel() {
	os.api('auth/deny', {
		token: props.session.token,
	}).then(() => {
		emit('denied');
	});
}

function accept() {
	os.api('auth/accept', {
		token: props.session.token,
	}).then(() => {
		emit('accepted');
	});
}
</script>
