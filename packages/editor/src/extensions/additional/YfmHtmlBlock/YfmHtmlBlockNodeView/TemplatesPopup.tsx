import {useMemo, useState} from 'react';

import {Plus} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, TextInput} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-block';

import {type HtmlTemplate, parseTemplates, saveTemplates} from '../templates';

import {STOP_EVENT_CLASSNAME} from './const';

import './TemplatesPopup.scss';

const b = cn('yfm-html-block-templates');
const stop = STOP_EVENT_CLASSNAME;

interface TemplatesPopupProps {
    anchor: HTMLElement | null;
    open: boolean;
    templates: HtmlTemplate[];
    allowAdd: boolean;
    onClose: () => void;
    onApply: (template: HtmlTemplate) => void;
    onAdded: (templates: HtmlTemplate[]) => void;
}

export const TemplatesPopup: React.FC<TemplatesPopupProps> = ({
    anchor,
    open,
    templates,
    allowAdd,
    onClose,
    onApply,
    onAdded,
}) => {
    const [adding, setAdding] = useState(false);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('');

    const filtered = useMemo(() => {
        const query = filter.trim().toLowerCase();
        if (!query) return templates;
        return templates.filter((t) => t.title.toLowerCase().includes(query));
    }, [templates, filter]);

    const close = () => {
        setAdding(false);
        setInput('');
        setFilter('');
        onClose();
    };

    const handleSave = () => {
        const parsed = parseTemplates(input);
        if (parsed.length) onAdded(saveTemplates(parsed));
        setInput('');
        setAdding(false);
    };

    return (
        <Popup anchorElement={anchor} open={open} onOpenChange={close} placement="bottom-end">
            <div className={b(null, [stop])}>
                {adding ? (
                    <div className={b('editor')}>
                        <TextArea
                            controlProps={{className: stop}}
                            value={input}
                            onUpdate={setInput}
                            placeholder={i18n('templates_input_placeholder')}
                            minRows={6}
                            autoFocus
                        />
                        <div className={b('controls')}>
                            <Button view="flat" className={stop} onClick={() => setAdding(false)}>
                                <span className={stop}>{i18n('cancel')}</span>
                            </Button>
                            <Button
                                view="action"
                                className={stop}
                                disabled={!input.trim()}
                                onClick={handleSave}
                            >
                                <span className={stop}>{i18n('save')}</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {templates.length > 0 && (
                            <div className={b('search')}>
                                <TextInput
                                    className={stop}
                                    controlProps={{className: stop}}
                                    size="s"
                                    value={filter}
                                    onUpdate={setFilter}
                                    placeholder={i18n('search_templates')}
                                    autoFocus
                                />
                            </div>
                        )}
                        <Menu className={stop}>
                            {allowAdd && (
                                <Menu.Item
                                    className={stop}
                                    iconStart={<Icon data={Plus} />}
                                    onClick={() => setAdding(true)}
                                >
                                    {i18n('add_template')}
                                </Menu.Item>
                            )}
                            {filtered.map((template) => (
                                <Menu.Item
                                    key={template.id}
                                    className={stop}
                                    onClick={() => {
                                        onApply(template);
                                        close();
                                    }}
                                >
                                    {template.title}
                                </Menu.Item>
                            ))}
                            {filtered.length === 0 && (
                                <Menu.Item disabled className={stop}>
                                    {i18n('templates_empty')}
                                </Menu.Item>
                            )}
                        </Menu>
                    </>
                )}
            </div>
        </Popup>
    );
};
