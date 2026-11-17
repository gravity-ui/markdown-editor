import {i18n as i18nExtra} from '../../../i18n/extra';
import {i18n} from '../../../i18n/menubar';

export const sampleItemView = {title: i18n.bind(null, 'sample')};

export const sampleFrameItemView = {title: () => i18n('sample-frame')};

export const sampleExtraItemView = {title: i18nExtra.bind(null, 'sample-extra')};
