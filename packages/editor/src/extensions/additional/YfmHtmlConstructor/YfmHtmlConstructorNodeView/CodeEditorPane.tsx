import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {FC, UIEvent} from 'react';

import {cnYfmHtmlConstructor as b, STOP_EVENT_CLASSNAME as stop} from './const';

// Kept in sync with `&__code-gutter` line-height and vertical padding in the
// stylesheet; used to count how many line numbers fill the visible body.
const GUTTER_LINE_HEIGHT = 20;
const GUTTER_PADDING_Y = 24;

/** Non-editable wrapper lines shown around editable HTML (the spec block markup). */
export interface CodeFrame {
    top: string;
    bottom: string;
}

interface CodeEditorPaneProps {
    label: string;
    value: string;
    placeholder: string;
    showLabel: boolean;
    onUpdate: (value: string) => void;
    onCommit: () => void;
    /** When set, renders read-only wrapper lines around the editable content. */
    frame?: CodeFrame;
}

export const CodeEditorPane: FC<CodeEditorPaneProps> = ({
    label,
    value,
    placeholder,
    showLabel,
    onUpdate,
    onCommit,
    frame,
}) => {
    const gutterRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [visibleRows, setVisibleRows] = useState(0);

    useLayoutEffect(() => {
        const node = bodyRef.current;
        if (!node) return undefined;

        const measure = () => {
            const available = node.clientHeight - GUTTER_PADDING_Y;
            setVisibleRows(Math.max(0, Math.floor(available / GUTTER_LINE_HEIGHT)));
        };
        measure();

        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const contentLines = value ? value.split('\n').length : 1;
    const frameTopLines = frame?.top ? frame.top.split('\n').length : 0;
    const frameBottomLines = frame?.bottom ? frame.bottom.split('\n').length : 0;

    const lineNumbers = useMemo(() => {
        const contentTotal = contentLines + frameTopLines + frameBottomLines;
        const total = Math.max(contentTotal, visibleRows);
        let result = '';
        for (let line = 1; line <= total; line++) {
            result += line === 1 ? '1' : `\n${line}`;
        }
        return result;
    }, [contentLines, frameTopLines, frameBottomLines, visibleRows]);

    const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    };

    const control = (
        <textarea
            rows={frame ? contentLines : undefined}
            className={`${b('code-input', {framed: Boolean(frame)})} ${stop}`}
            value={value}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            placeholder={placeholder}
            aria-label={label}
            onChange={(event) => onUpdate(event.target.value)}
            onBlur={onCommit}
            onScroll={frame ? undefined : syncScroll}
        />
    );

    return (
        <div className={b('code', [stop])}>
            {showLabel && <div className={b('code-label', [stop])}>{label}</div>}
            <div ref={bodyRef} className={b('code-body', {framed: Boolean(frame)}, [stop])}>
                <div
                    ref={gutterRef}
                    className={b('code-gutter', {framed: Boolean(frame)}, [stop])}
                    aria-hidden="true"
                >
                    {lineNumbers}
                </div>
                {frame ? (
                    <div className={b('code-stack', [stop])}>
                        {frame.top && (
                            <div
                                className={b('code-frame', {top: true}, [stop])}
                                aria-hidden="true"
                            >
                                {frame.top}
                            </div>
                        )}
                        {control}
                        {frame.bottom && (
                            <div
                                className={b('code-frame', {bottom: true}, [stop])}
                                aria-hidden="true"
                            >
                                {frame.bottom}
                            </div>
                        )}
                    </div>
                ) : (
                    control
                )}
            </div>
        </div>
    );
};
