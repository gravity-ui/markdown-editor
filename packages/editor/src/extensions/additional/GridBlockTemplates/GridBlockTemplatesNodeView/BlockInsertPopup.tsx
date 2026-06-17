import {useState} from 'react';

import {Code} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/grid-block-templates';

import {parseRawBlock} from '../templates';
import type {GridBlockBlockTemplate, GridBlockTemplateBlock} from '../types';

import {GroupedTemplatesMenuItems} from './GroupedTemplatesMenuItems';
import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface BlockInsertPopupProps {
    anchor: HTMLElement | null;
    open: boolean;
    templates: GridBlockBlockTemplate[];
    onClose: () => void;
    onApplyTemplate: (template: GridBlockBlockTemplate) => void;
    onApplyHtml: (block: GridBlockTemplateBlock) => void;
}

export const BlockInsertPopup: React.FC<BlockInsertPopupProps> = ({
    anchor,
    open,
    templates,
    onClose,
    onApplyTemplate,
    onApplyHtml,
}) => {
    const [addingCustomHtml, setAddingCustomHtml] = useState(false);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('');
    const showCustomHtmlEditor = addingCustomHtml || templates.length === 0;

    const close = () => {
        setAddingCustomHtml(false);
        setInput('');
        setFilter('');
        onClose();
    };

    const handleApplyHtml = () => {
        onApplyHtml(parseRawBlock(input));
        close();
    };

    return (
        <Popup anchorElement={anchor} open={open} onOpenChange={close} placement="bottom-start">
            <div className={b('templates', [stop])}>
                {showCustomHtmlEditor ? (
                    <div className={b('templates-editor')}>
                        <TextArea
                            controlProps={{className: stop}}
                            value={input}
                            onUpdate={setInput}
                            placeholder={i18n('block_html_input_placeholder')}
                            minRows={8}
                            autoFocus
                        />
                        <div className={b('templates-controls')}>
                            <Button view="flat" className={stop} onClick={close}>
                                <span className={stop}>{i18n('cancel')}</span>
                            </Button>
                            <Button
                                view="action"
                                className={stop}
                                disabled={!input.trim()}
                                onClick={handleApplyHtml}
                            >
                                <span className={stop}>{i18n('insert')}</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
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
                        <div className={b('templates-list', [stop])}>
                            <Menu className={stop}>
                                <Menu.Item
                                    className={stop}
                                    iconStart={<Icon data={Code} />}
                                    onClick={() => setAddingCustomHtml(true)}
                                >
                                    {i18n('custom_html')}
                                </Menu.Item>
                                <div
                                    role="separator"
                                    className={b('templates-separator', [stop])}
                                />
                                <GroupedTemplatesMenuItems
                                    templates={templates}
                                    filter={filter}
                                    emptyText={i18n('block_templates_empty')}
                                    onApply={(template) => {
                                        onApplyTemplate(template);
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
};
