import {useState} from 'react';
import type {FC} from 'react';

import {Button} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import type {TemplatePickerPanelProps} from './TemplatePicker';
import {cnYfmHtmlConstructor as b, STOP_EVENT_CLASSNAME as stop} from './const';

export const CustomTemplateEditor: FC<{
    htmlPlaceholder?: string;
    cssPlaceholder?: string;
    onApply: NonNullable<TemplatePickerPanelProps['onApplyCustom']>;
    onCancel: () => void;
}> = ({htmlPlaceholder, cssPlaceholder, onApply, onCancel}) => {
    const [customHtml, setCustomHtml] = useState('');
    const [customCss, setCustomCss] = useState('');
    const [applying, setApplying] = useState(false);

    const applyCustom = async () => {
        if (applying) return;

        setApplying(true);
        try {
            const applied = await onApply({
                content: customHtml.trim(),
                css: customCss.trim(),
            });
            if (applied !== false) {
                setCustomHtml('');
                setCustomCss('');
            }
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className={b('structures-import')}>
            <div className={b('structures-import-fields')}>
                <div className={b('structures-custom-field')}>
                    <div className={b('structures-custom-label')}>{i18n('html')}</div>
                    <TextArea
                        controlProps={{className: stop, 'aria-label': i18n('html')}}
                        value={customHtml}
                        onUpdate={setCustomHtml}
                        placeholder={htmlPlaceholder}
                        minRows={6}
                        disabled={applying}
                        autoFocus
                    />
                </div>
                <div className={b('structures-custom-field')}>
                    <div className={b('structures-custom-label')}>{i18n('css')}</div>
                    <TextArea
                        controlProps={{className: stop, 'aria-label': i18n('css')}}
                        value={customCss}
                        onUpdate={setCustomCss}
                        placeholder={cssPlaceholder}
                        minRows={6}
                        disabled={applying}
                    />
                </div>
            </div>
            <div className={b('structures-import-actions')}>
                <Button
                    view="flat"
                    size="l"
                    className={stop}
                    onClick={onCancel}
                    disabled={applying}
                >
                    {i18n('cancel')}
                </Button>
                <Button
                    view="action"
                    size="l"
                    className={stop}
                    disabled={!customHtml.trim() && !customCss.trim()}
                    loading={applying}
                    onClick={applyCustom}
                >
                    {i18n('insert')}
                </Button>
            </div>
        </div>
    );
};
