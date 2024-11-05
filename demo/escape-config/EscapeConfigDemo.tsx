import React, {FC} from 'react';

import {PlaygroundMini, PlaygroundMiniProps} from '../playground/PlaygroundMini';

export type EscapeConfigDemoProps = Pick<
    PlaygroundMiniProps,
    'initialEditor' | 'withDefaultInitialContent'
> & {
    commonEscapeRegexp: string;
    startOfLineEscapeRegexp: string;
};

export const EscapeConfigDemo: FC<EscapeConfigDemoProps> = ({
    startOfLineEscapeRegexp,
    commonEscapeRegexp,
    ...props
}) => {
    return (
        <PlaygroundMini
            {...props}
            escapeConfig={{
                commonEscape: new RegExp(commonEscapeRegexp),
                startOfLineEscape: new RegExp(startOfLineEscapeRegexp),
            }}
        />
    );
};
