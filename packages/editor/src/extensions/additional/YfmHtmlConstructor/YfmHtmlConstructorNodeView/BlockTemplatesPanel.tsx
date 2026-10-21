import {useCallback} from 'react';
import type {FC} from 'react';

import {i18n} from 'src/i18n/yfm-html-constructor';

import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {TemplatePickerPanel} from './TemplatePicker';
import type {PickerCardModel, PickerGroup} from './TemplatePicker';
import {buildBlockPreviewParts} from './blockUtils';
import {buildBlockMenuGroups} from './groupTemplates';
import type {BlockMenuItem} from './groupTemplates';

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

const blockPreview = buildBlockPreviewParts;

const variantLabel = (
    base: HtmlConstructorBlockTemplate,
    state: HtmlConstructorBlockTemplate,
    theme?: HtmlConstructorThemeTemplate,
) => {
    if (!theme) return getTitle(state);
    const themeTitle = getTitle(theme);
    return state.id === base.id ? themeTitle : `${getTitle(state)} · ${themeTitle}`;
};

const blockCard = (
    item: BlockMenuItem,
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void,
): PickerCardModel => {
    const {block} = item;
    const variants: {state: HtmlConstructorBlockTemplate; theme?: HtmlConstructorThemeTemplate}[] =
        [];
    item.states.forEach((state, index) => {
        // The base state is the card itself; only extra states become variants.
        if (index > 0) variants.push({state});
        for (const theme of item.themesByBlockId[state.id] ?? []) {
            variants.push({state, theme});
        }
    });

    return {
        id: block.id,
        title: getTitle(block),
        preview: blockPreview(block),
        badge: variants.length ? i18n('variants_count', {count: variants.length}) : undefined,
        onApply: () => onApply(block),
        variants: variants.map(({state, theme}) => ({
            key: `${state.id}:${theme?.id ?? 'state'}`,
            label: variantLabel(block, state, theme),
            preview: blockPreview(state, theme),
            onApply: () => onApply(state, theme),
        })),
    };
};

interface BlockTemplatesPanelProps {
    templates: HtmlConstructorTemplate[];
    activeStructureId?: string;
    emptyText: string;
    onClose: () => void;
    onApplyTemplate: (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
    onApplyHtml: (value: {content: string; css: string}) => void;
}

export const BlockTemplatesPanel: FC<BlockTemplatesPanelProps> = ({
    templates,
    activeStructureId,
    emptyText,
    onClose,
    onApplyTemplate,
    onApplyHtml,
}) => {
    const buildGroups = useCallback(
        (filter: string): PickerGroup[] =>
            buildBlockMenuGroups(templates, activeStructureId, filter).map((group) => ({
                title: group.title,
                cards: group.items.map((item) => blockCard(item, onApplyTemplate)),
            })),
        [activeStructureId, onApplyTemplate, templates],
    );

    return (
        <TemplatePickerPanel
            title={i18n('blocks_title')}
            searchPlaceholder={i18n('search_templates')}
            emptyText={emptyText}
            buildGroups={buildGroups}
            onClose={onClose}
            customLabel={i18n('custom_block')}
            customByDefault
            customHtmlPlaceholder={i18n('block_html_input_placeholder')}
            customCssPlaceholder={'& {\n  padding: 16px;\n  border-radius: 8px;\n}'}
            onApplyCustom={onApplyHtml}
        />
    );
};
