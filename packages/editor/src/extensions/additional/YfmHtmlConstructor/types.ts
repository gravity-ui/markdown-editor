export type HtmlConstructorTemplateType = 'family' | 'structure' | 'block' | 'theme';

export type HtmlConstructorTemplatePreset = 'default' | 'none' | 'disabled';

export type HtmlConstructorTemplateSettings = {
    hasBackground: boolean;
    hasRound: boolean;
    hasBorder: boolean;
    hasTextColor: boolean;
    hasDelete: boolean;
    hasRaw: boolean;
    preset: HtmlConstructorTemplatePreset;
};

export type HtmlConstructorBorderStyle = 'solid' | 'dashed' | 'dotted' | 'none';

export type HtmlConstructorQuickStyle = {
    background?: string;
    textColor?: string;
    borderRadius?: string;
    borderStyle?: HtmlConstructorBorderStyle;
};

interface HtmlConstructorTemplateBase {
    id: string;
    type: HtmlConstructorTemplateType;
    title?: string;
    declarationIndex: number;
}

interface HtmlConstructorReferencedTemplateBase extends HtmlConstructorTemplateBase {
    family?: string;
    structure?: string;
    block?: string;
    priority: number;
}

export interface HtmlConstructorFamilyTemplate extends HtmlConstructorTemplateBase {
    type: 'family';
    title: string;
}

export interface HtmlConstructorStructureTemplate extends HtmlConstructorReferencedTemplateBase {
    type: 'structure';
    settings: HtmlConstructorTemplateSettings;
    styles: string[];
    content: string;
}

export interface HtmlConstructorBlockTemplate extends HtmlConstructorReferencedTemplateBase {
    type: 'block';
    settings: HtmlConstructorTemplateSettings;
    styles: string[];
    content: string;
}

export interface HtmlConstructorThemeTemplate extends HtmlConstructorReferencedTemplateBase {
    type: 'theme';
    styles: string[];
}

export type HtmlConstructorTemplate =
    | HtmlConstructorFamilyTemplate
    | HtmlConstructorStructureTemplate
    | HtmlConstructorBlockTemplate
    | HtmlConstructorThemeTemplate;

export type HtmlConstructorRenderableTemplate =
    | HtmlConstructorStructureTemplate
    | HtmlConstructorBlockTemplate;

export type HtmlConstructorTemplateBlock = {
    css: string;
    content: string;
};

export type HtmlConstructorStructure = {
    templateId?: string;
    css: string;
    content: string;
    themeIds: string[];
    settings?: HtmlConstructorTemplateSettings;
    quickStyle?: HtmlConstructorQuickStyle;
};

export type HtmlConstructorBlock = {
    id: string;
    templateId?: string;
    css: string;
    content: string;
    themeIds: string[];
    settings?: HtmlConstructorTemplateSettings;
    quickStyle?: HtmlConstructorQuickStyle;
};

export interface YfmHtmlConstructorOptions {
    /** Templates provided via extension options; read-only source. */
    items?: HtmlConstructorTemplate[];
    /** Show the structure templates button in the block toolbar. */
    showButton?: boolean;
    /** Show the "add template" button (writes to localStorage). */
    allowAdd?: boolean;
}
