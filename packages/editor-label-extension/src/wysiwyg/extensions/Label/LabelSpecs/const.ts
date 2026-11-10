import {nodeTypeFactory} from '@gravity-ui/markdown-editor';

export const labelNodeName = 'label';
export const labelNodeType = nodeTypeFactory(labelNodeName);

export enum LabelAttr {
    Text = 'text',
    Color = 'color',
}
