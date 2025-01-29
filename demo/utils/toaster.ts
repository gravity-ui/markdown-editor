import type {ToasterPublicMethods} from '@gravity-ui/uikit';
// @ts-expect-error
import {toaster as toasterSingleton} from '@gravity-ui/uikit/toaster-singleton-react-18';

export const toaster: ToasterPublicMethods = toasterSingleton;
