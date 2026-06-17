import {useMemo, useState} from 'react';

import {Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/grid-block-templates';

import {clearStoredTemplates, parseTemplates, saveTemplates} from '../templates';
import type {GridBlockTemplate} from '../types';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

import './TemplatesPopup.scss';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface TemplatesPopupProps<TTemplate extends GridBlockTemplate> {
    anchor: HTMLElement | null;
    open: boolean;
    templates: TTemplate[];
    allowAdd: boolean;
    emptyText: string;
    onClose: () => void;
    onApply: (template: TTemplate) => void;
    onAdded: (templates: GridBlockTemplate[]) => void;
    onCleared: (templates: GridBlockTemplate[]) => void;
}

export function TemplatesPopup<TTemplate extends GridBlockTemplate>({
    anchor,
    open,
    templates,
    allowAdd,
    emptyText,
    onClose,
    onApply,
    onAdded,
    onCleared,
}: TemplatesPopupProps<TTemplate>) {
    const [adding, setAdding] = useState(false);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('');

    const filtered = useMemo(() => {
        const query = filter.trim().toLowerCase();
        if (!query) return templates;
        return templates.filter((template) => template.title.toLowerCase().includes(query));
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

    const handleClear = () => {
        onCleared(clearStoredTemplates());
        setFilter('');
    };

    return (
        <Popup anchorElement={anchor} open={open} onOpenChange={close} placement="bottom-end">
            <div className={b('templates', [stop])}>
                {adding ? (
                    <div className={b('templates-editor')}>
                        <TextArea
                            controlProps={{className: stop}}
                            value={input}
                            onUpdate={setInput}
                            placeholder={i18n('templates_input_placeholder')}
                            minRows={8}
                            autoFocus
                        />
                        <div className={b('templates-controls')}>
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
                            <div className={b('templates-search')}>
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
                        <div className={b('templates-list', [stop])}>
                            <Menu className={stop}>
                                {allowAdd && (
                                    <>
                                        <Menu.Item
                                            className={stop}
                                            iconStart={<Icon data={Plus} />}
                                            onClick={() => setAdding(true)}
                                        >
                                            {i18n('add_template')}
                                        </Menu.Item>
                                        <Menu.Item
                                            className={stop}
                                            iconStart={<Icon data={TrashBin} />}
                                            onClick={handleClear}
                                        >
                                            {i18n('clear_templates')}
                                        </Menu.Item>
                                    </>
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
                                        {emptyText}
                                    </Menu.Item>
                                )}
                            </Menu>
                        </div>
                    </>
                )}
            </div>
        </Popup>
    );
}
