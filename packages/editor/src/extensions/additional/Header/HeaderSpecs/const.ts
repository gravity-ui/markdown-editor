export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';
export const headerMarkupAttr = 'markup';

export const headerImageName = 'image';
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
    Edges: 'edges',
    Fixed: 'fixed',
    Align: 'align',
    Vertical: 'vertical',
    Border: 'border',
    Background: 'bg',
    /** Адрес фонового изображения. В разметке его задаёт `bg`, отдельного параметра нет. */
    Image: 'image',
    Layout: 'layout',
    Fit: 'fit',
    Focus: 'focus',
    Fill: 'fill',
    Fill2: 'fill2',
    Decor: 'decor',
    Direction: 'direction',
    Shape: 'shape',
    Text: 'text',
} as const;

export const HeaderFormat = {Small: 'small', Medium: 'medium', Large: 'large'} as const;
export const HeaderEdges = {Rounded: 'rounded', Bleed: 'bleed'} as const;
export const HeaderAlign = {Left: 'left', Center: 'center', Right: 'right'} as const;
export const HeaderVertical = {Top: 'top', Center: 'center', Bottom: 'bottom'} as const;
export const HeaderBorder = {
    None: 'none',
    Solid: 'solid',
    Dashed: 'dashed',
    Dotted: 'dotted',
} as const;

/** Фон: заливка `fill` или фоновое изображение. В разметке вместо `image` в `bg` пишется адрес. */
export const HeaderBackground = {Fill: 'fill', Image: 'image'} as const;

/** Раскладка фонового изображения: на всю площадь или объектом внутри отступов. */
export const HeaderLayout = {Cover: 'cover', Object: 'object'} as const;

/** Масштаб кадра. */
export const HeaderFit = {Crop: 'crop', Whole: 'whole'} as const;

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

/** Дополнительный слой поверх фона: и поверх заливки, и поверх изображения. */
export const HeaderDecor = {
    None: 'none',
    Darken: 'darken',
    Lighten: 'lighten',
    Blur: 'blur',
    Gradient: 'gradient',
    Mesh: 'mesh',
    Shapes: 'shapes',
} as const;

export const HeaderDirection = {Diagonal: 'diagonal', Right: 'right', Down: 'down'} as const;

/** Раскладка фигур слоёв `mesh` и `shapes`. */
export const HeaderShape = {
    Diagonal: 'diagonal',
    Corner: 'corner',
    Edges: 'edges',
    Bottom: 'bottom',
    Scatter: 'scatter',
} as const;

/** Значение без цвета: цвет приходит из темы. */
export const HEADER_SYSTEM_COLOR = 'system';

/** Палитра заливки ячеек таблицы, `$cell-bg-colors` в `yc-table-cell-bg.scss`. */
export const HeaderPalette = {
    Grey: 'grey',
    YellowLight: 'yellow-light',
    Yellow: 'yellow',
    RedLight: 'red-light',
    Red: 'red',
    PurpleLight: 'purple-light',
    Purple: 'purple',
    BlueLight: 'blue-light',
    Blue: 'blue',
    GreenLight: 'green-light',
    Green: 'green',
} as const;

export const HeaderFill = {System: HEADER_SYSTEM_COLOR, ...HeaderPalette} as const;

/** Цвета текста — переменные `--g-color-text-*`. У светлых оттенков палитры таких переменных нет. */
export const HeaderText = {
    System: HEADER_SYSTEM_COLOR,
    Grey: 'grey',
    Yellow: 'yellow',
    Red: 'red',
    Purple: 'purple',
    Blue: 'blue',
    Green: 'green',
} as const;

/** Сторона изображения-содержимого относительно текста. */
export const HeaderSide = {Left: 'left', Right: 'right'} as const;

export const HeaderActionType = {Button: 'button', Link: 'link'} as const;
export const HeaderActionColor = HeaderFill;

/** Параметр контейнера с уровнем заголовка блока. В модель параметров он не входит: на корне HTML его нет. */
export const HEADER_TITLE_LEVEL_ATTR = 'h';
export const HEADER_TITLE_LEVELS = ['1', '2', '3', '4', '5', '6'] as const;
export const HEADER_MAX_ACTIONS = 3;

type ValueOf<T> = T[keyof T];

export type HeaderFitValue = ValueOf<typeof HeaderFit>;
export type HeaderFocusValue = ValueOf<typeof HeaderFocus>;
export type HeaderSideValue = ValueOf<typeof HeaderSide>;
export type HeaderActionTypeValue = ValueOf<typeof HeaderActionType>;
export type HeaderActionColorValue = ValueOf<typeof HeaderActionColor>;

export const HeaderDefaults = {
    [HeaderAttr.Format]: HeaderFormat.Medium,
    [HeaderAttr.Edges]: HeaderEdges.Rounded,
    [HeaderAttr.Fixed]: 'true',
    [HeaderAttr.Align]: HeaderAlign.Left,
    [HeaderAttr.Vertical]: HeaderVertical.Center,
    [HeaderAttr.Border]: HeaderBorder.None,
    [HeaderAttr.Background]: HeaderBackground.Fill,
    [HeaderAttr.Image]: '',
    [HeaderAttr.Layout]: HeaderLayout.Cover,
    [HeaderAttr.Fit]: HeaderFit.Crop,
    [HeaderAttr.Focus]: HeaderFocus.Center,
    [HeaderAttr.Fill]: HeaderFill.System,
    [HeaderAttr.Fill2]: HeaderPalette.Blue,
    [HeaderAttr.Decor]: HeaderDecor.None,
    [HeaderAttr.Direction]: HeaderDirection.Diagonal,
    [HeaderAttr.Shape]: HeaderShape.Diagonal,
    [HeaderAttr.Text]: HeaderText.System,
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
