// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    ImageSpecs,
    LinkSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {createTestEditor, run} from '../../../../tests/editor';
import {BannerSpecs} from '../Banner/BannerSpecs';

import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeType, isButton} from './ButtonSpecs';
import {setButtonAttrs} from './commands';

const specs = (placeholder?: Record<string, string>) =>
    new ExtensionsManager({
        extensions: (builder) => {
            if (placeholder) builder.context.set('placeholder', placeholder);
            builder
                .use(BaseSchemaSpecs, {})
                .use(BlockquoteSpecs)
                .use(ListsSpecs)
                .use(BoldSpecs)
                .use(LinkSpecs)
                .use(ImageSpecs)
                .use(BannerSpecs)
                .use(ButtonSpecs);
        },
    }).buildDeps();

const {schema, markupParser, serializer} = specs();
const {createView, schema: editorSchema} = createTestEditor();
const button =
    ':button[Read more]{href="/page?a=1&b=2" view="outline" color="blue" target="_blank"}';
const plain = ':button[Open]{view="action" color="standard"}';

const buttons = (root: Node) => {
    const result: unknown[] = [];
    root.descendants((node) => {
        if (isButton(node)) result.push(node.attrs);
    });
    return result;
};

const roundTrip = (source: string) => serializer.serialize(markupParser.parse(source));

describe('Button specs', () => {
    it.each([
        [':button[Label]', ':button[Label]{view="action" color="standard"}'],
        [
            ':button[Label]{view="action" color="standard" target="_self" href=""}',
            ':button[Label]{view="action" color="standard"}',
        ],
        [':button[Label]{view="normal"}', ':button[Label]{view="normal" color="gray"}'],
        [
            ':button[Label]{target="_blank" color="blue" view="outline" href="/page"}',
            ':button[Label]{href="/page" view="outline" color="blue" target="_blank"}',
        ],
        [
            ':button[Label]{target="_top"}',
            ':button[Label]{view="action" color="standard" target="_top"}',
        ],
        [':button[ Label ]', ':button[Label]{view="action" color="standard"}'],
        [':button[\\[x\\] a\\\\b]', ':button[\\[x\\] a\\\\b]{view="action" color="standard"}'],
        [':button[**Bold**]', ':button[**Bold**]{view="action" color="standard"}'],
        [':button[a_b*c`d]', ':button[a_b*c`d]{view="action" color="standard"}'],
        [`**${plain}**`, `**${plain}**`],
        [`[${plain}](https://example.com)`, plain],
        [`[Intro ${plain} end](/x)`, `[Intro ](/x)${plain} end`],
        [`[${plain} ${plain}](/x)`, `${plain} ${plain}`],
        [`[**Intro ${plain}** end](/x)`, `[**Intro**](/x) **${plain}** end`],
        [
            ':button[Label]{href="/image&copy;.png?a=1&amp;b=2&#10;"}',
            ':button[Label]{href="/image&copy;.png?a=1&amp;b=2&#10;" view="action" color="standard"}',
        ],
        [
            ':button[Label]{href="/a?x=\\"1\\""}',
            ':button[Label]{href="/a?x=%221%22" view="action" color="standard"}',
        ],
        [':button[]{view="flat"}', ''],
    ])('should save %j as %j', (source, expected) => {
        expect(roundTrip(source)).toBe(expected);
        expect(roundTrip(expected)).toBe(expected);
    });

    it.each([
        button,
        `Press ${button} and read`,
        `${button} ${button}`,
        `${button}${button}`,
        `:::banner\n${button} ${button}\n:::`,
        `:::banner\n\n${button}\n\n${button}\n\n:::`,
        `> ${button}`,
        `- ${button}`,
        `Text ${button} [link](/page)`,
    ])('should preserve buttons across mode switches in %j', (source) => {
        const doc = markupParser.parse(source);
        const serialized = serializer.serialize(doc);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(buttons(DOMParser.fromSchema(schema).parse(container))).toEqual(buttons(doc));
    });
});

describe('Button node view', () => {
    it.each([
        [{label: 'Open', href: '/page'}, 'Open', '/page', null, false],
        [{label: 'Open'}, 'Open', null, 'button', false],
        [{href: '/page'}, 'Button', '/page', null, true],
        [{}, 'Button', null, 'button', true],
        [{label: ' '}, 'Button', null, 'button', true],
    ])(
        'should expose the button %j as a control that opens its settings',
        (attrs, name, href, role, placeholder) => {
            const dom = new WButtonNodeView(buttonNodeType(editorSchema).create(attrs)).dom;
            expect(dom.getAttribute('href')).toBe(href);
            expect(dom.getAttribute('role')).toBe(role);
            expect(dom.getAttribute('aria-haspopup')).toBe('dialog');
            expect(dom.tabIndex).toBe(-1);
            expect(dom.textContent).toBe(name);
            expect(Boolean(dom.querySelector('.g-md-button-nodeview__placeholder'))).toBe(
                placeholder,
            );
        },
    );

    it.each([
        ['the style', {view: 'outline', color: 'blue'}],
        ['the link and the target', {href: '/other', target: '_blank'}],
        ['an empty link', {href: ''}],
        ['the label', {label: 'Read'}],
        ['an empty label', {label: ''}],
    ] as const)('should update the selected button in place when %s changes', (_name, attrs) => {
        const editor = createView(':button[Open]{href="/page"}');
        const domState = (element: HTMLElement) => ({
            attrs: Object.fromEntries(
                Array.from(element.attributes, ({name, value}) => [
                    name,
                    name === 'class' ? value.split(' ').sort().join(' ') : value,
                ]),
            ),
            html: element.innerHTML,
        });
        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 1)));
        const dom = editor.nodeDOM(1) as HTMLElement;
        expect(run(editor, setButtonAttrs(1, attrs))).toBe(true);
        const node = editor.state.doc.nodeAt(1) as Node;
        const fresh = new WButtonNodeView(node).dom;
        fresh.classList.add('ProseMirror-selectednode');
        fresh.contentEditable = 'false';
        fresh.draggable = true;
        expect(editor.nodeDOM(1)).toBe(dom);
        expect(editor.state.selection).toMatchObject({from: 1, node});
        expect(domState(dom)).toEqual(domState(fresh));
    });
});
