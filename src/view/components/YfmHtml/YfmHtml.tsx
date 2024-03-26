import React, {forwardRef} from 'react';

import {classnames} from '@bem-react/classnames';

import {ClassNameProps} from '../../../classname';

export type YfmHtmlProps = ClassNameProps & {
    html: string;
    linksVisited?: boolean;
    noListReset?: boolean;
};

export const YfmHtml = forwardRef<HTMLDivElement, YfmHtmlProps>(function YfmHtml(props, ref) {
    const {html, linksVisited, noListReset, className} = props;

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
        />
    );
});
