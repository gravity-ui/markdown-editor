import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {FC} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Switch} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import type {CodeChange} from '../document';
import {useHtmlConstructorPreference} from '../preferences';

import {CodeEditorPane, type CodeFrame} from './CodeEditorPane';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

interface CodeSettingsPanelProps {
    html: string;
    css: string;
    onCommit: (change: CodeChange) => void;
    htmlPlaceholder?: string;
    cssPlaceholder?: string;
    htmlFrame?: CodeFrame;
    cssFrame?: CodeFrame;
    onClose?: () => void;
}

export const CodeSettingsPanel: FC<CodeSettingsPanelProps> = ({
    html,
    css,
    onCommit,
    htmlPlaceholder = i18n('block_html_placeholder'),
    cssPlaceholder = '& {\n  padding: 16px;\n}',
    htmlFrame,
    cssFrame,
    onClose,
}) => {
    const [draftHtml, setDraftHtml] = useState(html);
    const [draftCss, setDraftCss] = useState(css);
    const pending = useRef<CodeChange>({});
    const commitRef = useRef(onCommit);
    commitRef.current = onCommit;
    const [compact, setCompact] = useHtmlConstructorPreference('compactCodeView');
    const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');

    useEffect(() => {
        if (pending.current.html === undefined) setDraftHtml(html);
    }, [html]);
    useEffect(() => {
        if (pending.current.css === undefined) setDraftCss(css);
    }, [css]);

    const commit = () => {
        const change = pending.current;
        if (!Object.keys(change).length) return;
        pending.current = {};
        commitRef.current(change);
    };

    // Dismissal may remove the focused textarea before the browser fires blur.
    useLayoutEffect(() => () => commit(), []);

    return (
        <div className={b('code-editor', {compact}, [stop])}>
            <div className={b('code-editor-header', [stop])}>
                <div
                    className={b('code-tabs', [stop])}
                    role="group"
                    aria-label={i18n('structure_settings')}
                >
                    {compact &&
                        (['html', 'css'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                aria-pressed={activeTab === tab}
                                className={b('code-tab', {active: activeTab === tab}, [stop])}
                                onClick={() => setActiveTab(tab)}
                            >
                                {i18n(tab)}
                            </button>
                        ))}
                </div>
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
                <div
                    hidden={compact && activeTab !== 'html'}
                    style={{display: compact && activeTab !== 'html' ? 'none' : 'contents'}}
                >
                    <CodeEditorPane
                        label={i18n('html')}
                        value={draftHtml}
                        placeholder={htmlPlaceholder}
                        showLabel={!compact}
                        onUpdate={(value) => {
                            pending.current.html = value;
                            setDraftHtml(value);
                        }}
                        onCommit={commit}
                        frame={htmlFrame}
                    />
                </div>
                <div
                    hidden={compact && activeTab !== 'css'}
                    style={{display: compact && activeTab !== 'css' ? 'none' : 'contents'}}
                >
                    <CodeEditorPane
                        label={i18n('css')}
                        value={draftCss}
                        placeholder={cssPlaceholder}
                        showLabel={!compact}
                        onUpdate={(value) => {
                            pending.current.css = value;
                            setDraftCss(value);
                        }}
                        onCommit={commit}
                        frame={cssFrame}
                    />
                </div>
            </div>
        </div>
    );
};
