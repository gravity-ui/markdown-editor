import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeName} from './ButtonSpecs';

import '@gravity-ui/markdown-plugin-header/styles.css';
export const Button: ExtensionAuto = (builder) => {
    builder.use(ButtonSpecs).addNodeView(buttonNodeName, () => (node) => new WButtonNodeView(node));
};
