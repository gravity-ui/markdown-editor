import {I18N, type I18NFn} from '@gravity-ui/i18n';

type KeysData = Record<string, string | string[]>; // @gravity-ui/i18n inner type

const i18n = new I18N();

i18n.setLang('en');

export {i18n};
export function registerKeyset<K extends string, D extends KeysData>(
    keyset: K,
    data: Record<'en' | 'ru', D>,
) {
    i18n.registerKeyset('en', keyset, data.en);
    i18n.registerKeyset('ru', keyset, data.ru);

    return (i18n as unknown as I18NFn<Record<K, D>>).keyset(keyset);
}
