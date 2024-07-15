import React, {forwardRef} from 'react';

import {classnames} from '@bem-react/classnames';

import {ClassNameProps} from '../../../classname';

export type YFMStaticViewProps = ClassNameProps & {
    html: string;
    linksVisited?: boolean;
    noListReset?: boolean;
    qa?: string;
};

export const YFMStaticView = forwardRef<HTMLDivElement, YFMStaticViewProps>(
    function YFMStaticView(props, ref) {
        const {html, linksVisited, noListReset, className, qa} = props;

        return (
            <div
                ref={ref}
                dangerouslySetInnerHTML={{__html: html}}
                className={classnames(
                    'yfm',
                    linksVisited ? 'yfm_links-visited' : undefined,
                    noListReset ? 'yfm_no-list-reset' : undefined,
                    className,
                )}
                data-qa={qa}
            />
        );
    },
);
