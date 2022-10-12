<template>
<div>
	<XDrive @cd="x => folder = x"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XDrive from '@/components/drive.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let folder = $ref(null);

definePageMetadata(computed(() => ({
	title: folder?.name ?? i18n.ts.drive,
	icon: 'fas fa-cloud',
	hideHeader: true,
})));
</script>
