<template>
<!-- This page does not really have any content, it is mainly processing stuff -->
<MkLoading v-if="state == 'loading'"/>
<MkError v-if="state == 'error'" :final="finalError" @retry="doIt"/>
<div v-if="state == 'done'">{{ i18n.ts.done }}</div>
</template>

<script lang="ts" setup>
import * as Acct from 'foundkey-js/built/acct';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { i18n } from '@/i18n';

let state: 'loading' | 'error' | 'done' = $ref('loading');
let finalError: boolean = $ref(false);

async function follow(user): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.t('followConfirm', { name: user.name || user.username }),
	});

	if (canceled) {
		window.close();
		return;
	}

	os.apiWithDialog('following/create', {
		userId: user.id,
	});
}

function doIt(): void {
	// this might be a retry
	state = 'loading';

	const acct = new URL(location.href).searchParams.get('acct');
	if (acct == null || acct.trim() === '') {
		finalError = true;
		state = 'error';
		return;
	}

	let promise;

	if (acct.startsWith('https://')) {
		promise = os.api('ap/show', {
			uri: acct,
		}).then(res => {
			if (res.type === 'User') {
				follow(res.object);
			} else if (res.type === 'Note') {
				mainRouter.push(`/notes/${res.object.id}`);
			} else {
				os.alert({
					type: 'error',
					text: 'Not a user',
				}).then(() => {
					finalError = true;
					state = 'error';
				});
				return;
			}
			state = 'done';
		});
		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
	} else {
		os.api('users/show', Acct.parse(acct))
			.then(user => follow(user))
			.then(() => state = 'done');
	}
}

doIt();
</script>
