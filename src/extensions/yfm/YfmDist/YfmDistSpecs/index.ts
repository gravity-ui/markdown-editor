import noop from 'lodash/noop';
import type {ExtensionAuto} from '../../../../core';

export const YfmDistSpecs: ExtensionAuto = (builder) => {
    // ignore yfm lint token
    builder.addNode('__yfm_lint', () => ({
        spec: {},
        fromYfm: {tokenSpec: {name: '__yfm_lint', type: 'node', ignore: true}},
        toYfm: noop,
    }));
};
