import { markRaw } from 'vue';
import { locale } from '@/config';

class I18n<T extends Record<string, any>> {
	// This contains all defined keys, even if a string is missing in a particular language.
	// This is achieved by setting English strings as a fallback during locale generation in /locales/index.js
	public ts: T;

	constructor(locale: T) {
		this.ts = locale;
		this.t = this.t.bind(this);
	}

	// The key is a string (rather than a Symbol) to allow for the dot-delimited names.
	//
	// If possible it should probably be preferred to use the locale directly (i.e. the ts member),
	// because it may allow for vue to cache information.
	//
	// Performs string interpolation for patters like `{foo}` and replaces it with the respective value from `args` (using its `toString()` method).
	// If a pattern is present in the string but not provided in args, it will not be replaced.
	// If `args` is not provided, no interpolation is performed.
	public t(key: string, args?: Record<string, string | number>): string {
		let str;
		try {
			// Resolve dot-delimited names as properties of objects.
			str = key.split('.').reduce((o, i) => o[i], this.ts) as unknown as string;
		} catch (err) {
			// This should normally not happen because of the English language fallback strings, see comment for ts member.
			console.warn(`missing localization '${key}'`);
			return key;
		}

		// Perform string interpolation.
		if (args) {
			for (const [k, v] of Object.entries(args)) {
				str = str.replace(`{${k}}`, v?.toString());
			}
		}

		return str;
	}
}

export const i18n = markRaw(new I18n(locale));
