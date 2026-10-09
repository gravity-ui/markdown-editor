import type {Action, ExtensionAuto} from '#core';

import {FootnoteSpecs, footnoteNodeName} from './FootnoteSpecs';
import {FootnoteView} from './FootnoteView';
import {insertFootnote} from './commands';
import {footnoteNumbering} from './numbering';

import './index.scss';

export {FootnoteSpecs, footnoteNodeName, footnoteType} from './FootnoteSpecs';

export const Footnote: ExtensionAuto = (builder) => {
    builder
        .use(FootnoteSpecs)
        .addPlugin(footnoteNumbering)
        .addNodeView(
            footnoteNodeName,
            (deps) => (node, view, getPos, decorations) =>
                new FootnoteView(node, view, getPos, deps, decorations),
        )
        .addAction('addFootnote', (deps) => ({
            isEnable: insertFootnote(deps),
            run: insertFootnote(deps),
        }));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            addFootnote: Action;
        }
    }
}
