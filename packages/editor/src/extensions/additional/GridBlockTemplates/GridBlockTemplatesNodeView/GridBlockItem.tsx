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
import {getTextNodes, openInlineImageSrcEditor, openInlineTextEditor} from './textEditing';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;
const inlineEditButtonSelector = `.${b('inline-edit-button')}`;
const textTargetSelector = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'a',
    'span',
    'strong',
    'em',
    'b',
    'i',
    'li',
    'dt',
    'dd',
    'blockquote',
    'figcaption',
    'cite',
    'small',
    'label',
    'td',
    'th',
].join(',');

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
          element: HTMLElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      }
    | {
          kind: 'image';
          image: HTMLImageElement;
          element: HTMLImageElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      };

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

const getTargetStyles = (root: HTMLElement, target: HTMLElement) => {
    const rect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - rect.left;
    const top = targetRect.top - rect.top;

    return {
        buttonStyle: {
            left: clamp(left + targetRect.width - 28, 4, rect.width - 28),
            top: clamp(top + 4, 4, rect.height - 28),
        },
        outlineStyle: {
            left: Math.max(0, left - 3),
            top: Math.max(0, top - 3),
            width: targetRect.width + 6,
            height: targetRect.height + 6,
        },
    };
};

const getEditableTextElement = (root: HTMLElement, target: Element) => {
    const element = target.closest<HTMLElement>(textTargetSelector);

    if (!element || !root.contains(element) || !getTextNodes(element).length) return null;

    return element;
};

const getInlineEditTarget = (
    root: HTMLElement,
    target: EventTarget | null,
): InlineEditTarget | null => {
    if (!(target instanceof Element) || target.closest(inlineEditButtonSelector)) return null;

    const image = target instanceof HTMLImageElement ? target : target.closest('img');
    if (image instanceof HTMLImageElement && root.contains(image)) {
        return {
            kind: 'image',
            image,
            element: image,
            ...getTargetStyles(root, image),
        };
    }

    const element = getEditableTextElement(root, target);
    if (!element) return null;

    return {
        kind: 'text',
        element,
        ...getTargetStyles(root, element),
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
        if (!root) return;

        const nextTarget = getInlineEditTarget(root, event.target);
        if (!nextTarget) return;

        setInlineEditTarget((currentTarget) => {
            if (
                currentTarget?.kind === nextTarget.kind &&
                currentTarget.element === nextTarget.element
            ) {
                return currentTarget;
            }

            return nextTarget;
        });
    };

    const handleContentMouseOut = (event: MouseEvent<HTMLDivElement>) => {
        const element = inlineEditTarget?.element;
        if (!element || !(event.target instanceof Node) || !element.contains(event.target)) return;

        const nextElement = event.relatedTarget;
        if (
            nextElement instanceof Node &&
            (element.contains(nextElement) ||
                (nextElement instanceof Element && nextElement.closest(inlineEditButtonSelector)))
        ) {
            return;
        }

        setInlineEditTarget(null);
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const root = contentRef.current;
        if (!root || !inlineEditTarget) return;

        if (inlineEditTarget.kind === 'text') {
            const textNode = getTextNodes(inlineEditTarget.element)[0];
            if (!textNode) return;

            openInlineTextEditor({
                root,
                textNode,
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
                onMouseOut={handleContentMouseOut}
                onMouseLeave={() => setInlineEditTarget(null)}
            >
                <div
                    ref={contentRef}
                    className={b('item-content-html')}
                    dangerouslySetInnerHTML={{__html: block.content}}
                />
                {inlineEditTarget && (
                    <>
                        <div
                            className={b('inline-edit-outline')}
                            style={inlineEditTarget.outlineStyle}
                        />
                        <Button
                            view="raised"
                            size="xs"
                            className={`${b('inline-edit-button')} ${stop}`}
                            style={inlineEditTarget.buttonStyle}
                            onClick={handleOpenInlineEdit}
                            aria-label={
                                inlineEditTarget.kind === 'image'
                                    ? i18n('edit_image_src')
                                    : i18n('edit_text')
                            }
                        >
                            <Icon data={Pencil} size={12} className={stop} />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
