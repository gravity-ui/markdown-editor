import {useEffect, useMemo, useRef, useState} from 'react';
import type {FC} from 'react';

import {ChevronDown, ChevronRight, Code, Layers, Magnifier, Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {blockClass} from '../css';
import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructure,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
} from '../types';

import {LivePreview} from './TemplatePreview';
import {blockTemplateToBlock, buildPreviewCss} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {buildBlockMenuGroups} from './groupTemplates';
import type {BlockMenuItem} from './groupTemplates';

import './StructureTemplatesPanel.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const THEMES_CLOSE_DELAY = 140;

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

const EMPTY_STRUCTURE: HtmlConstructorStructure = {
    css: '',
    content: '',
    themeIds: [],
};

const useBlockPreview = (
    template: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
) =>
    useMemo(() => {
        const block = blockTemplateToBlock(template, theme);

        return {
            markup: `<div class="g-md-hc-block ${blockClass(0)}">${block.content}</div>`,
            css: buildPreviewCss({structure: EMPTY_STRUCTURE, blocks: [block]}),
        };
    }, [template, theme]);

type BlockVariant = {
    state: HtmlConstructorBlockTemplate;
    theme?: HtmlConstructorThemeTemplate;
};

const BlockPreview: FC<{
    template: HtmlConstructorBlockTemplate;
    theme?: HtmlConstructorThemeTemplate;
}> = ({template, theme}) => {
    const {markup, css} = useBlockPreview(template, theme);
    return <LivePreview markup={markup} css={css} />;
};

const BlockCard: FC<{
    item: BlockMenuItem;
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
}> = ({item, onApply}) => {
    const {block} = item;
    const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();

    const variants = useMemo<BlockVariant[]>(() => {
        const list: BlockVariant[] = [];
        item.states.forEach((state, index) => {
            // The base state is the card itself; only extra states become variants.
            if (index > 0) list.push({state});
            for (const theme of item.themesByBlockId[state.id] ?? []) {
                list.push({state, theme});
            }
        });
        return list;
    }, [item]);
    const hasVariants = variants.length > 0;

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
        if (!hasVariants) return;
        cancelClose();
        setOpen(true);
    };

    const getVariantLabel = (variant: BlockVariant) => {
        const stateTitle = getTitle(variant.state);
        if (!variant.theme) return stateTitle;
        const themeTitle = getTitle(variant.theme);
        return variant.state.id === block.id ? themeTitle : `${stateTitle} · ${themeTitle}`;
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
                onClick={() => onApply(block)}
                title={getTitle(block)}
            >
                <span className={b('structure-card-frame', {stacked: hasVariants, expanded: open})}>
                    <span className={b('structure-card-preview')}>
                        <BlockPreview template={block} />
                    </span>
                    {hasVariants && (
                        <span className={b('structure-card-badge')}>
                            {i18n('variants_count', {count: variants.length})}
                        </span>
                    )}
                </span>
                <span className={b('structure-card-title')}>{getTitle(block)}</span>
            </button>

            {hasVariants && (
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
                        {variants.map((variant) => {
                            const label = getVariantLabel(variant);
                            return (
                                <button
                                    key={`${variant.state.id}:${variant.theme?.id ?? 'state'}`}
                                    type="button"
                                    className={b('structure-theme', [stop])}
                                    onClick={() => onApply(variant.state, variant.theme)}
                                    title={label}
                                >
                                    <span className={b('structure-theme-preview')}>
                                        <BlockPreview
                                            template={variant.state}
                                            theme={variant.theme}
                                        />
                                    </span>
                                    <span className={b('structure-theme-title')}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </Popup>
            )}
        </div>
    );
};

const BlockGroup: FC<{
    title: string;
    items: BlockMenuItem[];
    open: boolean;
    onToggle: () => void;
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
}> = ({title, items, open, onToggle, onApply}) => (
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
                    <BlockCard key={item.block.id} item={item} onApply={onApply} />
                ))}
            </div>
        )}
    </section>
);

interface BlockTemplatesPanelProps {
    templates: HtmlConstructorTemplate[];
    activeStructureId?: string;
    emptyText: string;
    onClose: () => void;
    onApplyTemplate: (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
    onApplyHtml: (block: HtmlConstructorTemplateBlock) => void;
}

export const BlockTemplatesPanel: FC<BlockTemplatesPanelProps> = ({
    templates,
    activeStructureId,
    emptyText,
    onClose,
    onApplyTemplate,
    onApplyHtml,
}) => {
    const [filter, setFilter] = useState('');
    const [customHtml, setCustomHtml] = useState('');
    const [customCss, setCustomCss] = useState('');
    const hasAnyBlocks = useMemo(
        () => buildBlockMenuGroups(templates, activeStructureId).length > 0,
        [activeStructureId, templates],
    );
    const [addingHtml, setAddingHtml] = useState(!hasAnyBlocks);
    const [openGroups, setOpenGroups] = useState<string[]>(() =>
        buildBlockMenuGroups(templates, activeStructureId)
            .slice(0, 1)
            .map((group) => group.title),
    );

    const groups = useMemo(
        () => buildBlockMenuGroups(templates, activeStructureId, filter),
        [activeStructureId, filter, templates],
    );
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (title: string) => {
        setOpenGroups((current) =>
            current.includes(title)
                ? current.filter((openTitle) => openTitle !== title)
                : [...current, title],
        );
    };

    const handleInsertCustom = () => {
        onApplyHtml({content: customHtml.trim(), css: customCss.trim()});
        setCustomHtml('');
        setCustomCss('');
    };

    const cancelCustom = () => {
        if (hasAnyBlocks) {
            setAddingHtml(false);
            setCustomHtml('');
            setCustomCss('');
        } else {
            onClose();
        }
    };

    const showCustomEditor = addingHtml || !hasAnyBlocks;

    return (
        <div className={b('structures', [stop])}>
            <div className={b('structures-header')}>
                <h2 className={b('structures-title')}>{i18n('blocks_title')}</h2>
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

            {showCustomEditor ? (
                <div className={b('structures-import')}>
                    <div className={b('structures-custom-field')}>
                        <div className={b('structures-custom-label')}>{i18n('html')}</div>
                        <TextArea
                            controlProps={{className: stop}}
                            value={customHtml}
                            onUpdate={setCustomHtml}
                            placeholder={i18n('block_html_input_placeholder')}
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
                            placeholder={'& {\n  padding: 16px;\n  border-radius: 8px;\n}'}
                            minRows={6}
                        />
                    </div>
                    <div className={b('structures-import-actions')}>
                        <Button view="flat" size="l" className={stop} onClick={cancelCustom}>
                            {i18n('cancel')}
                        </Button>
                        <Button
                            view="action"
                            size="l"
                            className={stop}
                            disabled={!customHtml.trim() && !customCss.trim()}
                            onClick={handleInsertCustom}
                        >
                            {i18n('insert')}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={b('structures-toolbar')}>
                        <TextInput
                            className={b('structures-search', [stop])}
                            controlProps={{className: stop}}
                            size="l"
                            value={filter}
                            onUpdate={setFilter}
                            placeholder={i18n('search_templates')}
                            startContent={
                                <Icon
                                    data={Magnifier}
                                    size={16}
                                    className={b('structures-search-icon')}
                                />
                            }
                            hasClear
                        />
                        <div className={b('structures-actions')}>
                            <Button
                                view="flat"
                                size="l"
                                className={stop}
                                onClick={() => setAddingHtml(true)}
                            >
                                <Icon data={Code} size={16} />
                                {i18n('custom_block')}
                            </Button>
                        </div>
                    </div>

                    <div className={b('structures-body')}>
                        {groups.length === 0 ? (
                            <div className={b('structures-empty')}>{emptyText}</div>
                        ) : (
                            groups.map((group) => (
                                <BlockGroup
                                    key={group.title}
                                    title={group.title}
                                    items={group.items}
                                    open={hasFilter || openGroups.includes(group.title)}
                                    onToggle={() => toggleGroup(group.title)}
                                    onApply={onApplyTemplate}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
