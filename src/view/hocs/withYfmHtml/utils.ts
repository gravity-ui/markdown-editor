const YfmHtmlStyles = {
    colorTextPrimary: '--yfm-html-color-text-primary', // Color of the primary text
    colorTextSecondary: '--yfm-html-color-text-secondary', // Color of the secondary text

    colorBackground: '--yfm-html-color-background', // Color of the background
    colorBackgroundSecondary: '--yfm-html-color-background-secondary', // Color of the secondary background

    colorLink: '--yfm-html-color-link', // Color of the link
    colorLinkHover: '--yfm-html-color-link-hover', // Color of the link when hovered
    colorLinkVisited: '--yfm-html-color-link-visited', // Color of the visited link

    font: '--yfm-html-font', // Font for the text
    fontSize: '--yfm-html-font-size', // Size of the text
    fontFamily: '--yfm-html-font-family', // Family of the text
    lineHeight: '--yfm-html-line-height', // Line height of the text
};

type Styles = Partial<Record<keyof typeof YfmHtmlStyles, string>>;

export const getYfmHtmlCssVariables = ({
    colorTextPrimary,
    colorTextSecondary,
    colorBackground,
    colorBackgroundSecondary,
    colorLink,
    colorLinkHover,
    colorLinkVisited,
    font,
    fontSize,
    fontFamily,
    lineHeight,
}: Styles) => ({
    ...(colorTextPrimary && {[YfmHtmlStyles.colorTextPrimary]: colorTextPrimary}),
    ...(colorTextSecondary && {[YfmHtmlStyles.colorTextSecondary]: colorTextSecondary}),
    ...(colorBackground && {[YfmHtmlStyles.colorBackground]: colorBackground}),
    ...(colorBackgroundSecondary && {
        [YfmHtmlStyles.colorBackgroundSecondary]: colorBackgroundSecondary,
    }),
    ...(colorLink && {[YfmHtmlStyles.colorLink]: colorLink}),
    ...(colorLinkHover && {[YfmHtmlStyles.colorLinkHover]: colorLinkHover}),
    ...(colorLinkVisited && {[YfmHtmlStyles.colorLinkVisited]: colorLinkVisited}),
    ...(font && {[YfmHtmlStyles.font]: font}),
    ...(fontSize && {[YfmHtmlStyles.fontSize]: fontSize}),
    ...(fontFamily && {[YfmHtmlStyles.fontFamily]: fontFamily}),
    ...(lineHeight && {[YfmHtmlStyles.lineHeight]: lineHeight}),
});
