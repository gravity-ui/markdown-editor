import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {NodeSelection, Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {Decoration, DecorationSet} from '@gravity-ui/markdown-editor/pm/view';

import {SectionColumnNodeView} from './SectionColumnNodeView';
import {SectionNodeView} from './SectionNodeView';
import {
    SectionSpecs,
    sectionColumnNodeName,
    sectionNodeName,
    sectionNodeType,
} from './SectionSpecs';
import {insertSection} from './commands';
import {insertSectionAction} from './const';

import '@gravity-ui/markdown-plugin-section/styles.css';

export const Section: ExtensionAuto = (builder) => {
    builder
        .use(SectionSpecs)
        .addNodeView(
            sectionNodeName,
            () => (node, view, getPos, decorations) =>
                new SectionNodeView(node, view, getPos, decorations),
        )
        .addNodeView(
            sectionColumnNodeName,
            () => (node, view, getPos) => new SectionColumnNodeView(node, view, getPos),
        )
        .addPlugin(createSectionSelectionPlugin)
        .addAction(insertSectionAction, () => ({isEnable: insertSection, run: insertSection}));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertSectionAction]: Action;
        }
    }
}

function createSectionSelectionPlugin() {
    return new Plugin({
        props: {
            decorations(state) {
                const {doc, schema, selection} = state;
                const type = sectionNodeType(schema);
                if (selection instanceof NodeSelection && selection.node.type === type) {
                    return DecorationSet.create(doc, [
                        Decoration.node(selection.from, selection.to, {}, {sectionSelected: true}),
                    ]);
                }
                const {$from, $to} = selection;
                for (let depth = $from.depth; depth > 0; depth--) {
                    const node = $from.node(depth);
                    const pos = $from.before(depth);
                    if (node.type === type && $to.pos < pos + node.nodeSize) {
                        return DecorationSet.create(doc, [
                            Decoration.node(pos, pos + node.nodeSize, {}, {sectionSelected: true}),
                        ]);
                    }
                }
                return null;
            },
        },
    });
}
