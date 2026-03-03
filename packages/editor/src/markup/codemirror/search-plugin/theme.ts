import {EditorView} from '#cm/view';

export const searchTheme = EditorView.baseTheme({
    '&light, &dark': {
        '& .cm-searchMatch': {
            backgroundColor: 'var(--g-color-base-info-light)',
        },
        '& .cm-searchMatch-selected': {
            backgroundColor: 'var(--g-color-base-info-heavy)',
        },
    },
});
