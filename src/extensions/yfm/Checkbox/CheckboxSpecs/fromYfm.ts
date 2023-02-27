import type {ParserToken} from '../../../../core';
import {CheckboxNode} from '../const';

const getAttrs: ParserToken['getAttrs'] = (tok) => (tok.attrs ? Object.fromEntries(tok.attrs) : {});

export const fromYfm: Record<CheckboxNode, ParserToken> = {
    [CheckboxNode.Checkbox]: {name: CheckboxNode.Checkbox, type: 'block', getAttrs},

    [CheckboxNode.Input]: {name: CheckboxNode.Input, type: 'node', getAttrs},

    [CheckboxNode.Label]: {name: CheckboxNode.Label, type: 'block', getAttrs},
};
