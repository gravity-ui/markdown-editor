import {I18N, I18NFn} from '@gravity-ui/i18n';

import {Lang, getConfig, subscribeConfigure} from '../configure';

type KeysData = Record<string, string | string[]>; // @gravity-ui/i18n inner type

const i18n = new I18N();

// en – default lang for editor
i18n.setLang(getConfig().lang || Lang.En);

subscribeConfigure((config) => {
    if (config.lang) {
        i18n.setLang(config.lang);
    }
});

export {i18n};
export function registerKeyset<K extends string, D extends KeysData>(
    keyset: K,
    data: Record<'en' | 'ru', D>,
) {
    i18n.registerKeyset(Lang.En, keyset, data.en);
    i18n.registerKeyset(Lang.Ru, keyset, data.ru);

    return (i18n as unknown as I18NFn<Record<K, D>>).keyset(keyset);
}
