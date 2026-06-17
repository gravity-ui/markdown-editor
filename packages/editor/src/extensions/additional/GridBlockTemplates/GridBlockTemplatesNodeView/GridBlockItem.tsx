import type {
    ClipboardEvent,
    FocusEvent,
    MouseEvent,
    PointerEvent as ReactPointerEvent,
} from 'react';

import {Gear, GripHorizontal} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/grid-block-templates';

import {blockClass} from '../css';
import type {GridBlock} from '../types';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';
import type {DropTarget} from './drag';
import {getBlockDragAttrs} from './drag';
import {
    enableTextNodeEditing,
    insertPlainTextAtSelection,
    readTextOnlyEditedHtml,
} from './textEditing';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface GridBlockItemProps {
    block: GridBlock;
    index: number;
    isDragged: boolean;
    isEditing: boolean;
    dropTarget: DropTarget | null;
    onBeginDrag: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
    onOpenSettings: (blockId: string, anchor: HTMLElement) => void;
    onStartEdit: (blockId: string) => void;
    onCommitContent: (blockId: string, content: string) => void;
}

export const GridBlockItem: React.FC<GridBlockItemProps> = ({
    block,
    index,
    isDragged,
    isEditing,
    dropTarget,
    onBeginDrag,
    onOpenSettings,
    onStartEdit,
    onCommitContent,
}) => {
    const number = index + 1;
    const isDropBefore = dropTarget?.id === block.id && dropTarget.placement === 'before';
    const isDropAfter = dropTarget?.id === block.id && dropTarget.placement === 'after';

    const handleOpenSettings = (event: MouseEvent<HTMLElement>) => {
        onOpenSettings(block.id, event.currentTarget);
    };

    const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        onStartEdit(block.id);
        enableTextNodeEditing(event.currentTarget);
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        if (!isEditing) return;

        event.preventDefault();
        insertPlainTextAtSelection(event.clipboardData.getData('text/plain'));
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        const nextFocused = event.relatedTarget;
        if (nextFocused instanceof window.Node && event.currentTarget.contains(nextFocused)) {
            return;
        }

        onCommitContent(block.id, readTextOnlyEditedHtml(event.currentTarget));
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        onBeginDrag(block.id, event);
    };

    return (
        <div
            className={`${b('item', {
                dragged: isDragged,
                'drop-before': isDropBefore,
                'drop-after': isDropAfter,
            })} ${stop} ${blockClass(index)}`}
            {...getBlockDragAttrs(block.id)}
        >
            <button
                type="button"
                className={`${b('item-drag')} ${stop}`}
                onPointerDown={handlePointerDown}
                aria-label={i18n('drag_block', {index: String(number)})}
            >
                <Icon data={GripHorizontal} size={14} />
            </button>
            <Button
                view="flat"
                size="s"
                className={`${b('item-gear')} ${stop}`}
                onClick={handleOpenSettings}
                aria-label={i18n('block_css', {index: String(number)})}
            >
                <Icon data={Gear} size={14} className={stop} />
            </Button>
            <div
                className={`${b('item-content', {editing: isEditing})} ${stop}`}
                contentEditable={false}
                suppressContentEditableWarning
                onDoubleClick={handleDoubleClick}
                onPaste={handlePaste}
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{__html: block.content}}
            />
        </div>
    );
};
