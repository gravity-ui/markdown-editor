import {i18n} from './i18n/i18n';

export function configure({lang}: {lang?: 'en' | 'ru'}) {
    if (lang) i18n.setLang(lang);
}
