<template>
<Mfm :text="user.name || user.username" :plain="true" :nowrap="nowrap" :custom-emojis="user.emojis"/>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';

withDefaults(defineProps<{
	user: misskey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});
</script>
