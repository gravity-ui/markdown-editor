export const headerBgColorFamilies = ['gray', 'green', 'yellow', 'blue', 'red', 'violet'] as const;
export const headerBgColorSaturations = ['light', 'medium', 'heavy'] as const;
export type HeaderBgColorFamily = (typeof headerBgColorFamilies)[number];
export type HeaderBgColorSaturation = (typeof headerBgColorSaturations)[number];
export type HeaderBgColor = `${HeaderBgColorFamily}-${HeaderBgColorSaturation}`;

/** Palette order: a row of families for each saturation. */
export const headerBgColors: readonly HeaderBgColor[] = headerBgColorSaturations.flatMap(
    (saturation) => headerBgColorFamilies.map((family) => `${family}-${saturation}` as const),
);

export const headerBgImageThemes = ['system', 'light', 'dark'] as const;
export type HeaderBgImageTheme = (typeof headerBgImageThemes)[number];

export type HeaderBackground = {
    'bg-color': HeaderBgColor | null;
    'bg-image': string | null;
    'bg-image-theme': HeaderBgImageTheme;
    'bg-image-blur': boolean;
};

const headerBackgroundNames = [
    'bg-color',
    'bg-image',
    'bg-image-theme',
    'bg-image-blur',
] as const satisfies readonly (keyof HeaderBackground)[];

export const headerBackgroundDefaults: Readonly<HeaderBackground> = {
    'bg-color': null,
    'bg-image': null,
    'bg-image-theme': 'system',
    'bg-image-blur': false,
};

const includes = <T>(values: readonly T[], value: unknown): value is T =>
    (values as readonly unknown[]).includes(value);

/** Accepts `http:`, `https:`, `blob:` and relative addresses. */
export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
        return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?|blob):/i.test(value)) return null;
    return value;
}

// The style parser of the sanitizer splits values at `;` outside parentheses and cuts `/*` comments.
const percentEncode = (char: string) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`;

export function toCssUrl(raw: string): string | null {
    const value = safeImageUrl(raw);
    return value && `url("${value.replace(/["'()*\\ ]/g, percentEncode)}")`;
}

/** The theme and the blur are kept with an image only. */
export function headerBackground(
    attrs: Partial<Record<keyof HeaderBackground, unknown>>,
): HeaderBackground {
    const {
        'bg-color': color,
        'bg-image': image,
        'bg-image-theme': theme,
        'bg-image-blur': blur,
    } = attrs;
    const safeImage = typeof image === 'string' ? safeImageUrl(image) : null;
    return {
        'bg-color': includes(headerBgColors, color) ? color : headerBackgroundDefaults['bg-color'],
        'bg-image': safeImage,
        'bg-image-theme':
            safeImage && includes(headerBgImageThemes, theme)
                ? theme
                : headerBackgroundDefaults['bg-image-theme'],
        'bg-image-blur': Boolean(safeImage) && (blur === true || blur === 'true'),
    };
}

/** Values other than the defaults, as attribute strings. */
export function headerBackgroundValues(background: HeaderBackground): Record<string, string> {
    const values: Record<string, string> = {};
    for (const name of headerBackgroundNames) {
        if (background[name] !== headerBackgroundDefaults[name]) {
            values[name] = String(background[name]);
        }
    }
    return values;
}
