import {useEffect, useMemo, useRef, useState} from 'react';
import type {FC, ReactNode} from 'react';

import {
    ArrowDownToSquare,
    ChevronDown,
    ChevronRight,
    Code,
    Layers,
    Magnifier,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {blockClass, structureClass} from '../css';
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

import {LivePreview} from './TemplatePreview';
import {buildPreviewCss, structureTemplateToAttrs} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {buildStructureMenuGroups} from './groupTemplates';
import type {StructureMenuItem} from './groupTemplates';

import './StructureTemplatesPanel.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

const StructurePreview: FC<{
    templates: HtmlConstructorTemplate[];
    structure: HtmlConstructorStructureTemplate;
    theme?: HtmlConstructorThemeTemplate;
}> = ({templates, structure, theme}) => {
    const {markup, css} = useMemo(() => {
        const {structure: state, blocks} = structureTemplateToAttrs(templates, structure, theme);
        const blocksHtml = blocks
            .map(
                (block, index) =>
                    `<div class="g-md-hc-block ${blockClass(index)}">${block.content}</div>`,
            )
            .join('');

        return {
            markup: `<div class="g-md-hc-structure ${structureClass()}">${state.content}${blocksHtml}</div>`,
            css: buildPreviewCss({structure: state, blocks}),
        };
    }, [structure, templates, theme]);

    return <LivePreview markup={markup} css={css} />;
};

const THEMES_CLOSE_DELAY = 140;

const StructureCard: FC<{
    templates: HtmlConstructorTemplate[];
    item: StructureMenuItem;
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
}> = ({templates, item, onApply}) => {
    const {structure, themes} = item;
    const hasThemes = themes.length > 0;
    const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = undefined;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(false), THEMES_CLOSE_DELAY);
    };

    const handleEnter = () => {
        if (!hasThemes) return;
        cancelClose();
        setOpen(true);
    };

    useEffect(() => cancelClose, []);

    return (
        <div
            ref={setAnchor}
            className={b('structure-card-wrap', [stop])}
            onMouseEnter={handleEnter}
            onMouseLeave={scheduleClose}
        >
            <button
                type="button"
                className={b('structure-card', [stop])}
                onClick={() => onApply(structure)}
                title={getTitle(structure)}
            >
                <span className={b('structure-card-frame', {stacked: hasThemes, expanded: open})}>
                    <span className={b('structure-card-preview')}>
                        <StructurePreview templates={templates} structure={structure} />
                    </span>
                    {hasThemes && (
                        <span className={b('structure-card-badge')}>
                            {i18n('themes_count', {count: themes.length})}
                        </span>
                    )}
                </span>
                <span className={b('structure-card-title')}>{getTitle(structure)}</span>
            </button>

            {hasThemes && (
                <Popup
                    anchorElement={anchor}
                    open={open}
                    placement="bottom"
                    hasArrow
                    onOpenChange={(nextOpen) => {
                        if (!nextOpen) setOpen(false);
                    }}
                >
                    <div
                        className={b('structure-themes', [stop])}
                        onMouseEnter={cancelClose}
                        onMouseLeave={scheduleClose}
                    >
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                className={b('structure-theme', [stop])}
                                onClick={() => onApply(structure, theme)}
                                title={getTitle(theme)}
                            >
                                <span className={b('structure-theme-preview')}>
                                    <StructurePreview
                                        templates={templates}
                                        structure={structure}
                                        theme={theme}
                                    />
                                </span>
                                <span className={b('structure-theme-title')}>
                                    {getTitle(theme)}
                                </span>
                            </button>
                        ))}
                    </div>
                </Popup>
            )}
        </div>
    );
};

const StructureGroup: FC<{
    templates: HtmlConstructorTemplate[];
    title: string;
    items: StructureMenuItem[];
    open: boolean;
    onToggle: () => void;
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
}> = ({templates, title, items, open, onToggle, onApply}) => (
    <section className={b('structure-group')}>
        <button
            type="button"
            className={b('structure-group-header', [stop])}
            onClick={onToggle}
            aria-expanded={open}
        >
            <Icon data={Layers} size={16} className={b('structure-group-icon')} />
            <span className={b('structure-group-title')}>{title}</span>
            <Icon
                data={open ? ChevronDown : ChevronRight}
                size={16}
                className={b('structure-group-caret')}
            />
        </button>
        {open && (
            <div className={b('structure-grid')}>
                {items.map((item) => (
                    <StructureCard
                        key={item.structure.id}
                        templates={templates}
                        item={item}
                        onApply={onApply}
                    />
                ))}
            </div>
        )}
    </section>
);

interface StructureTemplatesPanelProps {
    templates: HtmlConstructorTemplate[];
    allowAdd: boolean;
    emptyText: string;
    hasStoredTemplates: boolean;
    onClose: () => void;
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
    onApplyCustom: (value: {content: string; css: string}) => void;
    onAdded: (templates: HtmlConstructorTemplate[]) => void;
    onCleared: (templates: HtmlConstructorTemplate[]) => void;
}

export const StructureTemplatesPanel: FC<StructureTemplatesPanelProps> = ({
    templates,
    allowAdd,
    emptyText,
    hasStoredTemplates,
    onClose,
    onApply,
    onApplyCustom,
    onAdded,
    onCleared,
}) => {
    const [filter, setFilter] = useState('');
    const [adding, setAdding] = useState(false);
    const [customizing, setCustomizing] = useState(false);
    const [customHtml, setCustomHtml] = useState('');
    const [customCss, setCustomCss] = useState('');
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [openGroups, setOpenGroups] = useState<string[]>(() =>
        buildStructureMenuGroups(templates)
            .slice(0, 1)
            .map((group) => group.title),
    );

    const groups = useMemo(() => buildStructureMenuGroups(templates, filter), [filter, templates]);
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (title: string) => {
        setOpenGroups((current) =>
            current.includes(title)
                ? current.filter((openTitle) => openTitle !== title)
                : [...current, title],
        );
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
    };

    const handleApplyCustom = () => {
        onApplyCustom({content: customHtml.trim(), css: customCss.trim()});
        setCustomHtml('');
        setCustomCss('');
        setCustomizing(false);
    };

    const customEditor = (
        <div className={b('structures-import')}>
            <div className={b('structures-custom-field')}>
                <div className={b('structures-custom-label')}>{i18n('html')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={customHtml}
                    onUpdate={setCustomHtml}
                    placeholder={'<section>\n  <h2>Structure intro</h2>\n</section>'}
                    minRows={6}
                    autoFocus
                />
            </div>
            <div className={b('structures-custom-field')}>
                <div className={b('structures-custom-label')}>{i18n('css')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={customCss}
                    onUpdate={setCustomCss}
                    placeholder={'.g-md-hc-structure {\n  display: grid;\n  gap: 16px;\n}'}
                    minRows={6}
                />
            </div>
            <div className={b('structures-import-actions')}>
                <Button view="flat" size="l" className={stop} onClick={() => setCustomizing(false)}>
                    {i18n('cancel')}
                </Button>
                <Button
                    view="action"
                    size="l"
                    className={stop}
                    disabled={!customHtml.trim() && !customCss.trim()}
                    onClick={handleApplyCustom}
                >
                    {i18n('insert')}
                </Button>
            </div>
        </div>
    );

    const importEditor = (
        <div className={b('structures-import')}>
            <TextArea
                controlProps={{className: stop}}
                value={input}
                onUpdate={(value) => {
                    setInput(value);
                    setError('');
                }}
                placeholder={i18n('templates_input_placeholder')}
                minRows={10}
                autoFocus
            />
            {error && <div className={b('structures-error')}>{error}</div>}
            <div className={b('structures-import-actions')}>
                <Button view="flat" size="l" className={stop} onClick={() => setAdding(false)}>
                    {i18n('cancel')}
                </Button>
                <Button
                    view="action"
                    size="l"
                    className={stop}
                    disabled={!input.trim()}
                    onClick={handleSave}
                >
                    {i18n('save')}
                </Button>
            </div>
        </div>
    );

    const listView = (
        <>
            <div className={b('structures-toolbar')}>
                <TextInput
                    className={b('structures-search', [stop])}
                    controlProps={{className: stop}}
                    size="l"
                    value={filter}
                    onUpdate={setFilter}
                    placeholder={i18n('search_structures')}
                    startContent={
                        <Icon data={Magnifier} size={16} className={b('structures-search-icon')} />
                    }
                    hasClear
                />
                <div className={b('structures-actions')}>
                    <Button
                        view="flat"
                        size="l"
                        className={stop}
                        onClick={() => setCustomizing(true)}
                    >
                        <Icon data={Code} size={16} />
                        {i18n('custom_structure')}
                    </Button>
                    {allowAdd && (
                        <>
                            <Button
                                view="flat"
                                size="l"
                                className={stop}
                                onClick={() => setAdding(true)}
                            >
                                <Icon data={ArrowDownToSquare} size={16} />
                                {i18n('add_template')}
                            </Button>
                            <Button
                                view="flat"
                                size="l"
                                className={stop}
                                disabled={!hasStoredTemplates}
                                onClick={handleClear}
                            >
                                <Icon data={TrashBin} size={16} />
                                {i18n('clear_templates')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className={b('structures-body')}>
                {groups.length === 0 ? (
                    <div className={b('structures-empty')}>{emptyText}</div>
                ) : (
                    groups.map((group) => (
                        <StructureGroup
                            key={group.title}
                            templates={templates}
                            title={group.title}
                            items={group.items}
                            open={hasFilter || openGroups.includes(group.title)}
                            onToggle={() => toggleGroup(group.title)}
                            onApply={onApply}
                        />
                    ))
                )}
            </div>
        </>
    );

    let panelBody: ReactNode = listView;
    if (customizing) panelBody = customEditor;
    else if (adding) panelBody = importEditor;

    return (
        <div className={b('structures', [stop])}>
            <div className={b('structures-header')}>
                <h2 className={b('structures-title')}>{i18n('structures_title')}</h2>
                <Button
                    view="flat"
                    size="l"
                    className={stop}
                    onClick={onClose}
                    aria-label={i18n('close')}
                >
                    <Icon data={Xmark} size={18} />
                </Button>
            </div>

            {panelBody}
        </div>
    );
};
