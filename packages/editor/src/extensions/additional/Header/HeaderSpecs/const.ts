import {nodeTypeFactory} from 'src/utils/schema';

export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';

export const headerType = nodeTypeFactory(headerNodeName);

/** Порядок повторяет порядок сериализации: так таблицу атрибутов проще сверять с разметкой. */
export const HeaderAttr = {
    Format: 'format',
    Background: 'bg',
    Fill: 'fill',
    Fill2: 'fill2',
    Angle: 'angle',
    Effect: 'effect',
    Image: 'image',
    Layer: 'layer',
    Fit: 'fit',
    Crop: 'crop',
    Step: 'step',
    Text: 'text',
    Seed: 'seed',
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
    Cover: 'cover',
    Decor: 'decor',
    Tile: 'tile',
} as const;

/** Масштаб кадра. */
export const HeaderFit = {
    Cover: 'cover',
    Contain: 'contain',
    Width: 'width',
    Height: 'height',
} as const;

/** Положение кадра. */
export const HeaderCrop = {
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
    Dim: 'dim',
    Gradient: 'gradient',
} as const;

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
export type HeaderCropValue = (typeof HeaderCrop)[keyof typeof HeaderCrop];
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
export const HEADER_FULL_TURN = 360;
export const HEADER_STEP_MIN = 4;
export const HEADER_STEP_MAX = 512;

export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Large,
    [HeaderAttr.Background]: HeaderBackground.Shapes,
    [HeaderAttr.Fill]: HeaderFill.Blue,
    [HeaderAttr.Fill2]: HeaderFill.Purple,
    [HeaderAttr.Angle]: 163,
    [HeaderAttr.Effect]: HeaderEffect.None,
    [HeaderAttr.Image]: '',
    [HeaderAttr.Layer]: HeaderLayer.Cover,
    [HeaderAttr.Fit]: HeaderFit.Cover,
    [HeaderAttr.Crop]: HeaderCrop.Center,
    [HeaderAttr.Step]: 32,
    [HeaderAttr.Text]: HeaderText.Auto,
    [HeaderAttr.Seed]: 0,
} as const;

export const HeaderClassName = {
    Root: 'g-md-header',
    Decor: 'g-md-header__decor',
    Shape: 'g-md-header__shape',
    Content: 'g-md-header__content',
    Title: 'g-md-header__title',
} as const;
