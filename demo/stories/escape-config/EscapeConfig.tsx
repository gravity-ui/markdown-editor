import React, {FC} from 'react';

import {PlaygroundMini, PlaygroundMiniProps} from '../../components/PlaygroundMini';

export type EscapeConfigProps = Pick<
    PlaygroundMiniProps,
    'initialEditor' | 'withDefaultInitialContent'
> & {
    commonEscapeRegexp: string;
    startOfLineEscapeRegexp: string;
};

export const EscapeConfig: FC<EscapeConfigProps> = ({
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
