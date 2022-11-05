<template>
<section class="_section">
	<div class="_title">{{ i18n.t('_auth.shareAccess', { name: app.name }) }}</div>
	<div class="_content">
		<h2>{{ app.name }}</h2>
		<p class="description">{{ app.description }}</p>
	</div>
	<div class="_content">
		<h2>{{ i18n.ts._auth.permissionAsk }}</h2>
		<ul v-if="permission.length > 0">
			<li v-for="p in permission" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
		</ul>
		<template v-else>
			{{ i18n.ts.noPermissionRequested }}
		</template>
	</div>
	<div class="_footer">
		<MkButton inline @click="cancel">{{ i18n.ts.cancel }}</MkButton>
		<MkButton inline primary @click="accept">{{ i18n.ts.accept }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'denied'): void;
	(ev: 'accepted'): void;
}>();

const props = defineProps<{
	// TODO: allow user to deselect some permissions
	permission: string[];
	session: {
		app: {
			name: string;
			description: string;
		};
		token: string;
	};
}>();

const app = props.session.app;

function cancel(): void {
	os.api('auth/deny', {
		token: props.session.token,
	}).then(() => {
		emit('denied');
	});
}

function accept(): void {
	os.api('auth/accept', {
		token: props.session.token,
		permission: props.permission,
	}).then(() => {
		emit('accepted');
	});
}
</script>
