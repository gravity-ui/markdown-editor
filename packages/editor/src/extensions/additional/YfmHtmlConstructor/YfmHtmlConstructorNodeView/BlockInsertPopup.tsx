import {useMemo, useState} from 'react';
import type {FC} from 'react';

import {Code} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {parseRawBlock} from '../templates';
import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
} from '../types';

import {BlockTemplatesMenuItems} from './GroupedTemplatesMenuItems';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {buildBlockMenuGroups} from './groupTemplates';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

interface BlockInsertPopupProps {
    anchor: HTMLElement | null;
    open: boolean;
    templates: HtmlConstructorTemplate[];
    activeStructureId?: string;
    onClose: () => void;
    onApplyTemplate: (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
    onApplyHtml: (block: HtmlConstructorTemplateBlock) => void;
}

export const BlockInsertPopup: FC<BlockInsertPopupProps> = ({
    anchor,
    open,
    templates,
    activeStructureId,
    onClose,
    onApplyTemplate,
    onApplyHtml,
}) => {
    const [addingCustomHtml, setAddingCustomHtml] = useState(false);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('');
    const groups = useMemo(
        () => buildBlockMenuGroups(templates, activeStructureId, filter),
        [activeStructureId, filter, templates],
    );
    const showCustomHtmlEditor = addingCustomHtml || groups.length === 0;

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
                                <BlockTemplatesMenuItems
                                    groups={groups}
                                    filter={filter}
                                    emptyText={i18n('block_templates_empty')}
                                    onApply={(template, theme) => {
                                        onApplyTemplate(template, theme);
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
