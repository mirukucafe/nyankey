<template>
<div class="_formRoot">
	<MkButton primary class="_formBlock" @click="generateToken">{{ i18n.ts.generateAccessToken }}</MkButton>
	<FormLink to="/settings/apps" class="_formBlock">{{ i18n.ts.manageAccessTokens }}</FormLink>
	<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null" class="_formBlock">API console</FormLink>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const isDesktop = window.innerWidth >= 1100;

function generateToken() {
	os.popup(defineAsyncComponent(() => import('@/components/token-generate-window.vue')), {}, {
		done: async result => {
			const { name, permissions } = result;
			const { token } = await os.api('miauth/gen-token', {
				session: null,
				name,
				permission: permissions,
			});

			os.alert({
				type: 'success',
				title: i18n.ts.token,
				text: token,
			});
		},
	}, 'closed');
}

definePageMetadata({
	title: 'API',
	icon: 'fas fa-key',
});
</script>
