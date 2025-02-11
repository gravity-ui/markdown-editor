import {chainCommands, setBlockType} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';
// @ts-ignore // TODO: fix cjs build
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto} from '../../../core';
import {withLogAction} from '../../../utils/keymap';

import {BaseSchemaSpecs, BaseSchemaSpecsOptions, pType} from './BaseSchemaSpecs';

export {BaseNode, pType} from './BaseSchemaSpecs';

const pAction = 'toParagraph';

export const toParagraph: Command = (state, dispatch) =>
    setBlockType(pType(state.schema))(state, dispatch);

export type BaseSchemaOptions = BaseSchemaSpecsOptions & {
    paragraphKey?: string | null;
};

export const BaseSchema: ExtensionAuto<BaseSchemaOptions> = (builder, opts) => {
    builder.use(BaseSchemaSpecs, opts);

    const {paragraphKey} = opts;
    if (paragraphKey) {
        builder.addKeymap(({schema}) => ({
            [paragraphKey]: withLogAction('paragraph', setBlockType(pType(schema))),
        }));
    }

    builder.addAction(pAction, ({schema}) => {
        const p = pType(schema);
        const cmd = setBlockType(p);
        const isParagraph: Command = (state) => hasParentNodeOfType(p)(state.selection);

        return {
            isActive: isParagraph,
            isEnable: chainCommands(isParagraph, cmd),
            run: cmd,
        };
    });
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [pAction]: Action;
        }
    }
}
