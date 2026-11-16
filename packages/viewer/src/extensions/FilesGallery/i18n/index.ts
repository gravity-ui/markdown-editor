import {addComponentKeysets} from '@gravity-ui/uikit/i18n';

import {NAMESPACE} from '../../../utils/classname';

import en from './en';
import ru from './ru';

const KEYSET = `${NAMESPACE}files-gallery`;

export const i18n: ReturnType<typeof addComponentKeysets<typeof en, typeof KEYSET>> =
    addComponentKeysets({en, ru}, KEYSET);
