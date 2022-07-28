<template>
<div class="adhpbeos">
	<div class="label" @click="focus"><slot name="label"></slot></div>
	<div class="input" :class="{ disabled, focused, tall, pre }">
		<textarea
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			:class="{ code, _monospace: code }"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="onKeydown($event)"
			@input="onInput"
		></textarea>
	</div>
	<div class="caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary class="save" @click="updated"><i class="fas fa-save"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { defineComponent, onMounted, onUnmounted, nextTick, ref, watch, computed, toRefs } from 'vue';
import { debounce } from 'throttle-debounce';
import MkButton from '@/components/ui/button.vue';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'change', v: any): void;
	(ev: 'keydown', v: KeyboardEvent): void;
	(ev: 'enter'): void;
	(ev: 'update:modelValue', v: string): void;
}>();

const props = withDefaults(defineProps<{
	modelValue: string;
	type?: string;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	pattern?: string;
	placeholder?: string;
	autofocus?: boolean;
	autocomplete?: boolean;
	spellcheck?: boolean;
	code?: boolean;
	tall?: boolean;
	pre?: boolean;
	debounce?: boolean;
	manualSave?: boolean;
}>(), {
	autofocus: false,
	tall: false,
	pre: false,
	manualSave: false,
});

const { modelValue, autofocus } = toRefs(props);
// modelValue is read only, so a separate ref is needed.
const v = $ref(modelValue.value);

const focused = $ref(false);
const changed = $ref(false);
const invalid = $ref(false);
const filled = computed(() => modelValue.value !== '' && modelValue.value != null);
const inputEl = $ref(null);

const focus = () => inputEl.focus();
const onInput = evt => {
	changed = true;
	emit('change', evt);
};
const onKeydown = (evt: KeyboardEvent) => {
	emit('keydown', evt);
	if (evt.code === 'Enter') {
		emit('enter');
	}
};
const updated = () => {
	changed = false;
	emit('update:modelValue', v);
};
const debouncedUpdated = debounce(1000, updated);

watch(modelValue, newValue => {
	if (!props.manualSave) {
		if (props.debounce) {
			debouncedUpdated();
		} else {
			updated();
		}
	}

	invalid = inputEl.validity.badInput;
});


onMounted(() => {
	nextTick(() => {
		if (props.autofocus) {
			inputEl.focus();
		}
	});
});
</script>

<style lang="scss" scoped>
.adhpbeos {
	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}

	> .input {
		position: relative;

		> textarea {
			appearance: none;
			-webkit-appearance: none;
			display: block;
			width: 100%;
			min-width: 100%;
			max-width: 100%;
			min-height: 130px;
			margin: 0;
			padding: 12px;
			font: inherit;
			font-weight: normal;
			font-size: 1em;
			color: var(--fg);
			background: var(--panel);
			border: solid 1px var(--panel);
			border-radius: 6px;
			outline: none;
			box-shadow: none;
			box-sizing: border-box;
			transition: border-color 0.1s ease-out;

			&:hover {
				border-color: var(--inputBorderHover) !important;
			}
		}

		&.focused {
			> textarea {
				border-color: var(--accent) !important;
			}
		}

		&.disabled {
			opacity: 0.7;

			&, * {
				cursor: not-allowed !important;
			}
		}

		&.tall {
			> textarea {
				min-height: 200px;
			}
		}

		&.pre {
			> textarea {
				white-space: pre;
			}
		}
	}

	> .save {
		margin: 8px 0 0 0;
	}
}
</style>
