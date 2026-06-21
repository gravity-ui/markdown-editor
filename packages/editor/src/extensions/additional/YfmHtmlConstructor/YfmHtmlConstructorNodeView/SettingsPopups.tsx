import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {FC, UIEvent} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, Switch} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {useHtmlConstructorPreference} from '../preferences';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

// Kept in sync with `&__code-gutter` line-height and vertical padding in the
// stylesheet; used to count how many line numbers fill the visible body.
const GUTTER_LINE_HEIGHT = 20;
const GUTTER_PADDING_Y = 24;

type CodeKind = 'html' | 'css';

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
    autoFocus: boolean;
    onUpdate: (value: string) => void;
    onCommit: () => void;
    /** When set, renders read-only wrapper lines around the editable content. */
    frame?: CodeFrame;
}

const CodeEditorPane: FC<CodeEditorPaneProps> = ({
    label,
    value,
    placeholder,
    showLabel,
    autoFocus,
    onUpdate,
    onCommit,
    frame,
}) => {
    const gutterRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<HTMLTextAreaElement>(null);
    const [visibleRows, setVisibleRows] = useState(0);

    useEffect(() => {
        if (!autoFocus) return undefined;

        const timer = setTimeout(() => controlRef.current?.focus(), 30);
        return () => clearTimeout(timer);
    }, [autoFocus]);

    // Track how many gutter rows fit in the visible body so the line numbers can
    // keep going past the last line instead of dead-ending into empty space.
    useLayoutEffect(() => {
        const node = bodyRef.current;
        if (!node) return undefined;

        const measure = () => {
            const available = node.clientHeight - GUTTER_PADDING_Y;
            setVisibleRows(Math.max(0, Math.floor(available / GUTTER_LINE_HEIGHT)));
        };
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const contentLines = value ? value.split('\n').length : 1;

    // In framed mode the wrapper lines and content share one scroll area, so the
    // textarea must grow to fit its content instead of scrolling on its own.
    useLayoutEffect(() => {
        if (!frame) return;
        const node = controlRef.current;
        if (!node) return;
        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
    }, [frame, value]);

    const lineNumbers = useMemo(() => {
        const contentTotal = frame ? contentLines + 2 : contentLines;
        const total = Math.max(contentTotal, visibleRows);
        let result = '';
        for (let line = 1; line <= total; line++) {
            result += line === 1 ? '1' : `\n${line}`;
        }
        return result;
    }, [frame, contentLines, visibleRows]);

    const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    };

    const control = (
        <textarea
            ref={controlRef}
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
                        <div className={b('code-frame', {top: true}, [stop])} aria-hidden="true">
                            {frame.top}
                        </div>
                        {control}
                        <div className={b('code-frame', {bottom: true}, [stop])} aria-hidden="true">
                            {frame.bottom}
                        </div>
                    </div>
                ) : (
                    control
                )}
            </div>
        </div>
    );
};

interface HtmlCssSettingsPanelProps {
    html: string;
    css: string;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
    htmlPlaceholder: string;
    cssPlaceholder: string;
    htmlFrame?: CodeFrame;
    /**
     * When false, edits are committed only on blur instead of on every keystroke.
     * Used by the structure editor, whose committed value is re-assembled (and thus
     * differs from the raw input), so live commits would fight the typing cursor.
     */
    liveUpdate?: boolean;
    onClose?: () => void;
}

const HtmlCssSettingsPanel: FC<HtmlCssSettingsPanelProps> = ({
    html,
    css,
    onHtmlCommit,
    onCssChange,
    htmlPlaceholder,
    cssPlaceholder,
    htmlFrame,
    liveUpdate = true,
    onClose,
}) => {
    const [draftHtml, setDraftHtml] = useState(html);
    const [draftCss, setDraftCss] = useState(css);
    const [compact, setCompact] = useHtmlConstructorPreference('compactCodeView');
    const [activeTab, setActiveTab] = useState<CodeKind>('html');

    useEffect(() => {
        setDraftHtml(html);
        setDraftCss(css);
    }, [css, html]);

    const handleHtmlUpdate = (value: string) => {
        setDraftHtml(value);
        if (liveUpdate) onHtmlCommit(value);
    };

    const commitHtml = () => {
        if (draftHtml !== html) onHtmlCommit(draftHtml);
    };

    const handleCssUpdate = (value: string) => {
        setDraftCss(value);
        if (liveUpdate) onCssChange(value);
    };

    const commitCss = () => {
        if (draftCss !== css) onCssChange(draftCss);
    };

    const htmlPane = (
        <CodeEditorPane
            key="html"
            label={i18n('html')}
            value={draftHtml}
            placeholder={htmlPlaceholder}
            showLabel={!compact}
            autoFocus={compact ? activeTab === 'html' : true}
            onUpdate={handleHtmlUpdate}
            onCommit={commitHtml}
            frame={htmlFrame}
        />
    );

    const cssPane = (
        <CodeEditorPane
            key="css"
            label={i18n('css')}
            value={draftCss}
            placeholder={cssPlaceholder}
            showLabel={!compact}
            autoFocus={compact && activeTab === 'css'}
            onUpdate={handleCssUpdate}
            onCommit={commitCss}
        />
    );

    return (
        <div className={b('code-editor', {compact}, [stop])}>
            <div className={b('code-editor-header', [stop])}>
                {compact ? (
                    <div className={b('code-tabs', [stop])} role="tablist">
                        {(['html', 'css'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                className={b('code-tab', {active: activeTab === tab}, [stop])}
                                onClick={() => setActiveTab(tab)}
                            >
                                {i18n(tab)}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className={b('code-tabs', [stop])} />
                )}
                <div className={b('code-editor-actions', [stop])}>
                    <Switch
                        size="m"
                        className={stop}
                        checked={compact}
                        onUpdate={setCompact}
                        content={i18n('compact_view')}
                    />
                    {onClose && (
                        <Button
                            view="flat"
                            size="l"
                            className={stop}
                            onClick={onClose}
                            aria-label={i18n('close')}
                        >
                            <Icon data={Xmark} size={18} className={stop} />
                        </Button>
                    )}
                </div>
            </div>
            <div className={b('code-editor-body', [stop])}>
                {compact ? (activeTab === 'html' ? htmlPane : cssPane) : [htmlPane, cssPane]}
            </div>
        </div>
    );
};

export const BlockSettingsPanel: FC<{
    html: string;
    css: string;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
    htmlFrame?: CodeFrame;
    onClose?: () => void;
}> = (props) => (
    <HtmlCssSettingsPanel
        {...props}
        htmlPlaceholder={i18n('block_html_placeholder')}
        cssPlaceholder={'& {\n  padding: 16px;\n  border-radius: 8px;\n}\nh3 {\n  margin: 0;\n}'}
    />
);

export const StructureSettingsPanel: FC<{
    html: string;
    css: string;
    htmlFrame?: CodeFrame;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
    onClose?: () => void;
}> = (props) => (
    <HtmlCssSettingsPanel
        {...props}
        liveUpdate={false}
        htmlPlaceholder={'<section>\n  <h2>Structure intro</h2>\n</section>'}
        cssPlaceholder={
            '.g-md-hc-structure {\n  display: grid;\n  gap: 16px;\n}\n& {\n  padding: 24px;\n}'
        }
    />
);

interface HtmlCssSettingsPopupProps extends HtmlCssSettingsPanelProps {
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
}

const HtmlCssSettingsPopup: FC<HtmlCssSettingsPopupProps> = ({anchor, open, onClose, ...props}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <HtmlCssSettingsPanel {...props} onClose={onClose} />
    </Popup>
);

export const BlockSettingsPopup: FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    html: string;
    css: string;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
}> = (props) => (
    <HtmlCssSettingsPopup
        {...props}
        htmlPlaceholder={i18n('block_html_placeholder')}
        cssPlaceholder={'& {\n  padding: 16px;\n  border-radius: 8px;\n}\nh3 {\n  margin: 0;\n}'}
    />
);

export const StructureSettingsPopup: FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    html: string;
    css: string;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
}> = (props) => (
    <HtmlCssSettingsPopup
        {...props}
        htmlPlaceholder={'<section>\n  <h2>Structure intro</h2>\n</section>'}
        cssPlaceholder={
            '.g-md-hc-structure {\n  display: grid;\n  gap: 16px;\n}\n& {\n  padding: 24px;\n}'
        }
    />
);
