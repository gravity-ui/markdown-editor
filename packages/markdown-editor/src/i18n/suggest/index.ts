import {registerKeyset} from '../i18n';

import en from './en.json';
import ru from './ru.json';

const KEYSET = 'suggest';

export const i18n = registerKeyset(KEYSET, {en, ru});
