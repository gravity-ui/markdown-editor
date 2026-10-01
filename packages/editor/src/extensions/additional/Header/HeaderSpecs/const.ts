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
    Background: 'bg',
    Fill: 'fill',
    Fill2: 'fill2',
    Direction: 'direction',
    Shapes: 'shapes',
    Scale: 'scale',
    Effect: 'effect',
    Image: 'image',
    Layer: 'layer',
    Fit: 'fit',
    Focus: 'focus',
    Text: 'text',
} as const;

export const HeaderFormat = {
    Large: 'large',
    Small: 'small',
} as const;

/** Слой фона: рисуется сам по себе, а под изображением на всю площадь остаётся скрытым. */
export const HeaderBackground = {
    Fill: 'fill',
    Shapes: 'shapes',
    Gradient: 'gradient',
    Mesh: 'mesh',
    Pattern: 'pattern',
} as const;

/** Какой слой занимает файл автора: нижний на всю площадь, объект поверх основы, повтор поверх основы. */
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
} as const;

export const HeaderFill = {
    Blue: 'blue',
    Indigo: 'indigo',
    Purple: 'purple',
    Violet: 'violet',
    Teal: 'teal',
    Green: 'green',
    Sky: 'sky',
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
    HeaderFill.Blue,
    HeaderFill.Indigo,
    HeaderFill.Purple,
    HeaderFill.Violet,
    HeaderFill.Teal,
    HeaderFill.Green,
    HeaderFill.Sky,
    HeaderFill.Amber,
    HeaderFill.Yellow,
    HeaderFill.Sand,
    HeaderFill.Red,
    HeaderFill.Navy,
];

/** Полный оборот: угол приводится по модулю, потому что 523° и 163° — один и тот же наклон. */
export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Large,
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
    Title: 'g-md-header__title',
    Actions: 'g-md-header__actions',
} as const;
