import en from './en.json';

export const i18n = (key: keyof typeof en) => en[key];
