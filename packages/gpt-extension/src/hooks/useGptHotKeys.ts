import type {Options} from 'react-hotkeys-hook';
import {useHotkeys} from 'react-hotkeys-hook';

export function useGptHotKeys(
    key: string,
    callback: () => void,
    options: Options = {},
    dependencies?: unknown[],
) {
    useHotkeys(key, callback, {preventDefault: true, ...options}, dependencies);
}
