<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_formRoot">
				<FormFolder class="_formBlock">
					<template #icon><i class="fas fa-shield-alt"></i></template>
					<template #label>{{ i18n.ts.botProtection }}</template>
					<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
					<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
					<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>

					<XBotProtection/>
				</FormFolder>

				<FormFolder class="_formBlock">
					<template #label>Summaly Proxy</template>

					<div class="_formRoot">
						<FormInput v-model="summalyProxy" class="_formBlock">
							<template #prefix><i class="fas fa-link"></i></template>
							<template #label>Summaly Proxy URL</template>
						</FormInput>

						<MkButton primary class="_formBlock" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</FormFolder>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import XBotProtection from './bot-protection.vue';
import FormFolder from '@/components/form/folder.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormInput from '@/components/form/input.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let summalyProxy: string = $ref('');
let enableHcaptcha: boolean = $ref(false);
let enableRecaptcha: boolean = $ref(false);

async function init(): Promise<void> {
	const meta = await os.api('admin/meta');
	summalyProxy = meta.summalyProxy;
	enableHcaptcha = meta.enableHcaptcha;
	enableRecaptcha = meta.enableRecaptcha;
}

function save(): void {
	os.apiWithDialog('admin/update-meta', {
		summalyProxy,
	}).then(() => {
		fetchInstance();
	});
}

definePageMetadata({
	title: i18n.ts.security,
	icon: 'fas fa-lock',
});
</script>
