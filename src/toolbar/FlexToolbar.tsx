import React from 'react';
import {useMeasure} from 'react-use';

import dotsIcon from '../../assets/icons/dots.svg';

import {cn} from '../classname';
import {Toolbar, ToolbarProps} from './Toolbar';
import {ToolbarListButton} from './ToolbarListButton';
import {shrinkToolbarData} from './flexible';
import {logger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import './FlexToolbar.scss';

const b = cn('flex-toolbar');

export type FlexToolbarProps<E> = ToolbarProps<E>;

export function FlexToolbar<E>(props: FlexToolbarProps<E>) {
    useRenderTime((time) => {
        logger.metrics({
            component: 'toolbar',
            event: 'render',
            duration: time,
        });
    });

    const {data, className} = props;
    const [ref, {width}] = useMeasure<HTMLDivElement>();
    const {data: items, dots} = React.useMemo(
        () => shrinkToolbarData({data, availableWidth: width}),
        [data, width],
    );

    return (
        <div ref={ref} className={b(null, [className])}>
            <div className={b('container')}>
                <Toolbar {...props} data={items} className={b('bar')} />
                {dots?.length && (
                    <ToolbarListButton
                        data={dots}
                        icon={{data: dotsIcon}}
                        editor={props.editor}
                        focus={props.focus}
                        onClick={props.onClick}
                        className={b('dots')}
                    />
                )}
            </div>
        </div>
    );
}
