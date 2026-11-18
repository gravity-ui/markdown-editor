import {Action} from './const';
import {formatter} from './formatter';

export function getToggleTabFocusModeShortcut(): string {
    return (
        formatter
            .toView(Action.ToggleTabFocusMode)
            ?.split('+')
            .map((key) => key[0].toUpperCase() + key.slice(1))
            .join('+')
            .replace('Ctrl', 'Control') ?? ''
    );
}
