import type {ExtensionAuto} from '#core';

import {ButtonSpecs} from './ButtonSpecs';
import {ButtonView} from './ButtonView';

import './index.scss';

export * from './ButtonSpecs';
export const Button: ExtensionAuto = (builder) => {
    builder.use(ButtonSpecs);
    if (builder.context.get('buttonViewRegistered')) return;
    builder.context.set('buttonViewRegistered', true);
    builder.addNodeView('button', () => (node, view, getPos) => new ButtonView(node, view, getPos));
};
