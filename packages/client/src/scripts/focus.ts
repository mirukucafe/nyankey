export function focusPrev(_el: Element | null, self = false, scroll = true) {
	if (_el == null) return;
	const el = self ? _el : _el.previousElementSibling;

	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus({
				preventScroll: !scroll,
			});
		} else {
			focusPrev(el.previousElementSibling, true);
		}
	}
}

export function focusNext(_el: Element | null, self = false, scroll = true) {
	if (_el == null) return;
	const el = self ? _el : _el.nextElementSibling;

	if (el) {
		if (el.hasAttribute('tabindex')) {
			(el as HTMLElement).focus({
				preventScroll: !scroll,
			});
		} else {
			focusPrev(el.nextElementSibling, true);
		}
	}
}
