<template>
<MkModal ref="modal" :prefer-type="'dialog:top'" @click="modal.close()" @closed="emit('closed')">
	<MkPostForm v-bind="$attrs" @posted="modal.close()" @cancel="modal.close()" @esc="modal.close()"/>
</MkModal>
</template>

<script lang="ts" setup>
import MkModal from '@/components/ui/modal.vue';
import MkPostForm from '@/components/post-form.vue';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

let modal: InstanceType<typeof MkModal> = $ref();
</script>
