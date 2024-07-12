import {ForEachCallback} from '@diplodoc/html-extension/react/useDiplodocHtml';
import {IHtmlController} from '@diplodoc/html-extension/runtime';

export type RealTheme = 'light' | 'light-hc' | 'dark' | 'dark-hc' | (string & {});
type Colors = Partial<Record<keyof typeof YfmHtmlColors, string>>;

const YfmHtmlColors = {
    colorTextPrimary: '--yfm-html-color-text-primary', // Цвет основного текста
    colorTextSecondary: '--yfm-html-color-text-secondary', // Цвет вторичного текста

    colorBackground: '--yfm-html-color-background', // Цвет фона
    colorBackgroundSecondary: '--yfm-html-color-background-secondary', // Цвет вторичного фона

    colorLink: '--yfm-html-color-link', // Цвет ссылки
    colorLinkHover: '--yfm-html-color-link-hover', // Цвет ссылки при наведении
    colorLinkVisited: '--yfm-html-color-link-visited', // Цвет посещенной ссылки

    colorButton: '--yfm-html-color-button', // Цвет кнопок
    colorButtonHover: '--yfm-html-color-button-hover', // Цвет кнопок при наведении
    colorButtonActive: '--yfm-html-color-button-active', // Цвет кнопок в активном состоянии (при нажатии)
    colorButtonDisabled: '--yfm-html-color-button-disabled', // Цвет неактивных кнопок

    colorInputBorder: '--yfm-html-color-input-border', // Цвет границ инпутов
    colorInputBackground: '--yfm-html-color-input-background', // Цвет фона инпутов
};

export const getYfmHtmlCssVariables = ({
    colorTextPrimary,
    colorTextSecondary,
    colorBackground,
    colorBackgroundSecondary,
    colorLink,
    colorLinkHover,
    colorLinkVisited,
    colorButton,
    colorButtonHover,
    colorButtonActive,
    colorButtonDisabled,
    colorInputBorder,
    colorInputBackground,
}: Colors) => ({
    ...(colorTextPrimary && {[YfmHtmlColors.colorTextPrimary]: colorTextPrimary}),
    ...(colorTextSecondary && {[YfmHtmlColors.colorTextSecondary]: colorTextSecondary}),
    ...(colorBackground && {[YfmHtmlColors.colorBackground]: colorBackground}),
    ...(colorBackgroundSecondary && {
        [YfmHtmlColors.colorBackgroundSecondary]: colorBackgroundSecondary,
    }),
    ...(colorLink && {[YfmHtmlColors.colorLink]: colorLink}),
    ...(colorLinkHover && {[YfmHtmlColors.colorLinkHover]: colorLinkHover}),
    ...(colorLinkVisited && {[YfmHtmlColors.colorLinkVisited]: colorLinkVisited}),
    ...(colorButton && {[YfmHtmlColors.colorButton]: colorButton}),
    ...(colorButtonHover && {[YfmHtmlColors.colorButtonHover]: colorButtonHover}),
    ...(colorButtonActive && {[YfmHtmlColors.colorButtonActive]: colorButtonActive}),
    ...(colorButtonDisabled && {[YfmHtmlColors.colorButtonDisabled]: colorButtonDisabled}),
    ...(colorInputBorder && {[YfmHtmlColors.colorInputBorder]: colorInputBorder}),
    ...(colorInputBackground && {[YfmHtmlColors.colorInputBackground]: colorInputBackground}),
});

export const setYfmHtmlColors = (controller: IHtmlController, colors: Colors) => {
    const callback: ForEachCallback = (iframeController) => {
        iframeController.setStyles(getYfmHtmlCssVariables(colors));
    };
    controller.forEach(callback);
};

export const setIFrameTheme = (iframe: HTMLIFrameElement, theme: RealTheme): void => {
    const body = iframe.contentDocument?.body;

    if (body) {
        body.classList.remove('dark');
        body.classList.remove('light');
        body.classList.remove('dark-hc');
        body.classList.remove('light-hc');

        body.classList.add(theme);
    }
};

export const setYfmHtmlTheme = (controller: IHtmlController, theme: RealTheme) => {
    const callback: ForEachCallback = (iframeController) => {
        setIFrameTheme(iframeController.block, theme);
    };
    controller.forEach(callback);
};
