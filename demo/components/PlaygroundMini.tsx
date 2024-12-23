import React from 'react';

import {getInitialMd} from '../utils/getInitialMd';

import {Playground, PlaygroundProps} from './Playground';

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
> & {withDefaultInitialContent?: boolean};

export const PlaygroundMini = React.memo<PlaygroundMiniProps>(
    ({withDefaultInitialContent, initial, ...props}) => (
        <Playground
            {...props}
            initial={initial ?? (withDefaultInitialContent ? getInitialMd() : undefined)}
        />
    ),
);

PlaygroundMini.displayName = 'Playground';
