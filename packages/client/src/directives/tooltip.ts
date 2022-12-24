// TODO: use the useTooltip function

import { defineAsyncComponent, Directive, ref } from 'vue';
import { isTouchUsing } from '@/scripts/touch';
import { popup, alert } from '@/os';

const delay = 100;

class TooltipDirective {
	public text: string | null;
	private asMfm: boolean;

	private _close: null | () => void;
	private showTimer: null | ReturnType<typeof window.setTimeout>;
	private hideTimer: null | ReturnType<typeof window.setTimeout>;


	constructor(binding) {
		this.text = binding.value;
		this.asMfm = binding.modifiers.mfm ?? false;
		this._close = null;
		this.showTimer = null;
		this.hideTimer = null;
	}

	private close(): void {
		if (this.hideTimer != null) return; // already closed or closing

		// cancel any pending attempts to show
		window.clearTimeout(this.showTimer);
		this.showTimer = null;

		this.hideTimer = window.setTimeout(() => {
			this._close?.();
			this._close = null;
		}, delay);
	}

	public show(el): void {
		if (!document.body.contains(el)) return;
		if (this.text == null) return; // no content
		if (this.showTimer != null) return; // already showing or going to show

		// cancel any pending attempts to hide
		window.clearTimeout(this.hideTimer);
		this.hideTimer = null;

		this.showTimer = window.setTimeout(() => {
			const showing = ref(true);
			popup(defineAsyncComponent(() => import('@/components/ui/tooltip.vue')), {
				showing,
				text: this.text,
				asMfm: this.asMfm,
				targetElement: el,
			}, {}, 'closed');

			this._close = () => {
				showing.value = false;
			};
		}, delay);
	}
}

/**
 * Show a tooltip on mouseover. The content of the tooltip is the text
 * provided as the value of this directive.
 *
 * Supported arguments:
 * v-tooltip:dialog -> show text as a dialog on mousedown
 *
 * Supported modifiers:
 * v-tooltip.mfm -> show tooltip content as MFM
 */
export default {
	created(el: HTMLElement, binding) {
		(el as any)._tooltipDirective_ = new TooltipDirective(binding);
	},

	mounted(el: HTMLElement, binding) {
		const self = el._tooltipDirective_ as TooltipDirective;

		if (binding.arg === 'dialog') {
			el.addEventListener('click', (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				alert({
					type: 'info',
					text: binding.value,
				});
				return false;
			});
		}

		// add event listeners
		const start = isTouchUsing ? 'touchstart' : 'mouseover';
		const end = isTouchUsing ? 'touchend' : 'mouseleave';
		el.addEventListener(start, () => self.show(el), { passive: true });
		el.addEventListener(end, () => self.close(), { passive: true });
		el.addEventListener('click', self.close());
		el.addEventListener('selectstart', ev => ev.preventDefault());
	},

	beforeUpdate(el, binding) {
		(el._tooltipDirective_ as TooltipDirective).text = binding.value as string;
	},

	beforeUnmount(el) {
		(el._tooltipDirective_ as TooltipDirective).close();
	},
} as Directive;
