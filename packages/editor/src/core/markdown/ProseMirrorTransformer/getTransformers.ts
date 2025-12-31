// TODO: add a new method to the ExtensionBuilder
import {transformEmptyParagraph} from './emptyRowTransformer';

import type {TransformFn} from '.';

type GetTransformersProps = {
    emptyRowTransformer?: boolean;
};

type GetPMTransformersType = (config: GetTransformersProps) => TransformFn[];

export const getPMTransformers: GetPMTransformersType = ({emptyRowTransformer}) => {
    const transformers = [];

    if (emptyRowTransformer) {
        transformers.push(transformEmptyParagraph);
    }

    return transformers;
};
