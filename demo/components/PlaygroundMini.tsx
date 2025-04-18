import {memo} from 'react';

import {getInitialMd} from '../utils/getInitialMd';

import {Playground, type PlaygroundProps} from './Playground';

export type PlaygroundMiniProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
    | 'initial'
    | 'onChangeEditorType'
    | 'onChangeSplitModeEnabled'
    | 'directiveSyntax'
    | 'disabledHTMLBlockModes'
    | 'disableMarkdownItAttrs'
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
