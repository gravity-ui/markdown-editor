import {useCallback, useLayoutEffect, useState} from 'react';
import type {CSSProperties, KeyboardEvent} from 'react';

import {Button, Portal} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-block';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock as b} from './const';
import type {ElementSource} from './sourceEditing';

export const ElementSourceEditor: React.FC<{
    source: ElementSource;
    target: Element;
    anchor: CSSProperties;
    block: HTMLDivElement;
    overlay: boolean;
    onCommit: (html: string) => void;
    onClose: () => void;
}> = ({source, target, anchor, block, overlay, onCommit, onClose}) => {
    const [panelHeight, setPanelHeight] = useState(0);
    const [value, setValue] = useState(source.html);
    const [panel, setPanel] = useState<HTMLDivElement | null>(null);
    const dirty = value !== source.html;
    const blockRect = block.getBoundingClientRect();
    const availableWidth = overlay
        ? window.innerWidth - 16
        : window.innerWidth - Math.max(0, blockRect.left) - 8;
    const width = Math.min(Math.max(Number(anchor.width), 360), block.clientWidth, availableWidth);
    const left = Math.max(
        0,
        Math.min(Number(anchor.left), Math.min(block.clientWidth, availableWidth) - width),
    );
    const style: CSSProperties = overlay
        ? {
              left: Math.max(8, Math.min(blockRect.left + left, window.innerWidth - width - 8)),
              top: Math.max(
                  8,
                  Math.min(
                      blockRect.top + Number(anchor.top),
                      window.innerHeight - panelHeight - 8,
                  ),
              ),
              width,
          }
        : {left, top: anchor.top, width};

    useLayoutEffect(() => {
        if (!overlay || !panel) return undefined;
        const resize = () => setPanelHeight(panel.getBoundingClientRect().height);
        const observer = new ResizeObserver(resize);
        observer.observe(panel);
        resize();
        return () => observer.disconnect();
    }, [overlay, panel]);

    const focusInput = useCallback(
        (input: HTMLTextAreaElement | null) => {
            input?.focus({preventScroll: true});
            input?.setSelectionRange(source.offset, source.offset);
        },
        [source],
    );

    useLayoutEffect(() => {
        if (overlay || !panel) return undefined;
        const originalStyle = target.getAttribute('style');
        const element = target as HTMLElement;
        const display = target.ownerDocument.defaultView?.getComputedStyle(target).display;
        element.style.setProperty('visibility', 'hidden', 'important');
        if (display === 'inline') element.style.setProperty('display', 'inline-block', 'important');
        element.style.setProperty('box-sizing', 'border-box', 'important');
        element.style.setProperty('width', `${width}px`, 'important');
        const resize = () => {
            element.style.setProperty(
                'height',
                `${panel.getBoundingClientRect().height}px`,
                'important',
            );
        };
        const observer = new ResizeObserver(resize);
        observer.observe(panel);
        resize();
        return () => {
            observer.disconnect();
            if (originalStyle === null) target.removeAttribute('style');
            else target.setAttribute('style', originalStyle);
        };
    }, [overlay, panel, target, width]);

    const commit = () => {
        onCommit(source.replace(value));
        onClose();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            event.stopPropagation();
            commit();
        }
    };

    const editor = (
        <div
            ref={setPanel}
            className={`${b('element-source', {overlay})} ${STOP_EVENT_CLASSNAME}`}
            style={style}
            role="dialog"
            aria-label={`${i18n('edit_element')} <${target.tagName.toLowerCase()}>`}
        >
            <div className={b('inline-edit-title')}>
                HTML <code>{`<${target.tagName.toLowerCase()}>`}</code>
            </div>
            <textarea
                ref={focusInput}
                className={b('element-source-input')}
                aria-label="HTML"
                value={value}
                rows={Math.min(12, Math.max(4, value.split('\n').length))}
                spellCheck={false}
                onKeyDown={onKeyDown}
                onChange={(event) => setValue(event.target.value)}
            />
            <div className={b('inline-edit-actions')}>
                <Button view="flat" onClick={onClose} onKeyDown={onKeyDown}>
                    {i18n('cancel')}
                </Button>
                <Button view="action" disabled={!dirty} onClick={commit} onKeyDown={onKeyDown}>
                    {i18n('save')}
                </Button>
            </div>
        </div>
    );

    return overlay ? <Portal>{editor}</Portal> : editor;
};
