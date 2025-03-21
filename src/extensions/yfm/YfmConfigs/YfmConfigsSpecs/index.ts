import attrsPlugin, {type AttrsOptions} from 'markdown-it-attrs';

import type {ExtensionAuto} from '#core';
import {noop} from 'src/lodash';

const defaultAttrsOpts: AttrsOptions = {
    allowedAttributes: ['id'],
};

export type YfmConfigsSpecsOptions = {
    /** markdown-it-attrs options */
    attrs?: AttrsOptions;
    /** Disable markdown-it-attrs plugin */
    disableAttrs?: boolean;
};

export const YfmConfigsSpecs: ExtensionAuto<YfmConfigsSpecsOptions> = (builder, opts) => {
    const attrsOpts = {...defaultAttrsOpts, ...opts.attrs};

    // MAJOR: remove markdown-it-attrs
    if (!opts.disableAttrs) {
        builder.configureMd((md) => md.use<AttrsOptions>(attrsPlugin, attrsOpts), {text: false});
    }

    // ignore yfm lint token
    builder.addNode('__yfm_lint', () => ({
        spec: {},
        fromMd: {tokenSpec: {name: '__yfm_lint', type: 'node', ignore: true}},
        toMd: noop,
    }));
};
