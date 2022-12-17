<template>
<form class="mk-setup" @submit.prevent="submit()">
	<h1>Welcome to Misskey!</h1>
	<div class="_formRoot">
		<p>{{ i18n.ts.intro }}</p>
		<FormInput v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" required data-cy-admin-username>
			<template #label>{{ i18n.ts.username }}</template>
			<template #prefix>@</template>
		</FormInput>
		<FormInput v-model="password" type="password" data-cy-admin-password>
			<template #label>{{ i18n.ts.password }}</template>
			<template #prefix><i class="fas fa-lock"></i></template>
		</FormInput>
		<div class="bottom">
			<MkButton gradate type="submit" :disabled="submitting" data-cy-admin-ok>
				{{ submitting ? i18n.ts.processing : i18n.ts.done }}<MkEllipsis v-if="submitting"/>
			</MkButton>
		</div>
	</div>
</form>
</template>

<script lang="ts" setup>
import MkButton from '@/components/ui/button.vue';
import FormInput from '@/components/form/input.vue';
import * as os from '@/os';
import { login } from '@/account';
import { i18n } from '@/i18n';

let username = $ref('');
let password = $ref('');
let submitting = $ref(false);

function submit(): void {
	if (submitting) return;
	submitting = true;

	os.api('admin/accounts/create', {
		username,
		password,
	}).then(res => {
		return login(res.token);
	}).catch(() => {
		submitting = false;

		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	});
}
</script>

<style lang="scss" scoped>
.mk-setup {
	border-radius: var(--radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	max-width: 500px;
	margin: 32px auto;

	> h1 {
		margin: 0;
		font-size: 1.5em;
		text-align: center;
		padding: 32px;
		background: var(--accent);
		color: #fff;
	}

	> div {
		padding: 32px;
		background: var(--panel);

		> p {
			margin-top: 0;
		}

		> .bottom {
			> * {
				margin: 0 auto;
			}
		}
	}
}
</style>
