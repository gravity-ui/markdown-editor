import React, {useEffect, useImperativeHandle, useMemo, useReducer, useRef} from 'react';

import {Eye} from '@gravity-ui/icons';
import {Label} from '@gravity-ui/uikit';
import {Editor} from 'codemirror';

import {cn} from '../classname';
import {i18n} from '../i18n/bundle';
import {throttle} from '../lodash';
import {
    CodeLineElement,
    getEditorLineNumberForOffset,
    scrollToRevealSourceLine,
} from '../utils/sync-scroll';

import {EditorInt} from './Editor';

const b = cn('markup-preview');

export type SplitModeProps = {
    editor: EditorInt;
};

const SplitModeView = React.forwardRef<HTMLDivElement, SplitModeProps>(({editor}, ref) => {
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const outerRef = useRef<HTMLDivElement>(null);
    const lineElements = useRef<CodeLineElement[]>([]);
    const shouldScroll = useRef(true);

    const updateLineElements = () => {
        if (!outerRef.current) return;

        const els = Array.from(outerRef.current.querySelectorAll('.line'));
        lineElements.current = els
            .filter((el) => el instanceof HTMLElement && el.parentElement?.offsetHeight !== 0)
            .map((el) => ({
                el: el as HTMLElement,
                line: Number(el.getAttribute('data-line')),
            }));
    };

    const handleEditorScroll = useMemo(
        () =>
            throttle((instance: Editor) => {
                if (!outerRef.current) return;
                if (!shouldScroll.current) {
                    shouldScroll.current = true;
                    return;
                }
                shouldScroll.current = false;
                const line = instance.lineAtHeight(instance.getScrollInfo().top, 'local');
                updateLineElements();
                scrollToRevealSourceLine(
                    Math.min(line === 0 ? 0 : line + 1, instance.lineCount() - 1),
                    lineElements.current,
                    outerRef,
                );
            }, 30),
        [],
    );

    const handlePreviewScroll = useMemo(
        () =>
            throttle(() => {
                if (!outerRef.current) return;
                if (!shouldScroll.current) {
                    shouldScroll.current = true;
                    return;
                }
                shouldScroll.current = false;
                updateLineElements();
                let line = getEditorLineNumberForOffset(
                    outerRef.current.scrollTop,
                    lineElements.current,
                    outerRef,
                );
                if (line === null || isNaN(line)) return;
                line = Math.max(Math.floor(line) - 1, 0);
                const scrollTo = editor.markupEditor.cm.heightAtLine(line, 'local');
                editor.markupEditor.cm.scrollTo(null, scrollTo);
            }, 30),
        [editor.markupEditor.cm],
    );

    useEffect(() => {
        const outer = outerRef.current;

        editor.on('change', forceUpdate);

        editor.markupEditor.cm.on('scroll', handleEditorScroll);

        outer?.addEventListener('scroll', handlePreviewScroll);

        editor.markupEditor.cm.refresh();

        return () => {
            editor.off('change', forceUpdate);
            editor.markupEditor.cm.off('scroll', handleEditorScroll);
            outer?.removeEventListener('scroll', handlePreviewScroll);
        };
    }, [editor, handleEditorScroll, handlePreviewScroll]);

    useImperativeHandle(ref, () => outerRef.current as HTMLDivElement);

    return (
        <div
            className={b('outer', {
                vertical: editor.splitMode === 'vertical',
            })}
            ref={outerRef}
        >
            <Label icon={<Eye />} className={b('preview-sign')} size={'m'}>
                {i18n('split-mode-text')}
            </Label>
            {editor.renderPreview?.({getValue: editor.getValue, mode: 'split'})}
        </div>
    );
});
SplitModeView.displayName = 'SplitModeView';
export {SplitModeView};
