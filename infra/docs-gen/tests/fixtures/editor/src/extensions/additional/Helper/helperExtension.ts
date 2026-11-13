import type {ExtensionBuilder} from '../../../core';

export const helperExtension = (builder: ExtensionBuilder) => {
    builder.addAction('runHelper', () => ({}));
};
