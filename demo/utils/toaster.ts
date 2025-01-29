import type {ToasterPublicMethods} from '@gravity-ui/uikit';
import {toaster as toasterSingleton} from '@gravity-ui/uikit/toaster-singleton';

export const toaster: ToasterPublicMethods = toasterSingleton;
