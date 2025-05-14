import type {Meta} from '@storybook/react';

import type {PlaygroundMiniProps} from '../components/PlaygroundMini';

export const args: Meta<PlaygroundMiniProps>['args'] = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    searchPanel: true,
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
    directiveSyntax: 'disabled',
    disabledHTMLBlockModes: [],
    disableMarkdownItAttrs: true,
};
