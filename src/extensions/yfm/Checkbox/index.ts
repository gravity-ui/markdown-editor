import {replaceParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto} from '../../../core';
import {nodeInputRule} from '../../../utils/inputrules';
import {pType} from '../../base/BaseSchema';

import {CheckboxSpecs, CheckboxSpecsOptions} from './CheckboxSpecs';
import {addCheckbox} from './actions';
import {CheckboxNode, b} from './const';
import {keymapPlugin} from './plugin';
import {checkboxInputType, checkboxType} from './utils';

import './index.scss';

const checkboxAction = 'addCheckbox';

export {CheckboxNode, checkboxType, checkboxLabelType, checkboxInputType} from './CheckboxSpecs';

export type CheckboxOptions = Pick<CheckboxSpecsOptions, 'checkboxLabelPlaceholder'> & {};

export const Checkbox: ExtensionAuto<CheckboxOptions> = (builder, opts) => {
    builder.use(CheckboxSpecs, {
        ...opts,
        inputView: () => (node, view, getPos) => {
            const dom = document.createElement('input');

            for (const attr in node.attrs) {
                if (node.attrs[attr]) dom.setAttribute(attr, node.attrs[attr]);
            }

            dom.setAttribute('class', b('input'));

            dom.addEventListener('click', (e) => {
                const elem = e.target as HTMLElement;
                const checkedAttr = elem.getAttribute('checked');
                const checked = checkedAttr ? '' : 'true';
                const pos = getPos();

                if (pos !== undefined) {
                    view.dispatch(
                        view.state.tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            checked,
                        }),
                    );
                }

                elem.setAttribute('checked', checked);
            });

            return {
                dom,
                ignoreMutation: () => true,
                update: () => true,
                destroy() {
                    const pos = getPos();
                    if (pos !== undefined) {
                        const resolved = view.state.doc.resolve(pos);
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
                    }
                    dom.remove();
                },
            };
        },
    });

    builder
        .addPlugin(keymapPlugin, builder.Priority.High)
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
    namespace WysiwygEditor {
        interface Actions {
            [checkboxAction]: Action;
        }
    }
}
