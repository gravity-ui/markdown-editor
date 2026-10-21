import {nodeTypeFactory} from 'src/utils/schema';

export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';
export const headerTitleName = 'header_title';
export const headerContentName = 'header_content';
export const headerActionsName = 'header_actions';

export const headerType = nodeTypeFactory(headerNodeName);

/** Порядок повторяет порядок сериализации: так таблицу атрибутов проще сверять с разметкой. */
export const HeaderAttr = {
    Format: 'format',
    Align: 'align',
    Vertical: 'vertical',
    Fixed: 'fixed',
    Title: 'title',
    Description: 'description',
    Background: 'bg',
    Fill: 'fill',
    Fill2: 'fill2',
    Direction: 'direction',
    Shapes: 'shapes',
    Scale: 'scale',
    Effect: 'effect',
    Image: 'image',
    ImageEnabled: 'image-enabled',
    ImageName: 'image-name',
    Layer: 'layer',
    Fit: 'fit',
    Focus: 'focus',
    Text: 'text',
    BackgroundImageTheme: 'bg-image-theme',
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

/** Какой слой занимает файл автора: нижний на всю площадь, объект поверх основы, повтор поверх основы. */
export const HeaderLayer = {
    Full: 'full',
    Left: 'left',
    Right: 'right',
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

export const HeaderImageTheme = {System: 'system', Light: 'light', Dark: 'dark'} as const;

export const HeaderText = {
    Gray: 'gray',
    Orange: 'orange',
    Violet: 'violet',
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

/** Порядок задаёт и палитру тулбара, и выбор цвета генератором. Синхронно с `$header-fills` в fills.scss. */
export const HEADER_FILLS: readonly HeaderFillValue[] = [
    HeaderFill.YellowLight,
    HeaderFill.RedLight,
    HeaderFill.PurpleLight,
    HeaderFill.BlueLight,
    HeaderFill.GreenLight,
    HeaderFill.Grey,
    HeaderFill.Yellow,
    HeaderFill.Red,
    HeaderFill.Purple,
    HeaderFill.Blue,
    HeaderFill.Green,
];

/** Полный оборот: угол приводится по модулю, потому что 523° и 163° — один и тот же наклон. */
export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Medium,
    [HeaderAttr.Align]: 'left',
    [HeaderAttr.Vertical]: 'center',
    [HeaderAttr.Fixed]: 'true',
    [HeaderAttr.Title]: 'true',
    [HeaderAttr.Description]: 'true',
    [HeaderAttr.Background]: HeaderBackground.Shapes,
    [HeaderAttr.Fill]: HeaderFill.Blue,
    [HeaderAttr.Fill2]: HeaderFill.Purple,
    [HeaderAttr.Direction]: HeaderDirection.Diagonal,
    [HeaderAttr.Shapes]: HeaderShapes.Diagonal,
    [HeaderAttr.Scale]: HeaderScale.Medium,
    [HeaderAttr.Effect]: HeaderEffect.None,
    [HeaderAttr.Image]: '',
    [HeaderAttr.ImageEnabled]: 'true',
    [HeaderAttr.ImageName]: '',
    [HeaderAttr.Layer]: HeaderLayer.Full,
    [HeaderAttr.Fit]: HeaderFit.Crop,
    [HeaderAttr.Focus]: HeaderFocus.Center,
    [HeaderAttr.Text]: HeaderText.Auto,
    [HeaderAttr.BackgroundImageTheme]: HeaderImageTheme.System,
} as const;

export const HeaderClassName = {
    Root: 'g-md-header',
    Decor: 'g-md-header__decor',
    Shape: 'g-md-header__shape',
    Content: 'g-md-header__content',
    Title: 'g-md-header__title',
    Actions: 'g-md-header__actions',
} as const;
