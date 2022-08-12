<template>
<MkEmoji :emoji="reaction" :custom-emojis="customEmojis" :is-reaction="true" :normal="true" :no-style="noStyle"/>
</template>

<script lang="ts" setup>
import { } from 'vue';

withDefaults(defineProps<{
	reaction: string;
	customEmojis?: Record<string, any>[]; // TODO
	noStyle?: boolean;
}>(), {
	customEmojis: [],
});
</script>
