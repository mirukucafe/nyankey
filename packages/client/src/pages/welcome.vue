<template>
	<XSetup v-if="instance.requireSetup"/>
	<XEntrance v-else/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XSetup from './welcome.setup.vue';
import XEntrance from './welcome.entrance.a.vue';
import { instanceName } from '@/config';
import { instance } from '@/instance';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';

definePageMetadata(computed(() => ({
	title: instanceName,
	icon: null,
})));
</script>
