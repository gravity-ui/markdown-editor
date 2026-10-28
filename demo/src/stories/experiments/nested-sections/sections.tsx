import {
    BaseTooltipPlugin,
    type ExtensionAuto,
    type ExtensionDeps,
} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

import './sections.scss';

export const layoutNodeName = 'demo_layout';
export const layoutCellNodeName = 'demo_layout_cell';

const NODE_BY_KEYWORD = {layout: layoutNodeName, block: layoutCellNodeName} as const;
type Keyword = keyof typeof NODE_BY_KEYWORD;

const OPEN_RE = /^\{%\s*(layout|block)([^%]*)%\}\s*$/;
const CLOSE_RE = /^\{%\s*end(layout|block)\s*%\}\s*$/;

const lineAt = (state: StateBlock, line: number) =>
    state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);

const sectionsRule = (state: StateBlock, startLine: number, endLine: number, silent: boolean) => {
    const open = OPEN_RE.exec(lineAt(state, startLine));
    if (!open) return false;
    if (silent) return true;

    const keyword = open[1] as Keyword;
    const params = open[2].trim();

    let depth = 1;
    let closeLine = startLine;
    while (depth > 0) {
        if (++closeLine >= endLine) return false;
        const line = lineAt(state, closeLine);
        if (OPEN_RE.exec(line)?.[1] === keyword) depth++;
        else if (CLOSE_RE.exec(line)?.[1] === keyword) depth--;
    }

    const nodeName = NODE_BY_KEYWORD[keyword];

    const token = state.push(`${nodeName}_open`, 'div', 1);
    token.info = params;
    token.map = [startLine, closeLine];

    const {lineMax} = state;
    state.lineMax = closeLine;
    state.md.block.tokenize(state, startLine + 1, closeLine);
    state.lineMax = lineMax;

    state.push(`${nodeName}_close`, 'div', -1);
    state.line = closeLine + 1;

    return true;
};

const sectionsMdPlugin = (md: MarkdownIt) => {
    md.block.ruler.before('fence', 'demo_sections', sectionsRule);
};

// Popups anchored to a node are the source of foreign dom mutations inside contenteditable
const cellTooltipPlugin = (deps: ExtensionDeps) =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'demo-layout-cell-tooltip',
                nodeType: deps.schema.nodes[layoutCellNodeName],
                popupPlacement: ['top-start', 'bottom-start'],
                content: () => <div className="demo-layout__tooltip">Section</div>,
            }),
    });

/**
 * Layout with cells, the same shape as sections in Yandex Wiki:
 * `demo_layout` holds cells and forbids a gap cursor inside itself,
 * `demo_layout_cell` holds any blocks, including nested layouts.
 */
export const DemoSections: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sectionsMdPlugin))
        .addNode(layoutNodeName, () => ({
            spec: {
                attrs: {params: {default: ''}},
                content: 'block+',
                group: 'block',
                gapcursor: false,
                toDOM: () => ['div', {class: 'demo-layout'}, 0],
                parseDOM: [{tag: 'div.demo-layout'}],
            },
            fromMd: {
                tokenSpec: {
                    name: layoutNodeName,
                    type: 'block',
                    getAttrs: (token) => ({params: token.info}),
                },
            },
            toMd: (state, node) => {
                const {params} = node.attrs;
                state.write(`{% layout${params ? ` ${params}` : ''} %}\n\n`);
                state.renderContent(node);
                state.write('{% endlayout %}');
                state.closeBlock(node);
            },
        }))
        .addNode(layoutCellNodeName, () => ({
            spec: {
                attrs: {params: {default: ''}},
                content: 'block+',
                group: 'block',
                definingAsContext: true,
                toDOM: () => ['div', {class: 'demo-layout__cell'}, 0],
                parseDOM: [{tag: 'div.demo-layout__cell'}],
            },
            fromMd: {
                tokenSpec: {
                    name: layoutCellNodeName,
                    type: 'block',
                    getAttrs: (token) => ({params: token.info}),
                },
            },
            toMd: (state, node) => {
                const {params} = node.attrs;
                state.write(`{% block${params ? ` ${params}` : ''} %}\n\n`);
                state.renderContent(node);
                state.write('{% endblock %}');
                state.closeBlock(node);
            },
        }))
        .addPlugin(cellTooltipPlugin);
};
