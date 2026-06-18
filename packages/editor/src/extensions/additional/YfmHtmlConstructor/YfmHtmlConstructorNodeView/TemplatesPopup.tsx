import {useMemo, useState} from 'react';

import {FilePlus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {
    HtmlConstructorTemplateParseError,
    clearStoredTemplates,
    parseTemplates,
    saveTemplates,
} from '../templates';
import type {
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {StructureTemplatesMenuItems} from './GroupedTemplatesMenuItems';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {buildStructureMenuGroups} from './groupTemplates';

import './TemplatesPopup.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

interface TemplatesPopupProps {
    anchor: HTMLElement | null;
    open: boolean;
    templates: HtmlConstructorTemplate[];
    allowAdd: boolean;
    emptyText: string;
    hasStoredTemplates: boolean;
    onClose: () => void;
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
    onAdded: (templates: HtmlConstructorTemplate[]) => void;
    onCleared: (templates: HtmlConstructorTemplate[]) => void;
}

export function TemplatesPopup({
    anchor,
    open,
    templates,
    allowAdd,
    emptyText,
    hasStoredTemplates,
    onClose,
    onApply,
    onAdded,
    onCleared,
}: TemplatesPopupProps) {
    const [adding, setAdding] = useState(false);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('');
    const [error, setError] = useState('');
    const groups = useMemo(() => buildStructureMenuGroups(templates, filter), [filter, templates]);

    const close = () => {
        setAdding(false);
        setInput('');
        setFilter('');
        setError('');
        onClose();
    };

    const handleSave = () => {
        try {
            const parsed = parseTemplates(input);
            if (parsed.length) onAdded(saveTemplates(parsed));
            setInput('');
            setError('');
            setAdding(false);
        } catch (err) {
            setError(
                err instanceof HtmlConstructorTemplateParseError
                    ? err.message
                    : i18n('templates_parse_error'),
            );
        }
    };

    const handleClear = () => {
        onCleared(clearStoredTemplates());
        close();
    };

    return (
        <Popup anchorElement={anchor} open={open} onOpenChange={close} placement="bottom-end">
            <div className={b('templates', [stop])}>
                {adding ? (
                    <div className={b('templates-editor')}>
                        <TextArea
                            controlProps={{className: stop}}
                            value={input}
                            onUpdate={(value) => {
                                setInput(value);
                                setError('');
                            }}
                            placeholder={i18n('templates_input_placeholder')}
                            minRows={8}
                            autoFocus
                        />
                        {error && <div className={b('templates-error')}>{error}</div>}
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
                                            iconStart={<Icon data={FilePlus} />}
                                            onClick={() => setAdding(true)}
                                        >
                                            {i18n('add_template')}
                                        </Menu.Item>
                                        <Menu.Item
                                            className={stop}
                                            disabled={!hasStoredTemplates}
                                            iconStart={<Icon data={TrashBin} />}
                                            onClick={handleClear}
                                        >
                                            {i18n('clear_templates')}
                                        </Menu.Item>
                                        <div
                                            role="separator"
                                            className={b('templates-separator', [stop])}
                                        />
                                    </>
                                )}
                                <StructureTemplatesMenuItems
                                    groups={groups}
                                    filter={filter}
                                    emptyText={emptyText}
                                    onApply={(structure, theme) => {
                                        onApply(structure, theme);
                                        close();
                                    }}
                                />
                            </Menu>
                        </div>
                    </>
                )}
            </div>
        </Popup>
    );
}
