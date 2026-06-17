import {Popup} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/grid-block-templates';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

export const BlockSettingsPopup: React.FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    html: string;
    css: string;
    onHtmlChange: (value: string) => void;
    onCssChange: (value: string) => void;
}> = ({anchor, open, onClose, html, css, onHtmlChange, onCssChange}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <div className={b('block-settings-editor', [stop])}>
            <div className={b('field')}>
                <div className={b('field-label')}>{i18n('html')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={html}
                    onUpdate={onHtmlChange}
                    placeholder={i18n('block_html_placeholder')}
                    minRows={6}
                    autoFocus
                />
            </div>
            <div className={b('field')}>
                <div className={b('field-label')}>{i18n('css')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={css}
                    onUpdate={onCssChange}
                    placeholder={
                        '& {\n  padding: 16px;\n  border-radius: 8px;\n}\nh3 {\n  margin: 0;\n}'
                    }
                    minRows={5}
                />
            </div>
        </div>
    </Popup>
);

export const ContainerCssPopup: React.FC<{
    anchor: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    css: string;
    onCssChange: (value: string) => void;
}> = ({anchor, open, onClose, css, onCssChange}) => (
    <Popup anchorElement={anchor} open={open} onOpenChange={onClose} placement="bottom-end">
        <div className={b('css-editor', [stop])}>
            <TextArea
                controlProps={{className: stop}}
                value={css}
                onUpdate={onCssChange}
                placeholder={
                    '.grid {\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n.block-1 {\n  background: #eee;\n}'
                }
                minRows={6}
                autoFocus
            />
        </div>
    </Popup>
);
