import { Meta, TranslationService } from '@/models/entities/meta.js';

export function translatorAvailable(instance: Meta): boolean {
	switch (instance.translationService) {
		case TranslationService.DeepL:
			return instance.deeplAuthKey != null;
		case TranslationService.LibreTranslate:
			return instance.libreTranslateEndpoint != null;
		default:
			return false;
	}
}
