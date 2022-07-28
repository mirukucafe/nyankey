<template>
<!-- This page does not really have any content, it is mainly processing stuff -->
<MkLoading v-if="state == 'loading'"/>
<MkError v-if="state == 'error'" :final="finalError" @retry="doIt"/>
</template>

<script lang="ts">
import { } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { i18n } from '@/i18n';

let state: 'loading' | 'error' | 'done' = $ref('loading');
let finalError: boolean = $ref(false);

async function follow(user) {
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

function doIt() {
	// this might be a retry
	state = 'loading';

	const acct = new URL(location.href).searchParams.get('acct');
	if (acct == null) {
		finalError = true;
		state = 'error';
	}

	let promise;

	if (acct.startsWith('https://')) {
		promise = os.api('ap/show', {
			uri: acct,
		});
		promise.then(res => {
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
			}
		});
	} else {
		promise = os.api('users/show', Acct.parse(acct));
		promise.then(user => {
			follow(user);
		});
	}

	os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
}

doIt();
</script>
