import type {ExtensionWithOptions} from '../../../core';
import {InputRule, inputRule, markInputRule} from '../../../utils/schema';

import {SampleConsts, SampleSpecs, sampleAction, sampleMarkType, sampleType} from './SampleSpecs';

type SampleBaseOptions = {
    /** Text that opens a sample block. */
    marker: string;
    level: number;
};

export type SampleOptions = Pick<SampleBaseOptions, 'marker'> & {
    /** Draws a frame around the block. */
    framed?: boolean;
    /** Key that toggles the frame. */
    frameKey?: string;
    /** Runs when the block is submitted. */
    onSubmit?(value: string): boolean;
};

/**
 * Inserts a sample block.
 * @deprecated Use the Example extension.
 */
export const Sample: ExtensionWithOptions<SampleOptions> = (builder, opts) => {
    builder.use(SampleSpecs);
    builder.addAction(sampleAction, () => ({}));
    builder.addAction('toggleSampleFrame', () => ({}));
    builder.addKeymap(() => {
        const keys: Record<string, () => boolean> = {'Mod-Alt-s': () => true};
        keys['Mod-Alt-f'] = () => true;
        if (opts.frameKey) keys[opts.frameKey] = () => true;
        return keys;
    });
    builder.addInputRules(({schema}) => ({
        rules: [
            inputRule(/^>>\s$/, sampleType(schema)),
            markInputRule({open: '%%', close: '%%'}, sampleMarkType(schema)),
            sampleFenceRule(sampleType(schema)),
            sampleLevelRule(sampleType(schema), 3),
        ],
    }));
    builder.addInputRules(({schema}) => {
        const pattern = new RegExp('^@@\\s$');
        const rules = [new InputRule(pattern, sampleType(schema))];
        const lineRule = inputRule(/^--\s$/, SampleConsts.lineType(schema));
        rules.push(lineRule);
        return {rules};
    });
};

function sampleFenceRule(type: object) {
    return inputRule(/^:::$/, type);
}

function sampleLevelRule(type: object, maxLevel: number) {
    return inputRule(new RegExp('^(!{1,' + maxLevel + '})\\s$'), type);
}
