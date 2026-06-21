import {useEffect, useMemo, useRef, useState} from 'react';
import type {FC, ReactNode} from 'react';

import {ChevronDown, ChevronRight, Code, Layers, Magnifier, Xmark} from '@gravity-ui/icons';
import {Button, Icon, type IconData, Popup, TextInput} from '@gravity-ui/uikit';

import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/yfm-html-constructor';

import {LivePreview} from './TemplatePreview';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

import './StructureTemplatesPanel.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const VARIANTS_CLOSE_DELAY = 140;

export type PickerPreview = {markup: string; css: string};

/** A selectable alternative (theme/state) revealed when hovering a stacked card. */
export type PickerVariant = {
    key: string;
    label: string;
    preview: PickerPreview;
    onApply: () => void;
};

export type PickerCardModel = {
    id: string;
    title: string;
    preview: PickerPreview;
    /** Caption shown in the stacked-card corner, e.g. "3 themes". */
    badge?: ReactNode;
    /** Highlights the card as the currently applied option. */
    active?: boolean;
    variants: PickerVariant[];
    onApply: () => void;
};

export type PickerGroup = {
    title: string;
    cards: PickerCardModel[];
};

/** A toolbar button that swaps the body for a custom editor (e.g. template import). */
export type PickerEditor = {
    id: string;
    label: string;
    icon: IconData;
    render: (close: () => void) => ReactNode;
};

const PickerCard: FC<{card: PickerCardModel}> = ({card}) => {
    const hasVariants = card.variants.length > 0;
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
        closeTimer.current = setTimeout(() => setOpen(false), VARIANTS_CLOSE_DELAY);
    };

    const handleEnter = () => {
        if (!hasVariants) return;
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
                className={b('structure-card', {active: card.active}, [stop])}
                onClick={card.onApply}
                title={card.title}
            >
                <span className={b('structure-card-frame', {stacked: hasVariants, expanded: open})}>
                    <span className={b('structure-card-preview')}>
                        <LivePreview markup={card.preview.markup} css={card.preview.css} />
                    </span>
                    {card.badge && <span className={b('structure-card-badge')}>{card.badge}</span>}
                </span>
                <span className={b('structure-card-title')}>{card.title}</span>
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
                        {card.variants.map((variant) => (
                            <button
                                key={variant.key}
                                type="button"
                                className={b('structure-theme', [stop])}
                                onClick={variant.onApply}
                                title={variant.label}
                            >
                                <span className={b('structure-theme-preview')}>
                                    <LivePreview
                                        markup={variant.preview.markup}
                                        css={variant.preview.css}
                                    />
                                </span>
                                <span className={b('structure-theme-title')}>{variant.label}</span>
                            </button>
                        ))}
                    </div>
                </Popup>
            )}
        </div>
    );
};

const PickerGroupView: FC<{group: PickerGroup; open: boolean; onToggle: () => void}> = ({
    group,
    open,
    onToggle,
}) => (
    <section className={b('structure-group')}>
        <button
            type="button"
            className={b('structure-group-header', [stop])}
            onClick={onToggle}
            aria-expanded={open}
        >
            <Icon data={Layers} size={16} className={b('structure-group-icon')} />
            <span className={b('structure-group-title')}>{group.title}</span>
            <Icon
                data={open ? ChevronDown : ChevronRight}
                size={16}
                className={b('structure-group-caret')}
            />
        </button>
        {open && (
            <div className={b('structure-grid')}>
                {group.cards.map((card) => (
                    <PickerCard key={card.id} card={card} />
                ))}
            </div>
        )}
    </section>
);

export interface TemplatePickerPanelProps {
    title: string;
    searchPlaceholder?: string;
    emptyText: string;
    buildGroups: (filter: string) => PickerGroup[];
    onClose: () => void;
    /** Show the search field and toolbar. Defaults to true. */
    showSearch?: boolean;

    /** Built-in "custom" entry that lets the user type raw HTML and CSS. */
    customLabel?: string;
    customHtmlPlaceholder?: string;
    customCssPlaceholder?: string;
    onApplyCustom?: (value: {content: string; css: string}) => void;
    /** Opens the custom editor up front when there are no templates to pick from. */
    customByDefault?: boolean;

    /** Extra body-swapping editors (e.g. template import). */
    editors?: PickerEditor[];
    /** Extra plain toolbar buttons (e.g. clear templates). */
    extraActions?: ReactNode;
}

export const TemplatePickerPanel: FC<TemplatePickerPanelProps> = ({
    title,
    searchPlaceholder,
    emptyText,
    buildGroups,
    onClose,
    showSearch = true,
    customLabel,
    customHtmlPlaceholder,
    customCssPlaceholder,
    onApplyCustom,
    customByDefault,
    editors,
    extraActions,
}) => {
    const [filter, setFilter] = useState('');
    const [customHtml, setCustomHtml] = useState('');
    const [customCss, setCustomCss] = useState('');

    const hasAnyCards = useMemo(
        () => buildGroups('').some((group) => group.cards.length > 0),
        [buildGroups],
    );
    const hasCustom = Boolean(onApplyCustom);
    const [activeEditor, setActiveEditor] = useState<string | null>(
        hasCustom && customByDefault && !hasAnyCards ? 'custom' : null,
    );
    const [openGroups, setOpenGroups] = useState<string[]>(() =>
        buildGroups('')
            .slice(0, 1)
            .map((group) => group.title),
    );

    const groups = useMemo(() => buildGroups(filter), [buildGroups, filter]);
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (groupTitle: string) => {
        setOpenGroups((current) =>
            current.includes(groupTitle)
                ? current.filter((openTitle) => openTitle !== groupTitle)
                : [...current, groupTitle],
        );
    };

    const closeEditor = () => setActiveEditor(null);

    const cancelCustom = () => {
        setCustomHtml('');
        setCustomCss('');
        if (hasAnyCards) closeEditor();
        else onClose();
    };

    const applyCustom = () => {
        onApplyCustom?.({content: customHtml.trim(), css: customCss.trim()});
        setCustomHtml('');
        setCustomCss('');
    };

    const activeExtraEditor = editors?.find((editor) => editor.id === activeEditor);

    const customEditor = (
        <div className={b('structures-import')}>
            <div className={b('structures-custom-field')}>
                <div className={b('structures-custom-label')}>{i18n('html')}</div>
                <TextArea
                    controlProps={{className: stop}}
                    value={customHtml}
                    onUpdate={setCustomHtml}
                    placeholder={customHtmlPlaceholder}
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
                    placeholder={customCssPlaceholder}
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
                    onClick={applyCustom}
                >
                    {i18n('insert')}
                </Button>
            </div>
        </div>
    );

    const hasActions = hasCustom || (editors?.length ?? 0) > 0 || Boolean(extraActions);
    const showToolbar = showSearch || hasActions;

    const listView = (
        <>
            {showToolbar && (
                <div className={b('structures-toolbar')}>
                    {showSearch && (
                        <TextInput
                            className={b('structures-search', [stop])}
                            controlProps={{className: stop}}
                            size="l"
                            value={filter}
                            onUpdate={setFilter}
                            placeholder={searchPlaceholder}
                            startContent={
                                <Icon
                                    data={Magnifier}
                                    size={16}
                                    className={b('structures-search-icon')}
                                />
                            }
                            hasClear
                        />
                    )}
                    {hasActions && (
                        <div className={b('structures-actions')}>
                            {hasCustom && (
                                <Button
                                    view="flat"
                                    size="l"
                                    className={stop}
                                    onClick={() => setActiveEditor('custom')}
                                >
                                    <Icon data={Code} size={16} />
                                    {customLabel}
                                </Button>
                            )}
                            {editors?.map((editor) => (
                                <Button
                                    key={editor.id}
                                    view="flat"
                                    size="l"
                                    className={stop}
                                    onClick={() => setActiveEditor(editor.id)}
                                >
                                    <Icon data={editor.icon} size={16} />
                                    {editor.label}
                                </Button>
                            ))}
                            {extraActions}
                        </div>
                    )}
                </div>
            )}

            <div className={b('structures-body')}>
                {groups.length === 0 ? (
                    <div className={b('structures-empty')}>{emptyText}</div>
                ) : (
                    groups.map((group, index) =>
                        group.title ? (
                            <PickerGroupView
                                key={group.title}
                                group={group}
                                open={hasFilter || openGroups.includes(group.title)}
                                onToggle={() => toggleGroup(group.title)}
                            />
                        ) : (
                            <div key={`__flat-${index}`} className={b('structure-grid')}>
                                {group.cards.map((card) => (
                                    <PickerCard key={card.id} card={card} />
                                ))}
                            </div>
                        ),
                    )
                )}
            </div>
        </>
    );

    let panelBody: ReactNode = listView;
    if (hasCustom && activeEditor === 'custom') panelBody = customEditor;
    else if (activeExtraEditor) panelBody = activeExtraEditor.render(closeEditor);

    return (
        <div className={b('structures', [stop])}>
            <div className={b('structures-header')}>
                <h2 className={b('structures-title')}>{title}</h2>
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
