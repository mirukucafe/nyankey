<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<MkInfo class="_formBlock">{{ i18n.ts.proxyAccountDescription }}</MkInfo>
			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.proxyAccount }}</template>
				<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : i18n.ts.none }}</template>
			</MkKeyValue>

			<MkButton primary class="_formBlock" @click="chooseProxyAccount">{{ i18n.ts.selectAccount }}</MkButton>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkKeyValue from '@/components/key-value.vue';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let proxyAccount: any = $ref(null);
let proxyAccountId: any = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	proxyAccountId = meta.proxyAccountId;
	if (proxyAccountId) {
		proxyAccount = await os.api('users/show', { userId: proxyAccountId });
	}
}

function chooseProxyAccount() {
	os.selectUser().then(user => {
		proxyAccount = user;
		proxyAccountId = user.id;
		save();
	});
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		proxyAccountId,
	}).then(() => {
		fetchInstance();
	});
}

definePageMetadata({
	title: i18n.ts.proxyAccount,
	icon: 'fas fa-ghost',
});
</script>
