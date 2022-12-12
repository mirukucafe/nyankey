<template>
<div class="ipledcug">
	<div class="_fullinfo">
		<img :src="instance.images.notFound" class="_ghost"/>
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { instance } from '@/instance';

definePageMetadata({
	title: i18n.ts.notFound,
	icon: 'fas fa-exclamation-triangle',
});
</script>
