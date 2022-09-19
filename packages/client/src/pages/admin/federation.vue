<template>
<MkStickyContainer>
	<template #header><XHeader :actions="[]" :tabs="[]"/></template>
	<MkSpacer :content-max="900">
		<XFederation/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import XHeader from './_header_.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import XFederation from '@/components/federation.vue';

definePageMetadata({
	title: i18n.ts.federation,
	icon: 'fas fa-globe',
});
</script>
