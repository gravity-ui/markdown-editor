const cssVariables = {
    colorTextPrimary: '--yfm-html-color-text-primary',
    colorTextSecondary: '--yfm-html-color-text-secondary',
    colorBackground: '--yfm-html-color-background',
    colorBackgroundSecondary: '--yfm-html-color-background-secondary',
    colorLink: '--yfm-html-color-link',
    colorLinkHover: '--yfm-html-color-link-hover',
    colorLinkVisited: '--yfm-html-color-link-visited',
    font: '--yfm-html-font',
    fontSize: '--yfm-html-font-size',
    fontFamily: '--yfm-html-font-family',
    lineHeight: '--yfm-html-line-height',
} as const;

type Styles = Partial<Record<keyof typeof cssVariables, string>>;

export function toIframeCssVariables(styles: Styles): Record<string, string> {
    const result: Record<string, string> = {};

    for (const key of Object.keys(cssVariables) as (keyof typeof cssVariables)[]) {
        const value = styles[key];
        if (value !== undefined) result[cssVariables[key]] = value;
    }

    return result;
}
