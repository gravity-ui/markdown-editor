export const isMac = (): boolean =>
    typeof navigator === 'undefined' ? false : /Mac/.test(navigator.platform);
