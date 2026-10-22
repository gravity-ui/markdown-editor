import {
    BUTTON_DEFAULT_VIEW,
    ButtonAttr,
    type ButtonColor,
    ButtonView,
    buttonActionClassName,
    buttonViewColors,
} from './const';

const views = new Set<unknown>(Object.values(ButtonView));

const isButtonView = (value: unknown): value is ButtonView => views.has(value);

export type ButtonStyle = {view: ButtonView; color: ButtonColor};

/** Неизвестный вид заменяется акцентным, недоступный виду цвет — первым цветом вида. */
export const normalizeButtonStyle = (view: unknown, color: unknown): ButtonStyle => {
    const normalizedView = isButtonView(view) ? view : BUTTON_DEFAULT_VIEW;
    const colors = buttonViewColors[normalizedView];
    return {
        view: normalizedView,
        color: colors.find((item) => item === color) ?? colors[0],
    };
};

export const buttonViewDataAttr = `data-${ButtonAttr.View}`;
export const buttonColorDataAttr = `data-${ButtonAttr.Color}`;

/** Атрибуты DOM кнопки, общие для превью и ВИЗИВИГ. */
export const buttonActionDomAttrs = ({view, color}: ButtonStyle) => ({
    class: buttonActionClassName,
    [buttonViewDataAttr]: view,
    [buttonColorDataAttr]: color,
});
