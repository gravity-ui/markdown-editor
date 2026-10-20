export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';
export const headerMarkupAttr = 'markup';

export const HeaderSlot = {
    Title: 'header-title',
    Content: 'header-content',
    Image: 'header-image',
    Actions: 'header-actions',
} as const;

export const headerActionName = 'action';

/** Токены превью, из которых собирается HTML блока. */
export const HeaderToken = {
    Text: 'header_text',
    Title: 'header_title',
    Body: 'header_body',
    Actions: 'header_actions',
    Action: 'header_action',
    Image: 'header_image',
} as const;

/** Порядок повторяет порядок сериализации: так таблицу атрибутов проще сверять с разметкой. */
export const HeaderAttr = {
    Format: 'format',
    Align: 'align',
    Vertical: 'vertical',
    Fixed: 'fixed',
    Background: 'bg',
    Fill: 'fill',
    Fill2: 'fill2',
    Direction: 'direction',
    Shapes: 'shapes',
    Scale: 'scale',
    Image: 'image',
    Layer: 'layer',
    Fit: 'fit',
    Focus: 'focus',
    Effect: 'effect',
    Text: 'text',
} as const;

export const HeaderFormat = {
    Large: 'large',
    Medium: 'medium',
    Small: 'small',
} as const;

/** Слой фона: рисуется сам по себе, а под изображением на всю площадь остаётся скрытым. */
export const HeaderBackground = {
    Surface: 'surface',
    Fill: 'fill',
    Shapes: 'shapes',
    Gradient: 'gradient',
    Mesh: 'mesh',
    Pattern: 'pattern',
} as const;

/** Какой слой занимает фоновое изображение: нижний на всю площадь, объект поверх основы, повтор поверх основы. */
export const HeaderLayer = {
    Full: 'full',
    Object: 'object',
    Tile: 'tile',
} as const;

/** Масштаб кадра. */
export const HeaderFit = {
    Crop: 'crop',
    Whole: 'whole',
} as const;

/** Положение кадра. */
export const HeaderFocus = {
    Center: 'center',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
    TopLeft: 'top-left',
    TopRight: 'top-right',
    BottomRight: 'bottom-right',
    BottomLeft: 'bottom-left',
} as const;

/** Слой поверх изображения. */
export const HeaderEffect = {
    None: 'none',
    Blur: 'blur',
    Darken: 'darken',
    Fade: 'fade',
} as const;

export const HeaderDirection = {Diagonal: 'diagonal', Right: 'right', Down: 'down'} as const;
export const HeaderShapes = {
    Diagonal: 'diagonal',
    Corner: 'corner',
    Edges: 'edges',
    Bottom: 'bottom',
    Scatter: 'scatter',
} as const;
export const HeaderScale = {Small: 'small', Medium: 'medium', Large: 'large'} as const;

export const HeaderText = {
    Auto: 'auto',
    Light: 'light',
    Dark: 'dark',
    Primary: 'primary',
    Brand: 'brand',
    Blue: 'blue',
    Grey: 'grey',
    YellowLight: 'yellow-light',
    Yellow: 'yellow',
    RedLight: 'red-light',
    Red: 'red',
    PurpleLight: 'purple-light',
    Purple: 'purple',
    BlueLight: 'blue-light',
    GreenLight: 'green-light',
    Green: 'green',
} as const;

export const HeaderFill = {
    Grey: 'grey',
    YellowLight: 'yellow-light',
    RedLight: 'red-light',
    PurpleLight: 'purple-light',
    BlueLight: 'blue-light',
    GreenLight: 'green-light',
    Blue: 'blue',
    Indigo: 'indigo',
    Purple: 'purple',
    Violet: 'violet',
    Teal: 'teal',
    Green: 'green',
    Sky: 'sky',
    LightBlue: 'light-blue',
    Amber: 'amber',
    Yellow: 'yellow',
    Sand: 'sand',
    Red: 'red',
    Navy: 'navy',
} as const;

/** Сторона изображения-содержимого относительно текста. */
export const HeaderSide = {Left: 'left', Right: 'right'} as const;

export const HeaderActionType = {Button: 'button', Link: 'link'} as const;
export const HeaderActionColor = {Default: 'default', Brand: 'brand'} as const;

export const HEADER_TITLE_SIZES = ['1', '2', '3', '4', '5', '6'] as const;
export const HEADER_MAX_ACTIONS = 3;

export type HeaderFormatValue = (typeof HeaderFormat)[keyof typeof HeaderFormat];
export type HeaderBackgroundValue = (typeof HeaderBackground)[keyof typeof HeaderBackground];
export type HeaderLayerValue = (typeof HeaderLayer)[keyof typeof HeaderLayer];
export type HeaderFitValue = (typeof HeaderFit)[keyof typeof HeaderFit];
export type HeaderFocusValue = (typeof HeaderFocus)[keyof typeof HeaderFocus];
export type HeaderDirectionValue = (typeof HeaderDirection)[keyof typeof HeaderDirection];
export type HeaderShapesValue = (typeof HeaderShapes)[keyof typeof HeaderShapes];
export type HeaderScaleValue = (typeof HeaderScale)[keyof typeof HeaderScale];
export type HeaderEffectValue = (typeof HeaderEffect)[keyof typeof HeaderEffect];
export type HeaderTextValue = (typeof HeaderText)[keyof typeof HeaderText];
export type HeaderFillValue = (typeof HeaderFill)[keyof typeof HeaderFill];
export type HeaderSideValue = (typeof HeaderSide)[keyof typeof HeaderSide];
export type HeaderActionTypeValue = (typeof HeaderActionType)[keyof typeof HeaderActionType];
export type HeaderActionColorValue = (typeof HeaderActionColor)[keyof typeof HeaderActionColor];

export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Medium,
    [HeaderAttr.Align]: 'left',
    [HeaderAttr.Vertical]: 'center',
    [HeaderAttr.Fixed]: 'true',
    [HeaderAttr.Background]: HeaderBackground.Shapes,
    [HeaderAttr.Fill]: HeaderFill.Blue,
    [HeaderAttr.Fill2]: HeaderFill.Purple,
    [HeaderAttr.Direction]: HeaderDirection.Diagonal,
    [HeaderAttr.Shapes]: HeaderShapes.Diagonal,
    [HeaderAttr.Scale]: HeaderScale.Medium,
    [HeaderAttr.Effect]: HeaderEffect.None,
    [HeaderAttr.Image]: '',
    [HeaderAttr.Layer]: HeaderLayer.Full,
    [HeaderAttr.Fit]: HeaderFit.Crop,
    [HeaderAttr.Focus]: HeaderFocus.Center,
    [HeaderAttr.Text]: HeaderText.Auto,
} as const;

export const HeaderClassName = {
    Root: 'g-md-header',
    Decor: 'g-md-header__decor',
    Shape: 'g-md-header__shape',
    Content: 'g-md-header__content',
    Text: 'g-md-header__text',
    Title: 'g-md-header__title',
    Body: 'g-md-header__body',
    Actions: 'g-md-header__actions',
    Action: 'g-md-header__action',
    Media: 'g-md-header__media',
    Image: 'g-md-header__image',
    Stub: 'g-md-header-stub',
    StubMessage: 'g-md-header-stub__message',
    StubMarkup: 'g-md-header-stub__markup',
} as const;
