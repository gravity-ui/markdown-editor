import {nodeTypeFactory} from 'src/utils/schema';

export const headerDirectiveName = 'header-block';
export const HeaderSlotDirective = {
    Title: 'header-title',
    Description: 'header-description',
    Action: 'header-action',
} as const;

export const HeaderNode = {
    Header: 'header_block',
    Title: 'header_block_title',
    Description: 'header_block_description',
    Actions: 'header_block_actions',
    Action: 'header_block_action',
} as const;
export type HeaderNodeName = (typeof HeaderNode)[keyof typeof HeaderNode];

export const headerType = nodeTypeFactory(HeaderNode.Header);
export const headerTitleType = nodeTypeFactory(HeaderNode.Title);
export const headerDescriptionType = nodeTypeFactory(HeaderNode.Description);
export const headerActionsType = nodeTypeFactory(HeaderNode.Actions);
export const headerActionType = nodeTypeFactory(HeaderNode.Action);

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
    Type: 'type',
    Href: 'href',
    Color: 'color',
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
export const HeaderActionType = {Button: 'button', Link: 'link'} as const;

export type HeaderFormatValue = (typeof HeaderFormat)[keyof typeof HeaderFormat];
export type HeaderEdgesValue = (typeof HeaderEdges)[keyof typeof HeaderEdges];
export type HeaderLayoutValue = (typeof HeaderLayout)[keyof typeof HeaderLayout];
export type HeaderBackgroundValue = (typeof HeaderBackground)[keyof typeof HeaderBackground];
export type HeaderBorderValue = (typeof HeaderBorder)[keyof typeof HeaderBorder];
export type HeaderTextColorValue = (typeof HeaderTextColor)[keyof typeof HeaderTextColor];
export type HeaderActionTypeValue = (typeof HeaderActionType)[keyof typeof HeaderActionType];

/** Keep values in sync with $header-fills in styles/yc-header-fill.scss. */
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
export type HeaderActionColorValue = 'brand' | HeaderFillValue;

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
    [HeaderActionAttr.Type]: HeaderActionType.Button,
    [HeaderActionAttr.Href]: '',
    [HeaderActionAttr.Color]: 'brand',
} as const;

export const MAX_HEADER_ACTIONS = 2;

export const HeaderClassName = {
    Header: 'g-md-header',
    Content: 'g-md-header-content',
    Title: 'g-md-header-title',
    Description: 'g-md-header-description',
    Actions: 'g-md-header-actions',
    Action: 'g-md-header-action',
} as const;
