import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export const EXTENSION_WHITELIST = [
    {name: 'BaseInputRules', entry: 'packages/editor/src/extensions/base/BaseInputRules/index.ts'},
    {name: 'BaseKeymap', entry: 'packages/editor/src/extensions/base/BaseKeymap/index.ts'},
    {name: 'BaseSchema', entry: 'packages/editor/src/extensions/base/BaseSchema/index.ts'},
    {name: 'BaseStyles', entry: 'packages/editor/src/extensions/base/BaseStyles/index.ts'},
    {name: 'Autocomplete', entry: 'packages/editor/src/extensions/behavior/Autocomplete/index.ts'},
    {
        name: 'ClicksOnEdges',
        entry: 'packages/editor/src/extensions/behavior/ClicksOnEdges/ClicksOnEdges.ts',
    },
    {name: 'Clipboard', entry: 'packages/editor/src/extensions/behavior/Clipboard/index.ts'},
    {name: 'CommandMenu', entry: 'packages/editor/src/extensions/behavior/CommandMenu/index.ts'},
    {name: 'Cursor', entry: 'packages/editor/src/extensions/behavior/Cursor/index.ts'},
    {
        name: 'EditorModeKeymap',
        entry: 'packages/editor/src/extensions/behavior/EditorModeKeymap/index.ts',
    },
    {name: 'FilePaste', entry: 'packages/editor/src/extensions/behavior/FilePaste/index.ts'},
    {name: 'History', entry: 'packages/editor/src/extensions/behavior/History/index.ts'},
    {name: 'Placeholder', entry: 'packages/editor/src/extensions/behavior/Placeholder/index.ts'},
    {
        name: 'ReactRendererExtension',
        entry: 'packages/editor/src/extensions/behavior/ReactRenderer/index.ts',
    },
    {name: 'Search', entry: 'packages/editor/src/extensions/behavior/Search/Search.ts'},
    {name: 'Selection', entry: 'packages/editor/src/extensions/behavior/Selection/index.ts'},
    {
        name: 'SelectionContext',
        entry: 'packages/editor/src/extensions/behavior/SelectionContext/index.ts',
    },
    {
        name: 'SharedState',
        entry: 'packages/editor/src/extensions/behavior/SharedState/SharedState.ts',
    },
    {
        name: 'WidgetDecoration',
        entry: 'packages/editor/src/extensions/behavior/WidgetDecoration/index.ts',
    },
    {name: 'Bold', entry: 'packages/editor/src/extensions/markdown/Bold/index.ts'},
    {name: 'Blockquote', entry: 'packages/editor/src/extensions/markdown/Blockquote/index.ts'},
    {name: 'Breaks', entry: 'packages/editor/src/extensions/markdown/Breaks/index.ts'},
    {name: 'Code', entry: 'packages/editor/src/extensions/markdown/Code/index.ts'},
    {name: 'CodeBlock', entry: 'packages/editor/src/extensions/markdown/CodeBlock/index.ts'},
    {name: 'Deflist', entry: 'packages/editor/src/extensions/markdown/Deflist/index.ts'},
    {name: 'Heading', entry: 'packages/editor/src/extensions/markdown/Heading/index.ts'},
    {
        name: 'HorizontalRule',
        entry: 'packages/editor/src/extensions/markdown/HorizontalRule/index.ts',
    },
    {name: 'Html', entry: 'packages/editor/src/extensions/markdown/Html/index.ts'},
    {name: 'Image', entry: 'packages/editor/src/extensions/markdown/Image/index.ts'},
    {name: 'Italic', entry: 'packages/editor/src/extensions/markdown/Italic/index.ts'},
    {name: 'Link', entry: 'packages/editor/src/extensions/markdown/Link/index.ts'},
    {name: 'Lists', entry: 'packages/editor/src/extensions/markdown/Lists/index.ts'},
    {name: 'Mark', entry: 'packages/editor/src/extensions/markdown/Mark/index.ts'},
    {name: 'Strike', entry: 'packages/editor/src/extensions/markdown/Strike/index.ts'},
    {name: 'Subscript', entry: 'packages/editor/src/extensions/markdown/Subscript/index.ts'},
    {name: 'Superscript', entry: 'packages/editor/src/extensions/markdown/Superscript/index.ts'},
    {name: 'Table', entry: 'packages/editor/src/extensions/markdown/Table/index.ts'},
    {name: 'Underline', entry: 'packages/editor/src/extensions/markdown/Underline/index.ts'},
    {name: 'Checkbox', entry: 'packages/editor/src/extensions/yfm/Checkbox/index.ts'},
    {name: 'Color', entry: 'packages/editor/src/extensions/yfm/Color/index.ts'},
    {name: 'ImgSize', entry: 'packages/editor/src/extensions/yfm/ImgSize/index.ts'},
    {name: 'Monospace', entry: 'packages/editor/src/extensions/yfm/Monospace/index.ts'},
    {name: 'Video', entry: 'packages/editor/src/extensions/yfm/Video/index.ts'},
    {name: 'YfmConfigs', entry: 'packages/editor/src/extensions/yfm/YfmConfigs/index.ts'},
    {name: 'YfmCut', entry: 'packages/editor/src/extensions/yfm/YfmCut/index.ts'},
    {name: 'YfmFile', entry: 'packages/editor/src/extensions/yfm/YfmFile/index.ts'},
    {name: 'YfmHeading', entry: 'packages/editor/src/extensions/yfm/YfmHeading/index.ts'},
    {name: 'YfmNote', entry: 'packages/editor/src/extensions/yfm/YfmNote/index.ts'},
    {name: 'YfmTable', entry: 'packages/editor/src/extensions/yfm/YfmTable/index.ts'},
    {name: 'YfmTabs', entry: 'packages/editor/src/extensions/yfm/YfmTabs/index.ts'},
    {
        name: 'FoldingHeading',
        entry: 'packages/editor/src/extensions/additional/FoldingHeading/FoldingHeading.ts',
    },
    {name: 'Math', entry: 'packages/editor/src/extensions/additional/Math/index.ts'},
    {name: 'Mermaid', entry: 'packages/editor/src/extensions/additional/Mermaid/index.ts'},
    {name: 'QuoteLink', entry: 'packages/editor/src/extensions/additional/QuoteLink/index.ts'},
    {
        name: 'YfmHtmlBlock',
        entry: 'packages/editor/src/extensions/additional/YfmHtmlBlock/index.ts',
    },
    {
        name: 'YfmPageConstructorExtension',
        entry: 'packages/page-constructor-extension/src/extension/index.ts',
    },
];

export const EXTENSION_TYPE_NAMES = new Set(['Extension', 'ExtensionAuto', 'ExtensionWithOptions']);
