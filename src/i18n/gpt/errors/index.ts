// import {registerKeyset} from '../../../../../i18n/i18n';

import {registerKeyset} from '../../i18n';

import en from './en.json';
import ru from './ru.json';

export const i18n = registerKeyset('gpt-dialog-error-screen', {en, ru});

export type I18nKey = Parameters<typeof i18n>[0];
