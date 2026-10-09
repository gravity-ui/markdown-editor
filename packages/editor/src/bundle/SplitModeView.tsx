import {forwardRef, useEffect, useImperativeHandle, useMemo, useReducer, useRef} from 'react';

import {Eye} from '@gravity-ui/icons';
import {Label} from '@gravity-ui/uikit';

import {cn} from '../classname';
import {i18n} from '../i18n/bundle';
import {throttle} from '../lodash';
import {
    type CodeLineElement,
    getEditorLineNumberForOffset,
    scrollToRevealSourceLine,
} from '../utils/sync-scroll';

import type {EditorInt} from './Editor';

const b = cn('markup-preview');

export type SplitModeProps = {
    editor: EditorInt;
};

const SplitModeView = forwardRef<HTMLDivElement, SplitModeProps>(({editor}, ref) => {
    const cm = editor.cm;

    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const outerRef = useRef<HTMLDivElement>(null);
    const lineElements = useRef<CodeLineElement[]>([]);

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
            throttle(() => {
                if (!outerRef.current) return;
                if (!cm.dom.matches(':hover')) return;

                const {range} = cm.scrollSnapshot().value;
                const line = cm.state.doc.lineAt(range.from).number - 1;

                updateLineElements();
                scrollToRevealSourceLine(line, lineElements.current, outerRef);
            }, 30),
        [cm],
    );

    const handlePreviewScroll = useMemo(
        () =>
            throttle(() => {
                if (!outerRef.current) return;
                if (!outerRef.current.matches(':hover')) return;

                updateLineElements();
                let lineNumber = getEditorLineNumberForOffset(
                    outerRef.current.scrollTop,
                    lineElements.current,
                    outerRef,
                );

                if (lineNumber === null || isNaN(lineNumber)) return;
                lineNumber = Math.max(Math.floor(lineNumber), 0) + 1;

                const line = cm.state.doc.line(lineNumber);
                const {top} = cm.lineBlockAt(line.from);
                cm.scrollDOM.scrollTo({top});
            }, 30),
        [cm],
    );

    useEffect(() => {
        const outer = outerRef.current;

        editor.on('change', forceUpdate);
        editor.on('cm-scroll', handleEditorScroll);

        outer?.addEventListener('scroll', handlePreviewScroll);

        editor.cm.requestMeasure();

        return () => {
            editor.off('change', forceUpdate);
            editor.off('cm-scroll', handleEditorScroll);
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
            {editor.renderPreview?.({
                getValue: editor.getValue,
                mode: 'split',
                md: editor.mdOptions,
                directiveSyntax: editor.directiveSyntax,
            })}
        </div>
    );
});
SplitModeView.displayName = 'SplitModeView';
export {SplitModeView};
