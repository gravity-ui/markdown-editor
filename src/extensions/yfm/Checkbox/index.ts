import checkboxPlugin from '@doc-tools/transform/lib/plugins/checkbox';
import type {Action, ExtensionAuto} from '../../../core';
import {replaceParentNodeOfType} from 'prosemirror-utils';
import {CheckboxNode} from './const';
import {keymapPlugin} from './plugin';
import {cn} from '../../../classname';

import './index.scss';
import {CheckboxSpecOptions, getSpec} from './spec';
import {toYfm} from './toYfm';
import {fromYfm} from './fromYfm';
import {addCheckbox} from './actions';
import {nodeInputRule} from '../../../utils/inputrules';
import {checkboxInputType, checkboxType} from './utils';
import {pType} from '../../base/BaseSchema';

const checkboxAction = 'addCheckbox';
const idPrefix = 'yfm-editor-checkbox';

const b = cn('checkbox');

export type CheckboxOptions = CheckboxSpecOptions & {};

export const Checkbox: ExtensionAuto<CheckboxOptions> = (builder, opts) => {
    const spec = getSpec(opts);

    builder
        .configureMd((md) => checkboxPlugin(md, {idPrefix, divClass: b()}))
        .addNode(CheckboxNode.Checkbox, () => ({
            spec: spec[CheckboxNode.Checkbox],
            toYfm: toYfm[CheckboxNode.Checkbox],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Checkbox],
            },
        }))
        .addNode(CheckboxNode.Input, () => ({
            spec: spec[CheckboxNode.Input],
            toYfm: toYfm[CheckboxNode.Input],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Input],
            },
            view: () => (node, view, getPos) => {
                const dom = document.createElement('input');

                for (const attr in node.attrs) {
                    if (node.attrs[attr]) dom.setAttribute(attr, node.attrs[attr]);
                }

                dom.setAttribute('class', b('input'));

                dom.addEventListener('click', (e) => {
                    const elem = e.target as HTMLElement;
                    const checkedAttr = elem.getAttribute('checked');
                    const checked = checkedAttr ? '' : 'true';

                    view.dispatch(
                        view.state.tr.setNodeMarkup(getPos(), undefined, {
                            ...node.attrs,
                            checked,
                        }),
                    );

                    elem.setAttribute('checked', checked);
                });

                return {
                    dom,
                    ignoreMutation: () => true,
                    update: () => true,
                    destroy() {
                        const resolved = view.state.doc.resolve(getPos());
                        if (
                            resolved.parent.type.name === CheckboxNode.Checkbox &&
                            resolved.parent.lastChild
                        ) {
                            view.dispatch(
                                replaceParentNodeOfType(
                                    resolved.parent.type,
                                    pType(view.state.schema).create(
                                        resolved.parent.lastChild.content,
                                    ),
                                )(view.state.tr),
                            );
                        }
                        dom.remove();
                    },
                };
            },
        }))
        .addNode(CheckboxNode.Label, () => ({
            spec: spec[CheckboxNode.Label],
            toYfm: toYfm[CheckboxNode.Label],
            fromYfm: {
                tokenSpec: fromYfm[CheckboxNode.Label],
                tokenName: 'checkbox_label',
            },
        }))
        .addPlugin(keymapPlugin)
        .addAction(checkboxAction, () => addCheckbox())
        .addInputRules(({schema}) => ({
            rules: [
                nodeInputRule(
                    /^\[(\s?)\]\s$/,
                    checkboxType(schema).createAndFill({}, checkboxInputType(schema).create()),
                    2,
                ),
            ],
        }));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [checkboxAction]: Action;
        }
    }
}
