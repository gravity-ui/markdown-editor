import alphaPlugin from 'alpha-plugin';
import {type SamplePluginOptions, sampleDefaults, samplePlugin} from 'sample-plugin';

import type {ExtensionBuilder} from '../../../../core';

import {sampleLocalPlugin} from './markdown-it';

export type SampleSpecsOptions = Pick<SamplePluginOptions, 'marker'>;

declare global {
    interface DirectiveSyntaxAdditionalSupportedExtensions {
        sample: true;
    }
}

export const SampleSpecs = (builder: ExtensionBuilder) => {
    builder.configureMd((md) =>
        md.use(samplePlugin, {marker: '>>', defaults: sampleDefaults()}).use(alphaPlugin),
    );
    builder.configureMd((md) => md.use(sampleLocalPlugin));
};
