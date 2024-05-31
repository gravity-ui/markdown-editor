import type {ExtensionAuto} from '../../../../core';
import {noop} from '../../../../lodash';

export const YfmDistSpecs: ExtensionAuto = (builder) => {
    // ignore yfm lint token
    builder.addNode('__yfm_lint', () => ({
        spec: {},
        fromMd: {tokenSpec: {name: '__yfm_lint', type: 'node', ignore: true}},
        toMd: noop,
    }));
};
