import {useCallback, useState} from 'react';
import type {FC} from 'react';

import {ArrowDownToSquare, TrashBin} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

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

import {TemplatePickerPanel} from './TemplatePicker';
import type {PickerCardModel, PickerEditor, PickerGroup, PickerPreview} from './TemplatePicker';
import {buildPreviewCss, structureTemplateToAttrs} from './blockUtils';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {buildStructureMenuGroups} from './groupTemplates';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

const structurePreview = (
    templates: HtmlConstructorTemplate[],
    structure: HtmlConstructorStructureTemplate,
    theme?: HtmlConstructorThemeTemplate,
): PickerPreview => {
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
};

const structureCard = (
    templates: HtmlConstructorTemplate[],
    item: {structure: HtmlConstructorStructureTemplate; themes: HtmlConstructorThemeTemplate[]},
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void,
): PickerCardModel => ({
    id: item.structure.id,
    title: getTitle(item.structure),
    preview: structurePreview(templates, item.structure),
    badge: item.themes.length ? i18n('themes_count', {count: item.themes.length}) : undefined,
    onApply: () => onApply(item.structure),
    variants: item.themes.map((theme) => ({
        key: theme.id,
        label: getTitle(theme),
        preview: structurePreview(templates, item.structure, theme),
        onApply: () => onApply(item.structure, theme),
    })),
});

const StructureImportEditor: FC<{
    onClose: () => void;
    onAdded: (templates: HtmlConstructorTemplate[]) => void;
}> = ({onClose, onAdded}) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        try {
            const parsed = parseTemplates(input);
            if (parsed.length) onAdded(saveTemplates(parsed));
            onClose();
        } catch (err) {
            setError(
                err instanceof HtmlConstructorTemplateParseError
                    ? err.message
                    : i18n('templates_parse_error'),
            );
        }
    };

    return (
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
                <Button view="flat" size="l" className={stop} onClick={onClose}>
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
};

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
    const buildGroups = useCallback(
        (filter: string): PickerGroup[] =>
            buildStructureMenuGroups(templates, filter).map((group) => ({
                title: group.title,
                cards: group.items.map((item) => structureCard(templates, item, onApply)),
            })),
        [onApply, templates],
    );

    const editors: PickerEditor[] | undefined = allowAdd
        ? [
              {
                  id: 'import',
                  label: i18n('add_template'),
                  icon: ArrowDownToSquare,
                  render: (close) => <StructureImportEditor onClose={close} onAdded={onAdded} />,
              },
          ]
        : undefined;

    const extraActions = allowAdd ? (
        <Button
            view="flat"
            size="l"
            className={stop}
            disabled={!hasStoredTemplates}
            onClick={() => onCleared(clearStoredTemplates())}
        >
            <Icon data={TrashBin} size={16} />
            {i18n('clear_templates')}
        </Button>
    ) : undefined;

    return (
        <TemplatePickerPanel
            title={i18n('structures_title')}
            searchPlaceholder={i18n('search_structures')}
            emptyText={emptyText}
            buildGroups={buildGroups}
            onClose={onClose}
            customLabel={i18n('custom_structure')}
            customHtmlPlaceholder={'<section>\n  <h2>Structure intro</h2>\n</section>'}
            customCssPlaceholder={'.g-md-hc-structure {\n  display: grid;\n  gap: 16px;\n}'}
            onApplyCustom={onApplyCustom}
            editors={editors}
            extraActions={extraActions}
        />
    );
};
