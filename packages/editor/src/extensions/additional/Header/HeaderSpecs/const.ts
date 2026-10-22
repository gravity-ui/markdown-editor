import {nodeTypeFactory} from 'src/utils/schema';

export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';
export const headerTitleName = 'header_title';
export const headerContentName = 'header_content';
export const headerActionsName = 'header_actions';
export const headerImageName = 'header_image';
export const headerType = nodeTypeFactory(headerNodeName);

export const HeaderAttr = {
    Height: 'height',
    Width: 'width',
    Align: 'align',
    Vertical: 'vertical',
    Title: 'title',
    Description: 'description',
    Fill: 'fill',
    Shapes: 'shapes',
    Effect: 'effect',
    Image: 'image',
    ImageEnabled: 'image-enabled',
    ImageName: 'image-name',
    Text: 'text',
    BackgroundImageTheme: 'bg-image-theme',
} as const;
export const HeaderImageTheme = {System: 'system', Light: 'light', Dark: 'dark'} as const;
export const HeaderShapes = {
    None: 'none',
    Diagonal: 'diagonal',
    Corner: 'corner',
    Edges: 'edges',
    Bottom: 'bottom',
    Scatter: 'scatter',
} as const;
export const HeaderEffect = {None: 'none', Blur: 'blur'} as const;
export const HEADER_FILLS = [
    'grey',
    'yellow-light',
    'red-light',
    'purple-light',
    'blue-light',
    'green-light',
    'yellow',
    'red',
    'purple',
    'blue',
    'green',
] as const;
export type HeaderFillValue = (typeof HEADER_FILLS)[number];
export const HeaderDefaults = {
    height: 's',
    width: 'm',
    align: 'left',
    vertical: 'center',
    title: 'true',
    description: 'true',
    fill: 'none',
    shapes: 'none',
    effect: 'none',
    image: '',
    'image-enabled': 'true',
    'image-name': '',
    text: 'auto',
    'bg-image-theme': 'system',
} as const;
export const HeaderImageDefaults = {src: '', alt: '', name: '', enabled: 'false'};
export const HeaderClassName = {
    Root: 'g-md-header',
    Decor: 'g-md-header__decor',
    Shape: 'g-md-header__shape',
    Content: 'g-md-header__content',
    Title: 'g-md-header__title',
    Body: 'header_content',
    Actions: 'header_actions',
    Media: 'g-md-header__media',
    Image: 'g-md-header__image',
} as const;
