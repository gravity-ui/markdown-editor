import {forwardRef} from 'react';

import {cn} from '@bem-react/classname';
import type {QAProps} from '@gravity-ui/uikit';

import type {ClassNameProps} from '../../../classname';

export const b = cn('yfm');

export type YfmMods = {
    'links-visited'?: boolean;
    'no-list-reset'?: boolean;
    'no-stripe-table'?: boolean;
    [key: string]: string | number | boolean | undefined;
};

export type YfmStaticViewProps = ClassNameProps &
    QAProps & {
        html: string;
        mods?: YfmMods;
        /** @deprecated Use prop `mods.['links-visited']` instead */
        linksVisited?: boolean;
        /** @deprecated Use prop `mods['no-list-reset']` instead */
        noListReset?: boolean;
    };

export const YfmStaticView = forwardRef<HTMLDivElement, YfmStaticViewProps>(
    function YFMStaticView(props, ref) {
        const {html, className, qa} = props;
        const mods = {...props.mods};

        if (props.linksVisited) mods['links-visited'] = true;
        if (props.noListReset) mods['no-list-reset'] = true;

        return (
            <div
                ref={ref}
                dangerouslySetInnerHTML={{__html: html}}
                className={b(mods, className)}
                data-qa={qa}
            />
        );
    },
);
