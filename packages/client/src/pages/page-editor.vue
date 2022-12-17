<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div class="jqqmcavi">
			<MkButton v-if="pageId" class="button" inline link :to="`/@${ author.username }/pages/${ currentName }`"><i class="fas fa-external-link-square-alt"></i> {{ i18n.ts._pages.viewPage }}</MkButton>
			<MkButton v-if="!readonly" inline primary class="button" @click="save"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
			<MkButton v-if="pageId" inline class="button" @click="duplicate"><i class="fas fa-copy"></i> {{ i18n.ts.duplicate }}</MkButton>
			<MkButton v-if="pageId && !readonly" inline class="button" danger @click="del"><i class="fas fa-trash-alt"></i> {{ i18n.ts.delete }}</MkButton>
		</div>

		<div v-if="tab === 'settings'">
			<div class="_formRoot">
				<MkInput v-model="title" :readonly="readonly" class="_formBlock">
					<template #label>{{ i18n.ts._pages.title }}</template>
				</MkInput>

				<MkInput v-model="summary" :readonly="readonly" class="_formBlock">
					<template #label>{{ i18n.ts._pages.summary }}</template>
				</MkInput>

				<MkInput v-model="name" :readonly="readonly" class="_formBlock">
					<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
					<template #label>{{ i18n.ts._pages.url }}</template>
				</MkInput>

				<MkSwitch v-model="alignCenter" :disabled="readonly" class="_formBlock">{{ i18n.ts._pages.alignCenter }}</MkSwitch>

				<FormSelect v-model="font" :readonly="readonly" class="_formBlock">
					<template #label>{{ i18n.ts._pages.font }}</template>
					<option value="serif">{{ i18n.ts._pages.fontSerif }}</option>
					<option value="sans-serif">{{ i18n.ts._pages.fontSansSerif }}</option>
				</FormSelect>

				<MkSwitch v-model="hideTitleWhenPinned" :disabled="readonly" class="_formBlock">{{ i18n.ts._pages.hideTitleWhenPinned }}</MkSwitch>

				<div class="eyeCatch">
					<MkButton v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage"><i class="fas fa-plus"></i> {{ i18n.ts._pages.eyeCatchingImageSet }}</MkButton>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name" style="max-width: 100%;"/>
						<MkButton v-if="!readonly" @click="removeEyeCatchingImage()"><i class="fas fa-trash-alt"></i> {{ i18n.ts._pages.eyeCatchingImageRemove }}</MkButton>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="tab === 'contents'">
			<MkTextarea v-model="text" :readonly="readonly"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormSelect from '@/components/form/select.vue';
import MkSwitch from '@/components/form/switch.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import { url } from '@/config';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import { mainRouter } from '@/router';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const props = defineProps<{
	initPageId?: string;
	initPageName?: string;
	initUser?: string;
}>();

let tab = $ref('settings');
let author = $ref($i);
let readonly = $ref(false);
let page = $ref(null);
let pageId = $ref(null);
let currentName = $ref(null);
let title = $ref('');
let summary = $ref(null);
let text = $ref('Hello, world!');
let name = $ref(Date.now().toString());
let eyeCatchingImage = $ref(null);
let eyeCatchingImageId = $ref(null);
let font = $ref('sans-serif');
let alignCenter = $ref(false);
let hideTitleWhenPinned = $ref(false);

watch($$(eyeCatchingImageId), async () => {
	if (eyeCatchingImageId == null) {
		eyeCatchingImage = null;
	} else {
		eyeCatchingImage = await os.api('drive/files/show', {
			fileId: eyeCatchingImageId,
		});
	}
});

function getSaveOptions() {
	return {
		title: title.trim(),
		name: name.trim(),
		summary,
		font,
		hideTitleWhenPinned,
		alignCenter,
		text,
		eyeCatchingImageId,
	};
}

function save() {
	const options = getSaveOptions();

	const onError = err => {
		if (err.id === '3d81ceae-475f-4600-b2a8-2bc116157532') {
			if (err.info.param === 'name') {
				os.alert({
					type: 'error',
					title: i18n.ts._pages.invalidNameTitle,
					text: i18n.ts._pages.invalidNameText,
				});
			}
		} else if (err.code === 'NAME_ALREADY_EXISTS') {
			os.alert({
				type: 'error',
				text: i18n.ts._pages.nameAlreadyExists,
			});
		}
	};

	if (pageId) {
		options.pageId = pageId;
		os.api('pages/update', options)
		.then(page => {
			currentName = name.trim();
			os.alert({
				type: 'success',
				text: i18n.ts._pages.updated,
			});
		}).catch(onError);
	} else {
		os.api('pages/create', options)
		.then(created => {
			pageId = created.id;
			currentName = name.trim();
			os.alert({
				type: 'success',
				text: i18n.ts._pages.created,
			});
			mainRouter.push(`/pages/edit/${pageId}`);
		}).catch(onError);
	}
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: title.trim() }),
	}).then(({ canceled }) => {
		if (canceled) return;
		os.api('pages/delete', {
			pageId,
		}).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts._pages.deleted,
			});
			mainRouter.push('/pages');
		});
	});
}

function duplicate() {
	title = title + ' - copy';
	name = name + '-copy';
	os.api('pages/create', getSaveOptions()).then(created => {
		pageId = created.id;
		currentName = name.trim();
		os.alert({
			type: 'success',
			text: i18n.ts._pages.created,
		});
		mainRouter.push(`/pages/edit/${pageId}`);
	});
}

function setEyeCatchingImage(evt) {
	selectFile(evt.currentTarget ?? evt.target, null).then(file => {
		eyeCatchingImageId = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId = null;
}

async function init() {
	if (props.initPageId) {
		page = await os.api('pages/show', {
			pageId: props.initPageId,
		});
	} else if (props.initPageName && props.initUser) {
		page = await os.api('pages/show', {
			name: props.initPageName,
			username: props.initUser,
		});
		readonly = true;
	}

	if (page) {
		author = page.user;
		pageId = page.id;
		title = page.title;
		name = page.name;
		currentName = page.name;
		summary = page.summary;
		font = page.font;
		hideTitleWhenPinned = page.hideTitleWhenPinned;
		alignCenter = page.alignCenter;
		text = page.text;
		eyeCatchingImageId = page.eyeCatchingImageId;
	}
}

init();

const headerTabs = $computed(() => [{
	key: 'settings',
	title: i18n.ts._pages.pageSetting,
	icon: 'fas fa-cog',
}, {
	key: 'contents',
	title: i18n.ts._pages.contents,
	icon: 'fas fa-sticky-note',
}]);

definePageMetadata(computed(() => {
	let title = i18n.ts._pages.newPage;
	if (props.initPageId) {
		title = i18n.ts._pages.editPage;
	}
	else if (props.initPageName && props.initUser) {
		title = i18n.ts._pages.readPage;
	}
	return {
		title,
		icon: 'fas fa-pencil-alt',
	};
}));
</script>

<style lang="scss" scoped>
.jqqmcavi {
	margin-bottom: 1em;

	> .button {
		& + .button {
			margin-left: 8px;
		}
	}
}
</style>
