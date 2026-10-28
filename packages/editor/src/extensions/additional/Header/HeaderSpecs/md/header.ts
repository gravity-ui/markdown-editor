import {
    type ContainerDirectiveHandler,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type Token from 'markdown-it/lib/token';

import {normalizeHeaderActionAttrs, normalizeHeaderAttrs} from '../attrs';
import {
    HeaderActionAttr,
    HeaderAttr,
    HeaderClassName,
    HeaderNode,
    HeaderSlotDirective,
    headerDirectiveName,
} from '../const';

function openHeader(state: StateBlock, params: Parameters<ContainerDirectiveHandler>[1]): void {
    const attrs = normalizeHeaderAttrs({...params.attrs});
    const token = state.push(`${HeaderNode.Header}_open`, 'div', 1);
    token.block = true;
    token.map = [params.startLine, params.endLine];
    token.attrs = [['class', HeaderClassName.Header]];
    for (const key of Object.values(HeaderAttr)) {
        token.attrs.push([`data-${key}`, String(attrs[key])]);
    }
}

/** A custom token preserves literal text without Markdown inline parsing. */
function pushText(state: StateBlock, type: string, tag: string, content: string): Token {
    const token = state.push(type, tag, 0);
    token.block = true;
    token.content = content;
    return token;
}

const headerHandler: ContainerDirectiveHandler = (state, params) => {
    // The directive tokenizer accepts custom parent types beyond markdown-it's type union.
    if ((state.parentType as string) === headerDirectiveName) return false;

    // Use the library's block tokenizer and registered leaf directives, including nested contexts.
    const start = state.tokens.length;
    tokenizeBlockContent(state, params.content, headerDirectiveName);
    const children = state.tokens.splice(start);
    openHeader(state, params);

    for (const [type, className] of [
        [HeaderNode.Title, HeaderClassName.Title],
        [HeaderNode.Description, HeaderClassName.Description],
    ]) {
        pushText(
            state,
            type,
            'div',
            children.find((token) => token.type === type)?.content ?? '',
        ).attrs = [['class', className]];
    }
    const actionsOpen = state.push(`${HeaderNode.Actions}_open`, 'div', 1);
    actionsOpen.block = true;
    actionsOpen.attrs = [['class', HeaderClassName.Actions]];
    for (const action of children.filter((token) => token.type === HeaderNode.Action)) {
        const token = pushText(state, HeaderNode.Action, 'a', action.content);
        token.attrs = action.attrs;
    }
    state.push(`${HeaderNode.Actions}_close`, 'div', -1).block = true;
    state.push(`${HeaderNode.Header}_close`, 'div', -1).block = true;
    return true;
};

/** Custom text tokens need an explicit HTML renderer. */
function renderTextToken(this: void, tokens: Token[], idx: number, md: MarkdownIt): string {
    const token = tokens[idx];
    const attrs = (token.attrs ?? [])
        .map(([name, value]) => ` ${name}="${md.utils.escapeHtml(value)}"`)
        .join('');
    return `<${token.tag}${attrs}>${md.utils.escapeHtml(token.content)}</${token.tag}>`;
}

/** Header directives are enabled independently of the directiveSyntax option. */
export const headerDirective: MarkdownIt.PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, headerDirectiveName, headerHandler);
    for (const slot of ['Title', 'Description', 'Action'] as const) {
        registerLeafBlockDirective(md, HeaderSlotDirective[slot], (state, params) => {
            if ((state.parentType as string) !== headerDirectiveName) return false;
            const token = pushText(
                state,
                HeaderNode[slot],
                slot === 'Action' ? 'a' : 'div',
                md.utils.unescapeAll(params.inlineContent?.raw ?? ''),
            );
            if (slot === 'Action') {
                const attrs = normalizeHeaderActionAttrs({...params.attrs});
                token.attrs = [
                    ['class', HeaderClassName.Action],
                    [`data-${HeaderActionAttr.Type}`, attrs.type],
                    [`data-${HeaderActionAttr.Color}`, attrs.color],
                ];
                if (attrs.href) token.attrs.push([HeaderActionAttr.Href, attrs.href]);
            }
            return true;
        });
    }

    for (const type of [HeaderNode.Title, HeaderNode.Description, HeaderNode.Action]) {
        md.renderer.rules[type] = (tokens, idx) => renderTextToken(tokens, idx, md);
    }
};
