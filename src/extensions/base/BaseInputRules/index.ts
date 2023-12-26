import {ellipsis, smartQuotes} from 'prosemirror-inputrules';

import type {ExtensionAuto} from '../../../core';

export const BaseInputRules: ExtensionAuto = (builder) => {
    builder.addInputRules(() => ({rules: [...smartQuotes, ellipsis]}));
};
