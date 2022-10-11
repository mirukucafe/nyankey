<template>
<div class="xfbouadm" :style="{ backgroundImage: `url(${ instance.backgroundImageUrl })` }"></div>
</template>

<script lang="ts" setup>
import { instance } from '@/instance';
</script>

<style lang="scss" scoped>
.xfbouadm {
	background-position: center;
	background-size: cover;
}
</style>
