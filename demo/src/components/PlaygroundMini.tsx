import {memo} from 'react';

import {getInitialMd} from '../utils/getInitialMd';

import {Playground, type PlaygroundProps} from './Playground';

export type PlaygroundMiniProps = Pick<
    PlaygroundProps,
    | 'mobile'
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'searchPanel'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
    | 'width'
    | 'initial'
    | 'onChangeEditorType'
    | 'onChangeSplitModeEnabled'
    | 'directiveSyntax'
    | 'disabledHTMLBlockModes'
    | 'disableMarkdownItAttrs'
    | 'storyAdditionalControls'
> & {withDefaultInitialContent?: boolean};

export const PlaygroundMini = memo<PlaygroundMiniProps>(
    ({withDefaultInitialContent, initial, ...props}) => (
        <Playground
            {...props}
            initial={initial ?? (withDefaultInitialContent ? getInitialMd() : undefined)}
        />
    ),
);

PlaygroundMini.displayName = 'Playground';
