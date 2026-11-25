import {useId, useMemo, useState} from 'react';
import type {FC, ReactNode} from 'react';

import {ChevronDown, ChevronRight, Code, Layers, Magnifier, Xmark} from '@gravity-ui/icons';
import {Button, Icon, type IconData, Popup, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {CustomTemplateEditor} from './CustomTemplateEditor';
import {LivePreview} from './TemplatePreview';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

import './StructureTemplatesPanel.scss';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

export type PickerPreview = {markup: string; css: string};

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
    badge?: ReactNode;
    active?: boolean;
    variants: PickerVariant[];
    onApply: () => void;
};

export type PickerGroup = {
    title: string;
    cards: PickerCardModel[];
};

export type PickerEditor = {
    id: string;
    label: string;
    icon: IconData;
    render: (close: () => void) => ReactNode;
};

const PickerCard: FC<{card: PickerCardModel}> = ({card}) => {
    const hasVariants = card.variants.length > 0;
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const variantsId = useId();

    return (
        <div className={b('structure-card-wrap', [stop])}>
            <button
                type="button"
                className={b('structure-card', {active: card.active}, [stop])}
                onClick={card.onApply}
                title={card.title}
                aria-pressed={card.active}
            >
                <span className={b('structure-card-frame')}>
                    <span className={b('structure-card-preview')}>
                        <LivePreview markup={card.preview.markup} css={card.preview.css} />
                    </span>
                </span>
                <span className={b('structure-card-title')}>{card.title}</span>
            </button>

            {hasVariants && (
                <>
                    <Button
                        ref={setAnchor}
                        view="outlined"
                        size="s"
                        className={b('structure-card-variants', [stop])}
                        aria-expanded={open}
                        aria-controls={open ? variantsId : undefined}
                        onClick={() => setOpen((current) => !current)}
                    >
                        {card.badge ?? i18n('variants_count', {count: card.variants.length})}
                        <Icon data={ChevronDown} size={12} />
                    </Button>
                    <Popup
                        anchorElement={anchor}
                        open={open}
                        placement="bottom-start"
                        onOpenChange={setOpen}
                    >
                        <div id={variantsId} className={b('structure-themes', [stop])}>
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
                                    <span className={b('structure-theme-title')}>
                                        {variant.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </Popup>
                </>
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
    onApplyCustom?: (value: {
        content: string;
        css: string;
    }) => void | boolean | Promise<void | boolean>;
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
    const allGroups = useMemo(() => buildGroups(''), [buildGroups]);
    const hasAnyCards = allGroups.some((group) => group.cards.length > 0);
    const hasCustom = Boolean(onApplyCustom);
    const [activeEditor, setActiveEditor] = useState<string | null>(
        hasCustom && customByDefault && !hasAnyCards ? 'custom' : null,
    );
    const [openGroups, setOpenGroups] = useState<string[]>(() =>
        allGroups.slice(0, 1).map((group) => group.title),
    );

    const groups = useMemo(
        () => (filter.trim() ? buildGroups(filter) : allGroups),
        [allGroups, buildGroups, filter],
    );
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (groupTitle: string) => {
        setOpenGroups((current) =>
            current.includes(groupTitle)
                ? current.filter((openTitle) => openTitle !== groupTitle)
                : [...current, groupTitle],
        );
    };

    const closeEditor = () => setActiveEditor(null);

    const activeExtraEditor = editors?.find((editor) => editor.id === activeEditor);

    const hasActions = hasCustom || (editors?.length ?? 0) > 0 || Boolean(extraActions);
    const showToolbar = showSearch || hasActions;

    const listView = (
        <>
            {showToolbar && (
                <div className={b('structures-toolbar')}>
                    {showSearch && (
                        <TextInput
                            className={b('structures-search', [stop])}
                            controlProps={{
                                className: stop,
                                'aria-label': searchPlaceholder ?? title,
                            }}
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
    if (onApplyCustom && activeEditor === 'custom')
        panelBody = (
            <CustomTemplateEditor
                htmlPlaceholder={customHtmlPlaceholder}
                cssPlaceholder={customCssPlaceholder}
                onApply={onApplyCustom}
                onCancel={hasAnyCards ? closeEditor : onClose}
            />
        );
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
