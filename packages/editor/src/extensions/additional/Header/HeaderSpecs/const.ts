import {nodeTypeFactory} from 'src/utils/schema';

export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';

export const headerType = nodeTypeFactory(headerNodeName);

export const HeaderAttr = {
    Format: 'format',
    Background: 'bg',
    Fill: 'fill',
    Fill2: 'fill2',
    Effect: 'effect',
    Image: 'image',
    Text: 'text',
    Seed: 'seed',
} as const;

export const HeaderFormat = {
    Large: 'large',
    Small: 'small',
} as const;

/** Слой фона: рисуется сам по себе, а под изображением остаётся скрытым. */
export const HeaderBackground = {
    Fill: 'fill',
    Shapes: 'shapes',
    Gradient: 'gradient',
    Mesh: 'mesh',
    Pattern: 'pattern',
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

export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Large,
    [HeaderAttr.Background]: HeaderBackground.Shapes,
    [HeaderAttr.Fill]: HeaderFill.Blue,
    [HeaderAttr.Fill2]: HeaderFill.Purple,
    [HeaderAttr.Effect]: HeaderEffect.None,
    [HeaderAttr.Image]: '',
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
