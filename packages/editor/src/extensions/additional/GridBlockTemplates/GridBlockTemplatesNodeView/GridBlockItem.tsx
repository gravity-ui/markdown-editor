import {useRef, useState} from 'react';
import type {CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent} from 'react';

import {Gear, GripHorizontal, Pencil} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/grid-block-templates';

import {blockClass} from '../css';
import type {GridBlock} from '../types';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';
import type {DropTarget} from './drag';
import {getBlockDragAttrs} from './drag';
import {getTextNodeFromEvent, openInlineImageSrcEditor, openInlineTextEditor} from './textEditing';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface GridBlockItemProps {
    block: GridBlock;
    index: number;
    isDragged: boolean;
    dropTarget: DropTarget | null;
    onBeginDrag: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
    onOpenSettings: (blockId: string, anchor: HTMLElement) => void;
    onCommitContent: (blockId: string, content: string) => void;
}

type InlineEditTarget =
    | {
          kind: 'text';
          textNode: Text;
          style: CSSProperties;
      }
    | {
          kind: 'image';
          image: HTMLImageElement;
          style: CSSProperties;
      };

const getButtonStyle = (
    root: HTMLElement,
    coords: Pick<MouseEvent, 'clientX' | 'clientY'>,
): CSSProperties => {
    const rect = root.getBoundingClientRect();

    return {
        left: Math.max(4, Math.min(coords.clientX - rect.left + 8, rect.width - 28)),
        top: Math.max(4, coords.clientY - rect.top - 18),
    };
};

export const GridBlockItem: React.FC<GridBlockItemProps> = ({
    block,
    index,
    isDragged,
    dropTarget,
    onBeginDrag,
    onOpenSettings,
    onCommitContent,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);

    const number = index + 1;
    const isDropBefore = dropTarget?.id === block.id && dropTarget.placement === 'before';
    const isDropAfter = dropTarget?.id === block.id && dropTarget.placement === 'after';

    const handleOpenSettings = (event: MouseEvent<HTMLElement>) => {
        onOpenSettings(block.id, event.currentTarget);
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        onBeginDrag(block.id, event);
    };

    const handleContentMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        const target = event.target;
        if (!root || !(target instanceof Node) || !root.contains(target)) return;

        if (target instanceof HTMLImageElement) {
            const imageRect = target.getBoundingClientRect();
            setInlineEditTarget({
                kind: 'image',
                image: target,
                style: getButtonStyle(root, {
                    clientX: imageRect.right,
                    clientY: imageRect.top + 18,
                }),
            });
            return;
        }

        const textNode = getTextNodeFromEvent(root, event);
        if (!textNode) return;

        setInlineEditTarget({
            kind: 'text',
            textNode,
            style: getButtonStyle(root, event),
        });
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const root = contentRef.current;
        if (!root || !inlineEditTarget) return;

        if (inlineEditTarget.kind === 'text') {
            openInlineTextEditor({
                root,
                textNode: inlineEditTarget.textNode,
                onCommit: (html) => onCommitContent(block.id, html),
            });
        } else {
            openInlineImageSrcEditor({
                root,
                image: inlineEditTarget.image,
                onCommit: (html) => onCommitContent(block.id, html),
            });
        }

        setInlineEditTarget(null);
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
                className={`${b('item-content')} ${stop}`}
                contentEditable={false}
                suppressContentEditableWarning
                onMouseMove={handleContentMouseMove}
                onMouseLeave={() => setInlineEditTarget(null)}
            >
                <div
                    ref={contentRef}
                    className={b('item-content-html')}
                    dangerouslySetInnerHTML={{__html: block.content}}
                />
                {inlineEditTarget && (
                    <Button
                        view="raised"
                        size="xs"
                        className={`${b('inline-edit-button')} ${stop}`}
                        style={inlineEditTarget.style}
                        onClick={handleOpenInlineEdit}
                        aria-label={
                            inlineEditTarget.kind === 'image'
                                ? i18n('edit_image_src')
                                : i18n('edit_text')
                        }
                    >
                        <Icon data={Pencil} size={12} className={stop} />
                    </Button>
                )}
            </div>
        </div>
    );
};
