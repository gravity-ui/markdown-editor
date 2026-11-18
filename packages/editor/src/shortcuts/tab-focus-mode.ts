import {Action} from './const';
import {formatter} from './formatter';

export function getToggleTabFocusModeShortcut(): string {
    return formatter.toText(Action.ToggleTabFocusMode) ?? '';
}
