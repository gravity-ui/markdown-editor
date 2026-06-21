import {useEffect, useMemo, useRef, useState} from 'react';
import type {FC, UIEvent} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, Switch} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

type CodeKind = 'html' | 'css';

interface CodeEditorPaneProps {
    label: string;
    value: string;
    placeholder: string;
    showLabel: boolean;
    autoFocus: boolean;
    onUpdate: (value: string) => void;
    onCommit: () => void;
}

const CodeEditorPane: FC<CodeEditorPaneProps> = ({
    label,
    value,
    placeholder,
    showLabel,
    autoFocus,
    onUpdate,
    onCommit,
}) => {
    const gutterRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!autoFocus) return undefined;

        const timer = setTimeout(() => controlRef.current?.focus(), 30);
        return () => clearTimeout(timer);
    }, [autoFocus]);

    const lineNumbers = useMemo(() => {
        const lines = value ? value.split('\n').length : 1;
        let result = '';
        for (let line = 1; line <= lines; line++) {
            result += line === 1 ? '1' : `\n${line}`;
        }
        return result;
    }, [value]);

    const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    };

    return (
        <div className={b('code', [stop])}>
            {showLabel && <div className={b('code-label', [stop])}>{label}</div>}
            <div className={b('code-body', [stop])}>
                <div ref={gutterRef} className={b('code-gutter', [stop])} aria-hidden="true">
                    {lineNumbers}
                </div>
                <textarea
                    ref={controlRef}
                    className={`${b('code-input')} ${stop}`}
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
                    onScroll={syncScroll}
                />
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
    onClose?: () => void;
}

const HtmlCssSettingsPanel: FC<HtmlCssSettingsPanelProps> = ({
    html,
    css,
    onHtmlCommit,
    onCssChange,
    htmlPlaceholder,
    cssPlaceholder,
    onClose,
}) => {
    const [draftHtml, setDraftHtml] = useState(html);
    const [draftCss, setDraftCss] = useState(css);
    const [compact, setCompact] = useState(true);
    const [activeTab, setActiveTab] = useState<CodeKind>('html');

    useEffect(() => {
        setDraftHtml(html);
        setDraftCss(css);
    }, [css, html]);

    const handleHtmlUpdate = (value: string) => {
        setDraftHtml(value);
        onHtmlCommit(value);
    };

    const commitHtml = () => onHtmlCommit(draftHtml);

    const handleCssUpdate = (value: string) => {
        setDraftCss(value);
        onCssChange(value);
    };

    const commitCss = () => onCssChange(draftCss);

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
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
    onClose?: () => void;
}> = (props) => (
    <HtmlCssSettingsPanel
        {...props}
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
