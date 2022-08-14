<template>
<div class="zhyxdalp">
	<XValue :value="value" :collapsed="false"/>
</div>
</template>

<script lang="ts" setup>
import XValue from './object-view.value.vue';

defineProps<{
	value: Record<string, unknown>;
}>();
</script>

<style lang="scss" scoped>
.zhyxdalp {

}
</style>
