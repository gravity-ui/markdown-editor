import {LogoMermaid as MermaidIcon} from '@gravity-ui/icons';
import {
    MarkupHelpers,
    ToolbarDataType,
    type ToolbarItemMarkup,
    type ToolbarItemView,
    type ToolbarItemWysiwyg,
} from '@gravity-ui/markdown-editor';
import type {StateCommand} from '@gravity-ui/markdown-editor/cm/state';

import {i18n} from '../i18n';

export const insertMermaidDiagram: StateCommand = ({state, dispatch}) => {
    const markup = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hi Bob
    Bob->>Alice: Hi Alice
\`\`\``;

    const tr = MarkupHelpers.replaceOrInsertAfter(state, markup);
    dispatch(state.update(tr));
    return true;
};

export const mermaidItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'mermaid'),
    icon: {data: MermaidIcon},
} satisfies ToolbarItemView;

export const mermaidItemWysiwyg = {
    exec: (e) => e.actions.createMermaid.run(),
    isActive: (e) => e.actions.createMermaid.isActive(),
    isEnable: (e) => e.actions.createMermaid.isEnable(),
} satisfies ToolbarItemWysiwyg;

export const mermaidItemMarkup = {
    exec: (e) => insertMermaidDiagram(e.cm),
    isActive: () => false,
    isEnable: () => true,
} satisfies ToolbarItemMarkup;
