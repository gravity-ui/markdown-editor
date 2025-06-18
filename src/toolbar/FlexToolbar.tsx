import {useMemo} from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {useMeasure} from 'react-use';

import {cn} from '../classname';
import {logger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import {Toolbar, type ToolbarProps} from './Toolbar';
import {ToolbarListButton} from './ToolbarListButton';
import {shrinkToolbarData} from './flexible';
import {ToolbarDataType, type ToolbarItemData} from './types';

import './FlexToolbar.scss';

const b = cn('flex-toolbar');

export type FlexToolbarProps<E> = ToolbarProps<E> & {
    dotsTitle: string | (() => string);
    hiddenActions?: ToolbarItemData<E>[];
};

export function FlexToolbar<E>(props: FlexToolbarProps<E>) {
    useRenderTime((time) => {
        logger.metrics({
            component: 'toolbar',
            event: 'render',
            duration: time,
        });
    });

    const {data, className, hiddenActions} = props;

    const [ref, {width}] = useMeasure<HTMLDivElement>();
    const {data: items, dots} = useMemo(() => {
        const toolbarButtonIds = data.reduce((a: string[], toolbarGroup) => {
            return [
                ...a,
                ...toolbarGroup
                    .map((toolbarButton) => {
                        if (toolbarButton.type === ToolbarDataType.ListButton) {
                            return toolbarButton.data.map((v) => v.id);
                        }
                        return toolbarButton.id;
                    })
                    .flat(),
            ];
        }, []);

        // Finding only actions tha are not present in the main toolbar config
        const filteredHiddenAction = hiddenActions?.filter((a) => !toolbarButtonIds.includes(a.id));
        return shrinkToolbarData({
            data,
            availableWidth: width,
            hiddenActions: filteredHiddenAction,
        });
    }, [data, width, hiddenActions]);

    return (
        <div ref={ref} className={b(null, [className])}>
            <div className={b('container')}>
                <Toolbar {...props} data={items} className={b('bar')} />
                {dots?.length && (
                    <ToolbarListButton
                        qa="g-md-toolbar-more-action"
                        qaMenu="g-md-toolbar-additional"
                        data={dots}
                        icon={{data: Ellipsis}}
                        title={props.dotsTitle}
                        editor={props.editor}
                        focus={props.focus}
                        onClick={props.onClick}
                        className={b('dots')}
                        alwaysActive={true}
                    />
                )}
            </div>
        </div>
    );
}
