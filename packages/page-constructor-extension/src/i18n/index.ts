import {registerKeyset} from '@gravity-ui/markdown-editor/i18n';

import en from './en.json';
import ru from './ru.json';

const KEYSET = 'page-constructor';

export const i18n = registerKeyset(KEYSET, {en, ru});
