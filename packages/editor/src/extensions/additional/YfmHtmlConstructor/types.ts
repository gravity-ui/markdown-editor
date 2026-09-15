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

export type HtmlConstructorColorTheme = 'light' | 'dark';

/**
 * A color the user can pick separately for the light and the dark color theme.
 * The block consumes the value matching the reader's active theme, so a single
 * quick-style choice can invert between themes.
 */
export type HtmlConstructorThemedColor = {
    light?: string;
    dark?: string;
};

export type HtmlConstructorQuickStyle = {
    background?: HtmlConstructorThemedColor;
    textColor?: HtmlConstructorThemedColor;
    borderRadius?: string;
    borderStyle?: HtmlConstructorBorderStyle;
};

interface HtmlConstructorTemplateBase {
    id: string;
    type: HtmlConstructorTemplateType;
    title?: string;
    /** Optional semver tag. Recommended for `family`, allowed for any type. */
    version?: string;
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
    /**
     * Family-level HTML used as the family cover in the templates marketplace
     * (an external resource — not the editor). The editor itself never renders it.
     */
    content: string;
    /**
     * Family-level CSS that styles the marketplace cover. Ignored by the editor.
     */
    styles: string[];
    /**
     * Free-form metadata declared via `data-*` attributes on the family template
     * (key is the part after `data-`). Unlike structure/block/theme, where `data-*`
     * is restricted to settings, a family may carry arbitrary meta.
     */
    meta?: Record<string, string>;
}

export interface HtmlConstructorStructureTemplate extends HtmlConstructorReferencedTemplateBase {
    type: 'structure';
    settings: HtmlConstructorTemplateSettings;
    /**
     * Structure-level CSS (layout). A structure is a container composed only of
     * its blocks; any non-block markup inside the structure template is discarded.
     */
    styles: string[];
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

export interface YfmHtmlConstructorExtensionOptions {
    templates?: YfmHtmlConstructorOptions;
    /**
     * Experimental. Scope each constructor's generated CSS to its own instance
     * by wrapping it in a unique class (derived from the node's entity id), so
     * styles from one constructor don't leak into another on the same page.
     *
     * Off by default — flip it on to evaluate whether the isolation is needed.
     */
    scopeStyles?: boolean;
}
