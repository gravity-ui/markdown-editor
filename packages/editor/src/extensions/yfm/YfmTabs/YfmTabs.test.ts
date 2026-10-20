import {DOMParser, DOMSerializer} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {applyCommand} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName, italicMarkName} from '../../markdown/specs';

import {TabsNode, YfmTabsSpecs} from './YfmTabsSpecs';
import {createYfmTabsCommand} from './actions';

const mockRandomValue = 0.123456789;
const generatedId = mockRandomValue.toString(36).substr(2, 8);

beforeEach(() => {
    vi.spyOn(global.Math, 'random').mockReturnValue(mockRandomValue);
});

afterEach(() => {
    vi.spyOn(global.Math, 'random').mockRestore();
});

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmTabsSpecs, {}),
}).buildDeps();

const {doc, p, bq, tab, tabs, tabPanel, tabsList, rtab, rtabInput, rtabLabel, rtabs} = builders<
    | 'doc'
    | 'p'
    | 'bq'
    | 'tab'
    | 'tabPanel'
    | 'tabs'
    | 'tabsList'
    | 'rtab'
    | 'rtabs'
    | 'rtabInput'
    | 'rtabLabel'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
    tab: {nodeType: TabsNode.Tab},
    tabPanel: {nodeType: TabsNode.TabPanel},
    tabs: {nodeType: TabsNode.Tabs},
    tabsList: {nodeType: TabsNode.TabsList},
    rtab: {nodeType: TabsNode.RadioTab},
    rtabs: {nodeType: TabsNode.RadioTabs},
    rtabInput: {nodeType: TabsNode.RadioTabInput},
    rtabLabel: {nodeType: TabsNode.RadioTabLabel},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmTabs extension', () => {
    it.each([
        {type: 'tabs', group: 'group_1'},
        {type: 'tabs radio', group: 'group_1'},
        {type: 'tabs', group: 'unknown'},
        {type: 'tabs radio', group: 'unknown'},
    ])('should preserve group $group in $type during a Markdown round trip', ({type, group}) => {
        const markup = dd`
            {% list ${type} group=${group} %}

            - Tab

              Content

            {% endlist %}
        `;

        const parsed = parser.parse(markup);

        expect(parsed.firstChild?.attrs['data-diplodoc-group']).toBe(group);
        expect(serializer.serialize(parsed)).toBe(markup);
    });

    it.each([
        {type: 'tabs', group: "'foo'", markupGroup: `"'foo'"`},
        {type: 'tabs radio', group: "'foo'", markupGroup: `"'foo'"`},
        {type: 'tabs', group: '"foo"', markupGroup: '""foo""'},
        {type: 'tabs radio', group: '"foo"', markupGroup: '""foo""'},
    ])('should preserve quotes in the $type group $group', ({type, group, markupGroup}) => {
        const markup = dd`
            {% list ${type} group=${markupGroup} %}

            - Tab

              Content

            {% endlist %}
        `;

        const parsed = parser.parse(markup);

        expect(parsed.firstChild?.attrs['data-diplodoc-group']).toBe(group);
        expect(serializer.serialize(parsed)).toBe(markup);
    });

    describe.each([
        {type: 'tabs', node: tabs(tabsList(tab('Tab')), tabPanel(p('Content')))},
        {
            type: 'tabs radio',
            node: rtabs(rtab(rtabInput(), rtabLabel('Tab')), tabPanel(p('Content'))),
        },
    ])('$type group serialization', ({type, node}) => {
        it.each([
            {name: 'spaces', group: 'foo bar'},
            {name: 'tabs', group: 'foo\tbar'},
            {name: 'newlines', group: 'foo\nbar'},
            {name: 'carriage returns', group: 'foo\rbar'},
            {name: 'a null character', group: 'foo\0bar'},
            {name: 'equals signs', group: 'foo=bar'},
            {name: 'directive delimiters', group: 'foo%}bar'},
        ])('should omit a group with $name', ({group}) => {
            const groupedNode = node.type.create(
                {...node.attrs, 'data-diplodoc-group': group},
                node.content,
            );
            const markup = dd`
                {% list ${type} %}

                - Tab

                  Content

                {% endlist %}
            `;

            expect(serializer.serialize(doc(groupedNode))).toBe(markup);
        });
    });

    it.each(['tabs', 'tabs radio'])(
        'should omit a group with the reserved prefix in %s',
        (type) => {
            const markup = dd`
                {% list ${type} %}

                - Tab

                  Content

                {% endlist %}
            `;
            const groupedMarkup = markup.replace(
                `{% list ${type} %}`,
                `{% list ${type} group=defaultTabsGroup-shared %}`,
            );

            expect(serializer.serialize(parser.parse(groupedMarkup))).toBe(markup);
        },
    );

    it.each([
        {
            type: 'tabs',
            node: tabs(tabsList(tab('Tab')), tabPanel(p('Content'))),
        },
        {
            type: 'tabs radio',
            node: rtabs(rtab(rtabInput(), rtabLabel('Tab')), tabPanel(p('Content'))),
        },
    ])('should keep $type without a group independent during serialization', ({type, node}) => {
        const markup = dd`
            {% list ${type} %}

            - Tab

              Content

            {% endlist %}
        `;

        expect(serializer.serialize(doc(node, node))).toBe(`${markup}\n\n${markup}`);
    });

    describe.each([
        {type: 'tabs', node: tabs(tabsList(tab('Tab')), tabPanel(p('Content')))},
        {
            type: 'tabs radio',
            node: rtabs(rtab(rtabInput(), rtabLabel('Tab')), tabPanel(p('Content'))),
        },
    ])('$type DOM serialization', ({node}) => {
        it('should give independent tabs different DOM groups without changing model groups', () => {
            vi.mocked(global.Math.random).mockReturnValueOnce(0.1).mockReturnValueOnce(0.2);
            const firstNode = node.type.create(null, node.content);
            const secondNode = node.type.create(null, node.content);
            const dom = DOMSerializer.fromSchema(schema).serializeFragment(
                doc(firstNode, secondNode).content,
            );
            const [firstTabs, secondTabs] = dom.querySelectorAll('.yfm-tabs');
            const firstGroup = firstTabs.getAttribute('data-diplodoc-group');
            const secondGroup = secondTabs.getAttribute('data-diplodoc-group');

            expect(firstGroup).toMatch(/^defaultTabsGroup-.+/);
            expect(secondGroup).toMatch(/^defaultTabsGroup-.+/);
            expect(firstGroup).not.toBe(secondGroup);
            expect(firstNode.attrs['data-diplodoc-group']).toBeNull();
            expect(secondNode.attrs['data-diplodoc-group']).toBeNull();
        });

        it('should preserve an explicit group in the DOM and model', () => {
            const groupedNode = node.type.create({'data-diplodoc-group': 'group_1'}, node.content);
            const dom = DOMSerializer.fromSchema(schema).serializeFragment(
                doc(groupedNode).content,
            );

            expect(dom.firstElementChild?.getAttribute('data-diplodoc-group')).toBe('group_1');
            expect(groupedNode.attrs['data-diplodoc-group']).toBe('group_1');
        });
    });

    it('should omit the group generated when creating tabs', () => {
        const state = EditorState.create({schema});
        const {tr} = applyCommand(state, createYfmTabsCommand);

        expect(serializer.serialize(tr.doc).split('\n')[0]).toBe('{% list tabs %}');
    });

    it('should omit a missing group after importing tabs from HTML', () => {
        const container = document.createElement('div');
        container.innerHTML = dd`
            <div class="yfm-tabs">
                <div class="yfm-tab-list"><div class="yfm-tab">Tab</div></div>
                <div class="yfm-tab-panel">Content</div>
            </div>
        `;
        const parsed = DOMParser.fromSchema(schema).parse(container);
        const markup = dd`
            {% list tabs %}

            - Tab

              Content

            {% endlist %}
        `;

        expect(serializer.serialize(parsed)).toBe(markup);
    });

    it('should parse yfm-tabs', () => {
        const markup = `
{% list tabs %}

- panel title 1

  panel content 1

- panel title 2

  panel content 2

{% endlist %}
`.trim();

        same(
            markup,
            doc(
                tabs(
                    {
                        class: 'yfm-tabs',
                        'data-diplodoc-group': `defaultTabsGroup-${generatedId}`,
                    },
                    tabsList(
                        {
                            class: 'yfm-tab-list',
                            role: 'tablist',
                        },
                        tab(
                            {
                                id: 'unknown',
                                class: 'yfm-tab yfm-tab-group active',
                                role: 'tab',
                                'aria-controls': `regular-${generatedId}`,
                                'aria-selected': 'true',
                                tabindex: '0',
                                'data-diplodoc-is-active': 'true',
                                'data-diplodoc-id': 'panel-title-1',
                                'data-diplodoc-key': 'panel%20title%201',
                            },
                            'panel title 1',
                        ),
                        tab(
                            {
                                id: 'unknown',
                                class: 'yfm-tab yfm-tab-group',
                                role: 'tab',
                                'aria-controls': `regular-${generatedId}`,
                                'aria-selected': 'false',
                                tabindex: '-1',
                                'data-diplodoc-is-active': 'false',
                                'data-diplodoc-id': 'panel-title-2',
                                'data-diplodoc-key': 'panel%20title%202',
                            },
                            'panel title 2',
                        ),
                    ),
                    tabPanel(
                        {
                            id: `regular-${generatedId}`,
                            class: 'yfm-tab-panel active',
                            role: 'tabpanel',
                            'data-title': 'panel title 1',
                            'aria-labelledby': 'panel-title-1',
                        },
                        p('panel content 1'),
                    ),
                    tabPanel(
                        {
                            id: `regular-${generatedId}`,
                            class: 'yfm-tab-panel',
                            role: 'tabpanel',
                            'data-title': 'panel title 2',
                            'aria-labelledby': 'panel-title-2',
                        },
                        p('panel content 2'),
                    ),
                ),
            ),
        );
    });

    it('should correct parse and serialize yfm-tabs inside blockqute', () => {
        const markup = `
> {% list tabs %}
>${' '}
> - Tab
>${' '}
>   Content
>
> {% endlist %}`.trim();

        same(
            markup,
            doc(
                bq(
                    tabs(
                        {
                            class: 'yfm-tabs',
                            'data-diplodoc-group': `defaultTabsGroup-${generatedId}`,
                        },
                        tabsList(
                            {
                                class: 'yfm-tab-list',
                                role: 'tablist',
                            },
                            tab(
                                {
                                    id: 'unknown',
                                    class: 'yfm-tab yfm-tab-group active',
                                    role: 'tab',
                                    'aria-controls': `regular-${generatedId}`,
                                    'aria-selected': 'true',
                                    tabindex: '0',
                                    'data-diplodoc-is-active': 'true',
                                    'data-diplodoc-id': 'tab',
                                    'data-diplodoc-key': 'tab',
                                },
                                'Tab',
                            ),
                        ),
                        tabPanel(
                            {
                                id: `regular-${generatedId}`,
                                class: 'yfm-tab-panel active',
                                role: 'tabpanel',
                                'data-title': 'Tab',
                                'aria-labelledby': 'tab',
                            },
                            p('Content'),
                        ),
                    ),
                ),
            ),
        );
    });

    it('should correct parse and serialize radio tabs', () => {
        const markup = `
{% list tabs radio %}

- Radio button 1

  Text of radio button 1

  You can paste nested radio tabs

  {% list tabs radio %}
${'  '}
  - Nested radio button 1
${'  '}
    Text of nested radio button 1

  - Nested radio button 2
${'  '}
    Text of nested radio button 2

  {% endlist %}

- Radio button 2

  Text of radio button 2

{% endlist %}
`.trim();

        same(
            markup,
            doc(
                rtabs(
                    {
                        class: 'yfm-tabs yfm-tabs-vertical',
                        'data-diplodoc-group': `defaultTabsGroup-${generatedId}`,
                    },
                    rtab(
                        {
                            id: null,
                            class: 'yfm-tab yfm-tab-group yfm-vertical-tab',
                            role: 'tab',
                            'aria-controls': `radio-${generatedId}`,
                            'aria-selected': 'false',
                            tabindex: '0',
                            'data-diplodoc-is-active': 'false',
                            'data-diplodoc-id': 'radio-button-1',
                            'data-diplodoc-key': 'radio%20button%201',
                        },
                        rtabInput({
                            class: 'radio',
                            type: 'radio',
                            checked: null,
                        }),
                        rtabLabel('Radio button 1'),
                    ),
                    tabPanel(
                        {
                            id: `radio-${generatedId}`,
                            class: 'yfm-tab-panel',
                            role: 'tabpanel',
                            'data-title': 'Radio button 1',
                            'aria-labelledby': 'radio-button-1',
                        },
                        p('Text of radio button 1'),
                        p('You can paste nested radio tabs'),
                        rtabs(
                            {
                                class: 'yfm-tabs yfm-tabs-vertical',
                                'data-diplodoc-group': `defaultTabsGroup-${generatedId}`,
                            },
                            rtab(
                                {
                                    id: null,
                                    class: 'yfm-tab yfm-tab-group yfm-vertical-tab',
                                    role: 'tab',
                                    'aria-controls': `radio-${generatedId}`,
                                    'aria-selected': 'false',
                                    tabindex: '0',
                                    'data-diplodoc-is-active': 'false',
                                    'data-diplodoc-id': 'nested-radio-button-1',
                                    'data-diplodoc-key': 'nested%20radio%20button%201',
                                },
                                rtabInput({
                                    class: 'radio',
                                    type: 'radio',
                                    checked: null,
                                }),
                                rtabLabel('Nested radio button 1'),
                            ),
                            tabPanel(
                                {
                                    id: `radio-${generatedId}`,
                                    class: 'yfm-tab-panel',
                                    role: 'tabpanel',
                                    'data-title': 'Nested radio button 1',
                                    'aria-labelledby': 'nested-radio-button-1',
                                },
                                p('Text of nested radio button 1'),
                            ),
                            rtab(
                                {
                                    id: null,
                                    class: 'yfm-tab yfm-tab-group yfm-vertical-tab',
                                    role: 'tab',
                                    'aria-controls': `radio-${generatedId}`,
                                    'aria-selected': 'false',
                                    tabindex: '-1',
                                    'data-diplodoc-is-active': 'false',
                                    'data-diplodoc-id': 'nested-radio-button-2',
                                    'data-diplodoc-key': 'nested%20radio%20button%202',
                                },
                                rtabInput({
                                    class: 'radio',
                                    type: 'radio',
                                    checked: null,
                                }),
                                rtabLabel('Nested radio button 2'),
                            ),
                            tabPanel(
                                {
                                    id: `radio-${generatedId}`,
                                    class: 'yfm-tab-panel',
                                    role: 'tabpanel',
                                    'data-title': 'Nested radio button 2',
                                    'aria-labelledby': 'nested-radio-button-2',
                                },
                                p('Text of nested radio button 2'),
                            ),
                        ),
                    ),
                    rtab(
                        {
                            id: null,
                            class: 'yfm-tab yfm-tab-group yfm-vertical-tab',
                            role: 'tab',
                            'aria-controls': `radio-${generatedId}`,
                            'aria-selected': 'false',
                            tabindex: '-1',
                            'data-diplodoc-is-active': 'false',
                            'data-diplodoc-id': 'radio-button-2',
                            'data-diplodoc-key': 'radio%20button%202',
                        },
                        rtabInput({
                            class: 'radio',
                            type: 'radio',
                            checked: null,
                        }),
                        rtabLabel('Radio button 2'),
                    ),
                    tabPanel(
                        {
                            id: `radio-${generatedId}`,
                            class: 'yfm-tab-panel',
                            role: 'tabpanel',
                            'data-title': 'Radio button 2',
                            'aria-labelledby': 'radio-button-2',
                        },
                        p('Text of radio button 2'),
                    ),
                ),
            ),
        );
    });
});
