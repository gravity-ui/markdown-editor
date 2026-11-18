import type {EditorState} from '@gravity-ui/markdown-editor/pm/state';
import type {PopupPlacement} from '@gravity-ui/uikit';

const startPlacement: PopupPlacement = ['top-start', 'bottom-start'];

export const headerAlignPlacement: (state: EditorState, pos: number) => PopupPlacement = () =>
    startPlacement;
