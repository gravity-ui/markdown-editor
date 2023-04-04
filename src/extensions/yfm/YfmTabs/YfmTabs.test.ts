import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {blockquoteNodeName, italicMarkName} from '../../markdown/specs';
import {TabsNode, YfmTabsSpecs} from './YfmTabsSpecs';

const generatedId = 'generated_id';

jest.mock('@doc-tools/transform/lib/plugins/utils', () => {
    return {
        generateID: () => generatedId,
    };
});

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(YfmTabsSpecs, {}),
}).buildDeps();

const {doc, p, tab, tabs, tabPanel, tabsList} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
    tab: {nodeType: TabsNode.Tab},
    tabPanel: {nodeType: TabsNode.TabPanel},
    tabs: {nodeType: TabsNode.Tabs},
    tabsList: {nodeType: TabsNode.TabsList},
}) as PMTestBuilderResult<'doc' | 'p' | 'bq' | 'tab' | 'tabPanel' | 'tabs' | 'tabsList'>;

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
                    },
                    tabsList(
                        {
                            class: 'yfm-tab-list',
                            role: 'tablist',
                        },
                        tab(
                            {
                                id: generatedId,
                                class: 'yfm-tab active',
                                role: 'tab',
                                'aria-controls': generatedId,
                                'aria-selected': 'true',
                                tabindex: '0',
                            },
                            'panel title 1',
                        ),
                        tab(
                            {
                                id: generatedId,
                                class: 'yfm-tab',
                                role: 'tab',
                                'aria-controls': generatedId,
                                'aria-selected': 'false',
                                tabindex: '-1',
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
                            'aria-labelledby': generatedId,
                        },
                        p('panel content 1'),
                    ),
                    tabPanel(
                        {
                            id: generatedId,
                            class: 'yfm-tab-panel',
                            role: 'tabpanel',
                            'data-title': 'panel title 2',
                            'aria-labelledby': generatedId,
                        },
                        p('panel content 2'),
                    ),
                ),
            ),
        );
    });
});
