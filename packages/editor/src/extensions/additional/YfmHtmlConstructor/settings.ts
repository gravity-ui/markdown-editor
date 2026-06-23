import type {HtmlConstructorTemplateSettings} from './types';

export const defaultHtmlConstructorTemplateSettings = (): HtmlConstructorTemplateSettings => ({
    hasBackground: false,
    hasRound: false,
    hasBorder: false,
    hasTextColor: false,
    hasDelete: false,
    hasRaw: false,
    preset: 'default',
});

const allControls = {
    hasBackground: true,
    hasRound: true,
    hasBorder: true,
    hasTextColor: true,
    hasDelete: true,
    hasRaw: true,
};

const noControls = {
    hasBackground: false,
    hasRound: false,
    hasBorder: false,
    hasTextColor: false,
    hasDelete: false,
    hasRaw: false,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const normalizeHtmlConstructorTemplateSettings = (
    value: unknown,
): HtmlConstructorTemplateSettings | undefined => {
    if (!isObject(value)) return undefined;

    const preset = value.preset;
    if (preset !== 'default' && preset !== 'none' && preset !== 'disabled') return undefined;

    return {
        hasBackground: value.hasBackground === true,
        hasRound: value.hasRound === true,
        hasBorder: value.hasBorder === true,
        hasTextColor: value.hasTextColor === true,
        hasDelete: value.hasDelete === true,
        hasRaw: value.hasRaw === true,
        preset,
    };
};

export const getEnabledHtmlConstructorSettings = (
    settings: HtmlConstructorTemplateSettings | undefined,
) => {
    if (!settings || settings.preset === 'default') return allControls;
    if (settings.preset === 'disabled') return noControls;

    return {
        hasBackground: settings.hasBackground,
        hasRound: settings.hasRound,
        hasBorder: settings.hasBorder,
        hasTextColor: settings.hasTextColor,
        hasDelete: settings.hasDelete,
        hasRaw: settings.hasRaw,
    };
};
