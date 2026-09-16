import {nodeTypeFactory} from 'src/utils/schema';

export const headerDirectiveName = 'header';
export const actionDirectiveName = 'action';

export const HeaderNode = {
    Header: 'header',
    Title: 'header_title',
    Subtitle: 'header_subtitle',
    Actions: 'header_actions',
    Action: 'header_action',
} as const;
export type HeaderNodeName = (typeof HeaderNode)[keyof typeof HeaderNode];

export const headerType = nodeTypeFactory(HeaderNode.Header);
export const headerTitleType = nodeTypeFactory(HeaderNode.Title);
export const headerSubtitleType = nodeTypeFactory(HeaderNode.Subtitle);
export const headerActionsType = nodeTypeFactory(HeaderNode.Actions);
export const headerActionType = nodeTypeFactory(HeaderNode.Action);

/** Имена атрибутов директивы; совпадают с именами атрибутов узла, кроме служебных. */
export const HeaderAttr = {
    Format: 'format',
    Edges: 'edges',
    Layout: 'layout',
    Background: 'bg',
    Fill: 'fill',
    Text: 'text',
    Image: 'image',
    Border: 'border',
} as const;

export const HeaderActionAttr = {
    Href: 'href',
    Variant: 'variant',
} as const;

export const HeaderFormat = {Large: 'large', Small: 'small'} as const;
export const HeaderEdges = {Rounded: 'rounded', Bleed: 'bleed'} as const;
export const HeaderLayout = {Cover: 'cover', Split: 'split'} as const;
export const HeaderBackground = {Fill: 'fill', Image: 'image'} as const;
export const HeaderBorder = {
    None: 'none',
    Solid: 'solid',
    Dashed: 'dashed',
    Dotted: 'dotted',
} as const;
export const HeaderTextColor = {Auto: 'auto', Light: 'light', Dark: 'dark'} as const;
export const HeaderActionVariant = {
    Primary: 'primary',
    Normal: 'normal',
    Link: 'link',
} as const;

export type HeaderFormatValue = (typeof HeaderFormat)[keyof typeof HeaderFormat];
export type HeaderEdgesValue = (typeof HeaderEdges)[keyof typeof HeaderEdges];
export type HeaderLayoutValue = (typeof HeaderLayout)[keyof typeof HeaderLayout];
export type HeaderBackgroundValue = (typeof HeaderBackground)[keyof typeof HeaderBackground];
export type HeaderBorderValue = (typeof HeaderBorder)[keyof typeof HeaderBorder];
export type HeaderTextColorValue = (typeof HeaderTextColor)[keyof typeof HeaderTextColor];
export type HeaderActionVariantValue =
    (typeof HeaderActionVariant)[keyof typeof HeaderActionVariant];

/**
 * Словарь заливок: один шаг на оттенок, чтобы сво́тчи различались с одного взгляда. Значение —
 * имя, не цвет: документ переживает смену темы без миграции разметки. Ключи совпадают
 * с `$header-fills` в `src/styles/yc-header-fill.scss`.
 */
export const HEADER_FILL_SWATCHES = [
    {value: 'grey', i18nKey: 'fill.grey'},
    {value: 'blue', i18nKey: 'fill.blue'},
    {value: 'green', i18nKey: 'fill.green'},
    {value: 'yellow', i18nKey: 'fill.yellow'},
    {value: 'orange', i18nKey: 'fill.orange'},
    {value: 'red', i18nKey: 'fill.red'},
    {value: 'purple', i18nKey: 'fill.purple'},
    {value: 'contrast', i18nKey: 'fill.contrast'},
] as const;

export type HeaderFillValue = (typeof HEADER_FILL_SWATCHES)[number]['value'];

export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Large,
    [HeaderAttr.Edges]: HeaderEdges.Rounded,
    [HeaderAttr.Layout]: HeaderLayout.Cover,
    [HeaderAttr.Background]: HeaderBackground.Fill,
    [HeaderAttr.Fill]: 'blue',
    [HeaderAttr.Text]: HeaderTextColor.Auto,
    [HeaderAttr.Image]: '',
    [HeaderAttr.Border]: HeaderBorder.None,
} as const;

export const HeaderActionDefaults = {
    [HeaderActionAttr.Href]: '',
    [HeaderActionAttr.Variant]: HeaderActionVariant.Primary,
} as const;

/** Больше двух CTA в hero-блоке — визуальный шум; ограничение разделяют схема, команды и тулбар. */
export const MAX_HEADER_ACTIONS = 2;

export const HeaderClassName = {
    Header: 'g-md-header',
    Content: 'g-md-header-content',
    Title: 'g-md-header-title',
    Subtitle: 'g-md-header-subtitle',
    Actions: 'g-md-header-actions',
    Action: 'g-md-header-action',
} as const;
