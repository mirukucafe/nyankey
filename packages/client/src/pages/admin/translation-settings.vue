<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions"/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_formRoot">
				<FormSelect v-model="translationService" class="_formBlock">
					<template #label>{{ i18n.ts.translationService }}</template>
					<option value="none">{{ i18n.ts.none }}</option>
					<option value="deepl">DeepL</option>
					<option value="libretranslate">LibreTranslate</option>
				</FormSelect>

				<template v-if="translationService === 'deepl'">
					<FormInput v-model="deeplAuthKey" class="_formBlock">
						<template #prefix><i class="fas fa-key"></i></template>
						<template #label>{{ i18n.ts._translationService._deepl.authKey }}</template>
					</FormInput>
				</template>
				<template v-else-if="translationService === 'libretranslate'">
					<FormInput v-model="libreTranslateEndpoint" class="_formBlock">
						<template #label>{{ i18n.ts._translationService._libreTranslate.endpoint }}</template>
					</FormInput>
					<FormInput v-model="libreTranslateAuthKey" class="_formBlock">
						<template #prefix><i class="fas fa-key"></i></template>
						<template #label>{{ i18n.ts._translationService._libreTranslate.authKey }}</template>
					</FormInput>
				</template>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/input.vue';
import FormSelect from '@/components/form/select.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { fetchInstance } from '@/instance';
import { definePageMetadata } from '@/scripts/page-metadata';

let translationService: string = $ref('none');
let deeplAuthKey: string = $ref('');
let libreTranslateEndpoint: string = $ref('');
let libreTranslateAuthKey: string = $ref('');

async function init(): Promise<void> {
	const meta = await os.api('admin/meta');
	translationService = meta.translationService ?? 'none';
	deeplAuthKey = meta.deeplAuthKey;
	libreTranslateEndpoint = meta.libreTranslateEndpoint;
	libreTranslateAuthKey = meta.libreTranslateAuthKey;
}

function save(): void {
	os.apiWithDialog('admin/update-meta', {
		translationService: translationService === 'none' ? null : translationService,
		deeplAuthKey,
		libreTranslateEndpoint,
		libreTranslateAuthKey,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'fas fa-check',
	text: i18n.ts.save,
	handler: save,
}]);

definePageMetadata({
	title: i18n.ts.translationSettings,
	icon: 'fas fa-language',
});
</script>
