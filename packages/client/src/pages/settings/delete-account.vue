<template>
<div class="_formRoot">
	<FormInfo warn class="_formBlock">{{ i18n.ts._accountDelete.mayTakeTime }}</FormInfo>
	<FormInfo class="_formBlock">{{ i18n.ts._accountDelete.sendEmail }}</FormInfo>
	<MkButton v-if="!$i.isDeleted" danger class="_formBlock" @click="deleteAccount">{{ i18n.ts._accountDelete.requestAccountDelete }}</MkButton>
	<MkButton v-else disabled>{{ i18n.ts._accountDelete.inProgress }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import FormInfo from '@/components/ui/info.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { $i, signout } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

async function deleteAccount() {
	{
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.t('deleteAccountConfirm', { handle: '@' + $i.username }),
		});
		if (canceled) return;
	}

	const { canceled, result: password } = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
	});
	if (canceled) return;

	await os.apiWithDialog('i/delete-account', {
		password,
	});

	await os.alert({
		title: i18n.ts._accountDelete.started,
	});

	await signout();
}

definePageMetadata({
	title: i18n.ts._accountDelete.accountDelete,
	icon: 'fas fa-exclamation-triangle',
});
</script>
