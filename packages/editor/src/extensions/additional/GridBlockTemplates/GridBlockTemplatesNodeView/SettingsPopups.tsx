import {useEffect, useState} from 'react';

import {Popup} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/grid-block-templates';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface HtmlCssSettingsPopupProps {
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    html: string;
    css: string;
    onHtmlCommit: (value: string) => void;
    onCssChange: (value: string) => void;
    htmlPlaceholder: string;
    cssPlaceholder: string;
}

const HtmlCssSettingsPopup: React.FC<HtmlCssSettingsPopupProps> = ({
    anchor,
    open,
    onClose,
    html,
    css,
    onHtmlCommit,
    onCssChange,
    htmlPlaceholder,
    cssPlaceholder,
}) => {
    const [draftHtml, setDraftHtml] = useState(html);
    const [draftCss, setDraftCss] = useState(css);

    useEffect(() => {
        setDraftHtml(html);
        setDraftCss(css);
    }, [css, html, open]);

    const handleHtmlUpdate = (value: string) => {
        setDraftHtml(value);
        onHtmlCommit(value);
    };

    const commitHtml = () => {
        onHtmlCommit(draftHtml);
    };

    const handleCssUpdate = (value: string) => {
        setDraftCss(value);
        onCssChange(value);
    };

    const commitCss = () => {
        onCssChange(draftCss);
    };

    return (
        <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
            <div className={b('settings-editor', [stop])}>
                <div className={b('field')}>
                    <div className={b('field-label')}>{i18n('html')}</div>
                    <TextArea
                        controlProps={{className: stop, onBlur: commitHtml}}
                        value={draftHtml}
                        onUpdate={handleHtmlUpdate}
                        placeholder={htmlPlaceholder}
                        minRows={8}
                        autoFocus
                    />
                </div>
                <div className={b('field')}>
                    <div className={b('field-label')}>{i18n('css')}</div>
                    <TextArea
                        controlProps={{className: stop, onBlur: commitCss}}
                        value={draftCss}
                        onUpdate={handleCssUpdate}
                        placeholder={cssPlaceholder}
                        minRows={8}
                    />
                </div>
            </div>
        </Popup>
    );
};

export const BlockSettingsPopup: React.FC<{
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

export const ContainerSettingsPopup: React.FC<{
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
        htmlPlaceholder={'<div class="grid">\n  <div>Block HTML</div>\n</div>'}
        cssPlaceholder={
            '.grid {\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.block-1 {\n  background: #eee;\n}'
        }
    />
);
