const locales = await import('../../../../locales/index.js').then(mod => mod.default);

export class I18n {
	public ts: Record<string, any>;

	constructor(locale: string) {
		this.ts = locales[locale];
		this.t = this.t.bind(this);
	}

	// string にしているのは、ドット区切りでのパス指定を許可するため
	// なるべくこのメソッド使うよりもlocale直接参照の方がvueのキャッシュ効いてパフォーマンスが良いかも
	public t(key: string, args?: Record<string, any>): string {
		try {
			let str = key.split('.').reduce((o, i) => o[i], this.ts) as string;

			if (args) {
				for (const [k, v] of Object.entries(args)) {
					str = str.replace(`{${k}}`, v);
				}
			}
			return str;
		} catch (e) {
			console.warn(`missing localization '${key}'`);
			return key;
		}
	}
}
