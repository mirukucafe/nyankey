<template>
<div class="">
	<XAntenna v-if="antenna" :antenna="antenna" @updated="onAntennaUpdated"/>
</div>
</template>

<script lang="ts" setup>
import { Antenna } from 'foundkey-js/built/entities';
import XAntenna from './editor.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';

const router = useRouter();

let antenna: Antenna | null = $ref(null);

const props = defineProps<{
	antennaId: string
}>();

function onAntennaUpdated(): void {
	router.push('/my/antennas');
}

os.api('antennas/show', { antennaId: props.antennaId }).then((antennaResponse) => {
	antenna = antennaResponse;
});

definePageMetadata({
	title: i18n.ts.manageAntennas,
	icon: 'fas fa-satellite',
});
</script>

<style lang="scss" scoped>

</style>
