import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName, italicMarkName} from '../../markdown/specs';

import {TabsNode, YfmTabsSpecs} from './YfmTabsSpecs';

const mockRandomValue = 0.123456789;
const generatedId = mockRandomValue.toString(36).substr(2, 8);

beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(mockRandomValue);
});

afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
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
                                'aria-controls': generatedId,
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
                                'aria-controls': generatedId,
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
                            id: generatedId,
                            class: 'yfm-tab-panel active',
                            role: 'tabpanel',
                            'data-title': 'panel title 1',
                            'aria-labelledby': 'panel-title-1',
                        },
                        p('panel content 1'),
                    ),
                    tabPanel(
                        {
                            id: generatedId,
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
                                    'aria-controls': generatedId,
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
                                id: generatedId,
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
                            'aria-controls': generatedId,
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
                            id: generatedId,
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
                                    'aria-controls': generatedId,
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
                                    id: generatedId,
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
                                    'aria-controls': generatedId,
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
                                    id: generatedId,
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
                            'aria-controls': generatedId,
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
                            id: generatedId,
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
