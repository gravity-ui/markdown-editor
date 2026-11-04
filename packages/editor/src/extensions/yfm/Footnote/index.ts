import type {Action, ExtensionAuto} from '#core';

import {FootnoteSpecs, footnoteNodeName} from './FootnoteSpecs';
import {FootnoteView} from './FootnoteView';
import {insertFootnote} from './commands';
import {footnoteDefinitionPlugin} from './definitions';

import './index.scss';

export {FootnoteSpecs, footnoteNodeName, footnoteType} from './FootnoteSpecs';

export const Footnote: ExtensionAuto = (builder) => {
    builder
        .use(FootnoteSpecs)
        .addPlugin(footnoteDefinitionPlugin)
        .addNodeView(
            footnoteNodeName,
            (deps) => (node, view, getPos, decorations) =>
                new FootnoteView(node, view, getPos, deps, decorations),
        )
        .addAction('addFootnote', () => ({
            isEnable: insertFootnote(),
            run: insertFootnote(),
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            addFootnote: Action;
        }
    }
}
