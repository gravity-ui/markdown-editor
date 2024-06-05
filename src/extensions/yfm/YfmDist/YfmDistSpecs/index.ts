import attrsPlugin, {AttrsOptions} from 'markdown-it-attrs'; // eslint-disable-line import/no-extraneous-dependencies

import type {ExtensionAuto} from '../../../../core';
import {noop} from '../../../../lodash';

const defaultAttrsOpts: AttrsOptions = {
    allowedAttributes: ['id'],
};

export type YfmDistSpecsOptions = {
    /** markdown-it-attrs options */
    attrs?: AttrsOptions;
};

export const YfmDistSpecs: ExtensionAuto<YfmDistSpecsOptions> = (builder, opts) => {
    const attrsOpts = {...defaultAttrsOpts, ...opts.attrs};

    builder.configureMd((md) => md.use<AttrsOptions>(attrsPlugin, attrsOpts), {text: false});

    // ignore yfm lint token
    builder.addNode('__yfm_lint', () => ({
        spec: {},
        fromMd: {tokenSpec: {name: '__yfm_lint', type: 'node', ignore: true}},
        toMd: noop,
    }));
};
