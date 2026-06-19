import {useRef, useState} from 'react';
import type {
    CSSProperties,
    FC,
    KeyboardEvent,
    MouseEvent,
    PointerEvent as ReactPointerEvent,
} from 'react';

import {GripHorizontal, Pencil} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {blockClass, htmlConstructorBlockClass} from '../css';
import {htmlConstructorQuickStyleToReactStyle} from '../quickStyle';
import type {HtmlConstructorBlock, HtmlConstructorQuickStyle} from '../types';

import {FloatingToolbar} from './FloatingToolbar';
import {BlockSettingsPanel} from './SettingsPopups';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import type {DropTarget} from './drag';
import {getBlockDragAttrs} from './drag';
import {
    getTextNodes,
    openInlineImageSrcEditor,
    openInlineLinkEditor,
    openInlineTextEditor,
} from './textEditing';

const b = cnYfmHtmlConstructor;
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

interface HtmlBlockItemProps {
    block: HtmlConstructorBlock;
    index: number;
    isDragged: boolean;
    dropTarget: DropTarget | null;
    onBeginDrag: (blockId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
    onCommitContent: (blockId: string, content: string) => void;
    onCssChange: (blockId: string, css: string) => void;
    onQuickStyleChange: (blockId: string, quickStyle: HtmlConstructorQuickStyle) => void;
    onRemove: (blockId: string) => void;
}

type InlineEditTarget =
    | {
          kind: 'text';
          element: HTMLElement;
          buttonStyle: CSSProperties;
          outlineStyle: CSSProperties;
      }
    | {
          kind: 'link';
          link: HTMLAnchorElement;
          element: HTMLAnchorElement;
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
            left: clamp(left + targetRect.width - 40, 4, rect.width - 40),
            top: clamp(top + 4, 4, rect.height - 40),
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

const getEditableLinkElement = (root: HTMLElement, target: Element) => {
    const link = target instanceof HTMLAnchorElement ? target : target.closest('a');

    if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) return null;

    return link;
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

    const link = getEditableLinkElement(root, target);
    if (link) {
        return {
            kind: 'link',
            link,
            element: link,
            ...getTargetStyles(root, link),
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

export const HtmlBlockItem: FC<HtmlBlockItemProps> = ({
    block,
    index,
    isDragged,
    dropTarget,
    onBeginDrag,
    onCommitContent,
    onCssChange,
    onQuickStyleChange,
    onRemove,
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const number = index + 1;
    const isDropBefore = dropTarget?.id === block.id && dropTarget.placement === 'before';
    const isDropAfter = dropTarget?.id === block.id && dropTarget.placement === 'after';

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

    const clearInlineEditTarget = () => setInlineEditTarget(null);

    const openInlineEditTarget = (target: InlineEditTarget) => {
        const root = contentRef.current;
        if (!root) return false;

        if (target.kind === 'text') {
            const textNode = getTextNodes(target.element)[0];
            if (!textNode) return false;

            openInlineTextEditor({
                root,
                textNode,
                onCommit: (html) => onCommitContent(block.id, html),
            });
        } else if (target.kind === 'link') {
            openInlineLinkEditor({
                root,
                link: target.link,
                onCommit: (html) => onCommitContent(block.id, html),
            });
        } else {
            openInlineImageSrcEditor({
                root,
                image: target.image,
                onCommit: (html) => onCommitContent(block.id, html),
            });
        }

        setInlineEditTarget(null);

        return true;
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!inlineEditTarget) return;

        openInlineEditTarget(inlineEditTarget);
    };

    const handleContentClick = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        const target = event.target;
        if (!root || !(target instanceof Element) || target.closest(inlineEditButtonSelector)) {
            return;
        }

        const link = getEditableLinkElement(root, target);
        if (!link || target.closest('img')) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget({
            kind: 'link',
            link,
            element: link,
            ...getTargetStyles(root, link),
        });
    };

    const handleContentDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        const root = contentRef.current;
        if (!root) return;

        const target = getInlineEditTarget(root, event.target);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const handleContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const root = contentRef.current;
        if (
            !root ||
            !(event.target instanceof Element) ||
            event.target.closest(inlineEditButtonSelector)
        ) {
            return;
        }

        const target = getInlineEditTarget(root, event.target) ?? inlineEditTarget;
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    return (
        <div
            className={`${b('item', {
                dragged: isDragged,
                'drop-before': isDropBefore,
                'drop-after': isDropAfter,
            })} ${stop} ${htmlConstructorBlockClass} ${blockClass(index)}`}
            style={htmlConstructorQuickStyleToReactStyle(block.quickStyle)}
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
            <FloatingToolbar
                settings={block.settings}
                quickStyle={block.quickStyle}
                onQuickStyleChange={(quickStyle) => onQuickStyleChange(block.id, quickStyle)}
                onOpenSettings={() => setSettingsOpen((open) => !open)}
                onRemove={() => {
                    setSettingsOpen(false);
                    onRemove(block.id);
                }}
                codeLabel={i18n('block_css', {index: String(number)})}
                removeLabel={i18n('remove_block')}
                expandedContentView="editor"
                expandedContent={
                    settingsOpen && (
                        <BlockSettingsPanel
                            html={block.content}
                            css={block.css}
                            onHtmlCommit={(value) => onCommitContent(block.id, value)}
                            onCssChange={(value) => onCssChange(block.id, value)}
                        />
                    )
                }
            />
            <div
                className={`${b('item-content')} ${stop}`}
                contentEditable={false}
                suppressContentEditableWarning
                role="button"
                tabIndex={0}
                onClick={handleContentClick}
                onKeyDown={handleContentKeyDown}
                onMouseMove={handleContentMouseMove}
                onMouseOut={handleContentMouseOut}
                onBlur={clearInlineEditTarget}
                onMouseLeave={clearInlineEditTarget}
                onDoubleClick={handleContentDoubleClick}
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
                        <button
                            type="button"
                            className={`${b('inline-edit-button')} ${stop}`}
                            style={inlineEditTarget.buttonStyle}
                            onClick={handleOpenInlineEdit}
                            aria-label={
                                inlineEditTarget.kind === 'image'
                                    ? i18n('edit_image_src')
                                    : inlineEditTarget.kind === 'link'
                                      ? i18n('edit_link')
                                      : i18n('edit_text')
                            }
                        >
                            <Icon data={Pencil} size={18} className={stop} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
