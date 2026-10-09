import {registerKeyset} from '../i18n';

import en from './en.json';
import ru from './ru.json';

const KEYSET = 'action-previews';

export const i18n = registerKeyset(KEYSET, {en, ru});
