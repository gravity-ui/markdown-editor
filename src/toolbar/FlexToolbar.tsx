import React from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {useMeasure} from 'react-use';

import {MarkdownEditorMode} from '../bundle';
import {ActionName} from '../bundle/config/action-names';
import {cn} from '../classname';
import {logger} from '../logger';
import {ToolbarNodes} from '../modules/toolbars/types';
import {useRenderTime} from '../react-utils/hooks';

import {Toolbar, ToolbarData, ToolbarProps} from './Toolbar';
import {ToolbarListButton} from './ToolbarListButton';
import {shrinkToolbarData} from './flexible';
import {ToolbarDataType, ToolbarItemData} from './types';

import './FlexToolbar.scss';

const b = cn('flex-toolbar');

export type FlexToolbarProps<E> = ToolbarProps<E> & {
    dotsTitle: string | (() => string);
    hiddenActions?: ToolbarItemData<E>[];
    enableNewToolbarOptions?: boolean;
    toolbarsNodes?: ToolbarNodes;
    toolbarOrders?: (keyof typeof ActionName)[] | (keyof typeof ActionName)[][];
    editorMode?: MarkdownEditorMode;
};

export function FlexToolbar<E>(props: FlexToolbarProps<E>) {
    useRenderTime((time) => {
        logger.metrics({
            component: 'toolbar',
            event: 'render',
            duration: time,
        });
    });

    const {
        data,
        className,
        hiddenActions,
        enableNewToolbarOptions,
        toolbarOrders,
        toolbarsNodes,
        editorMode,
    } = props;

    const [ref, {width}] = useMeasure<HTMLDivElement>();
    const {data: items, dots} = React.useMemo(() => {
        if (enableNewToolbarOptions && toolbarOrders && toolbarsNodes) {
            return {
                data: toolbarOrders.map((itemName) => {
                    if (Array.isArray(itemName)) {
                        return itemName.map((name) => ({
                            type: 's-button',
                            ...toolbarsNodes[name as keyof typeof toolbarsNodes]?.view,
                            ...(editorMode === 'wysiwyg'
                                ? toolbarsNodes[name as keyof typeof toolbarsNodes]?.wysiwygAction
                                : toolbarsNodes[name as keyof typeof toolbarsNodes]?.markupAction),
                        }));
                    } else {
                        return toolbarOrders.map((name) => ({
                            type: 's-button',
                            ...toolbarsNodes[name as keyof typeof toolbarsNodes]?.view,
                            ...(editorMode === 'wysiwyg'
                                ? toolbarsNodes[name as keyof typeof toolbarsNodes]?.wysiwygAction
                                : toolbarsNodes[name as keyof typeof toolbarsNodes]?.markupAction),
                        }));
                    }
                }) as ToolbarData<E>,
                dots: [],
            };
        } else {
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
            const filteredHiddenAction = hiddenActions?.filter(
                (a) => !toolbarButtonIds?.includes(a.id),
            );

            return shrinkToolbarData({
                data,
                availableWidth: width,
                hiddenActions: filteredHiddenAction,
            });
        }
    }, [
        enableNewToolbarOptions,
        toolbarOrders,
        toolbarsNodes,
        editorMode,
        data,
        hiddenActions,
        width,
    ]);

    console.log('items', items);

    return (
        <div ref={ref} className={b(null, [className])}>
            <div className={b('container')}>
                <Toolbar {...props} data={items} className={b('bar')} />
                {dots?.length ? (
                    <ToolbarListButton
                        data={dots}
                        icon={{data: Ellipsis}}
                        title={props.dotsTitle}
                        editor={props.editor}
                        focus={props.focus}
                        onClick={props.onClick}
                        className={b('dots')}
                        alwaysActive={true}
                    />
                ) : undefined}
            </div>
        </div>
    );
}
