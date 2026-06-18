import {useEffect, useState} from 'react';
import type {FC} from 'react';

import {Popup} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
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

const HtmlCssSettingsPopup: FC<HtmlCssSettingsPopupProps> = ({
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
