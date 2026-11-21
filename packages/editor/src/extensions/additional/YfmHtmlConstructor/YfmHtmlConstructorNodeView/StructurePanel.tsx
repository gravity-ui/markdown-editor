import type {FC} from 'react';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {
    type ConstructorDocument,
    assembleStructureCss,
    assembleStructureHtml,
    getStructureCssFrame,
    getStructureHtmlFrame,
} from '../document';
import {emptyHtmlConstructorStructure} from '../model';
import {clearStoredTemplates} from '../templates';
import {buildStructurePreviewParts} from '../templates/preview';
import {
    applyStructureThemeToState,
    blockTemplateToBlock,
    rawTemplateBlockToBlock,
    structureTemplateToAttrs,
} from '../templates/state';
import type {TemplateCatalog} from '../templates/useTemplateCatalog';
import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorThemeTemplate,
} from '../types';

import {BlockTemplatesPanel} from './BlockTemplatesPanel';
import {CodeSettingsPanel} from './CodeSettingsPanel';
import {StructureTemplatesPanel} from './StructureTemplatesPanel';
import {ThemePickerPanel} from './ThemePickerPanel';
import type {ConfirmFn} from './useConfirm';
import type {useConstructorCommands} from './useConstructorCommands';

export type StructurePanelKind = 'blocks' | 'templates' | 'themes' | 'settings';

export const StructurePanel: FC<{
    panel: StructurePanelKind;
    document: ConstructorDocument;
    catalog: TemplateCatalog;
    commands: ReturnType<typeof useConstructorCommands>;
    confirm: ConfirmFn;
    onClose: () => void;
}> = ({panel, document: {structure, blocks}, catalog, commands, confirm, onClose}) => {
    const {activeStructure} = catalog;
    const isEmptyConstructor = !structure.content.trim() && blocks.length === 0;
    // Applying a structure replaces everything. The first time (empty constructor)
    // it just inserts; afterwards we confirm, since existing content is overwritten.
    const confirmStructureOverwriteIfNeeded = async () => {
        if (isEmptyConstructor) return true;
        return confirm({
            title: i18n('confirm_replace_structure_title'),
            message: i18n('confirm_replace_structure_message'),
            confirmText: i18n('replace'),
            danger: true,
        });
    };

    const applyStructureTemplate = async (
        template: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        if (!(await confirmStructureOverwriteIfNeeded())) return;

        commands.replaceDocument(structureTemplateToAttrs(catalog.items, template, theme));
        onClose();
    };

    const applyCustomStructure = async ({content, css}: {content: string; css: string}) => {
        if (!(await confirmStructureOverwriteIfNeeded())) return false;

        commands.replaceDocument({
            structure: {
                ...emptyHtmlConstructorStructure(),
                content,
                css,
            },
            blocks: [],
        });
        onClose();
        return true;
    };

    const clearTemplates = async () => {
        const confirmed = await confirm({
            title: i18n('confirm_clear_templates_title'),
            message: i18n('confirm_clear_templates_message'),
            confirmText: i18n('clear'),
            danger: true,
        });
        if (!confirmed) return;

        clearStoredTemplates();
    };

    const applyStructureTheme = (theme?: HtmlConstructorThemeTemplate) => {
        if (!activeStructure) return;

        commands.patchStructure(applyStructureThemeToState(structure, activeStructure, theme));
        onClose();
    };

    const applyBlockTemplate = (
        template: HtmlConstructorBlockTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => {
        commands.addBlock(blockTemplateToBlock(template, theme));
        onClose();
    };

    const applyRawBlock = (block: HtmlConstructorTemplateBlock) => {
        commands.addBlock(rawTemplateBlockToBlock(block));
        onClose();
    };

    if (panel === 'blocks') {
        return (
            <BlockTemplatesPanel
                templates={catalog.items}
                activeStructureId={structure.templateId}
                emptyText={i18n('block_templates_empty')}
                onClose={onClose}
                onApplyTemplate={applyBlockTemplate}
                onApplyHtml={applyRawBlock}
            />
        );
    }

    if (panel === 'templates') {
        return (
            <StructureTemplatesPanel
                templates={catalog.items}
                allowAdd={catalog.allowAdd}
                emptyText={i18n('structure_templates_empty')}
                hasStoredTemplates={catalog.hasStored}
                onClose={onClose}
                onApply={applyStructureTemplate}
                onApplyCustom={applyCustomStructure}
                onClear={clearTemplates}
            />
        );
    }

    if (panel === 'themes') {
        return (
            <ThemePickerPanel
                themes={catalog.themes}
                activeIds={structure.themeIds}
                buildPreview={
                    activeStructure
                        ? (theme) =>
                              buildStructurePreviewParts(catalog.items, activeStructure, theme)
                        : undefined
                }
                onApply={applyStructureTheme}
                onClose={onClose}
            />
        );
    }

    if (panel === 'settings') {
        return (
            <CodeSettingsPanel
                html={assembleStructureHtml(structure, blocks)}
                css={assembleStructureCss(structure, blocks)}
                htmlFrame={getStructureHtmlFrame()}
                cssFrame={getStructureCssFrame()}
                onCommit={commands.commitCode}
                onClose={onClose}
            />
        );
    }

    return null;
};
