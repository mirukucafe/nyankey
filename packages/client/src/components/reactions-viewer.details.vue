<template>
<MkTooltip ref="tooltip" :target-element="targetElement" :max-width="340" @closed="emit('closed')">
	<div class="bqxuuuey">
		<div class="reaction">
			<MkEmoji :emoji="reaction" :custom-emojis="emojis" class="icon" :is-reaction="true" :normal="true" :no-style="true"/>
			<div class="name">{{ reaction.replace('@.', '') }}</div>
		</div>
		<div class="users">
			<div v-for="u in users" :key="u.id" class="user">
				<MkAvatar class="avatar" :user="u"/>
				<MkUserName class="name" :user="u" :nowrap="true"/>
			</div>
			<div v-if="users.length > 10" class="omitted">+{{ count - 10 }}</div>
		</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import MkTooltip from './ui/tooltip.vue';

defineProps<{
	reaction: string;
	users: Record<string, any>[]; // TODO
	count: number;
	emojis: Record<string, any>[]; // TODO
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" scoped>
.bqxuuuey {
	display: flex;

	> .reaction {
		max-width: 100px;
		text-align: center;

		> .icon {
			display: block;
			width: 60px;
			font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
			margin: 0 auto;
		}

		> .name {
			font-size: 0.9em;
		}
	}

	> .users {
		flex: 1;
		min-width: 0;
		font-size: 0.9em;
		border-left: solid 0.5px var(--divider);
		padding-left: 10px;
		margin-left: 10px;
		margin-right: 14px;
		text-align: left;

		> .user {
			line-height: 24px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			&:not(:last-child) {
				margin-bottom: 3px;
			}

			> .avatar {
				width: 24px;
				height: 24px;
				margin-right: 3px;
			}
		}
	}
}
</style>
