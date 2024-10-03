import type {EditorView} from '../../../../cm/view';

import {HideMarkupGptExampleEffect, ShowMarkupGptExampleEffect} from './effects';

export const showMarkupGptExample = (view: EditorView) => {
    view.dispatch({effects: [ShowMarkupGptExampleEffect.of(null)]});
};

export const hideMarkupGptExample = (view: EditorView) => {
    view.dispatch({effects: [HideMarkupGptExampleEffect.of(null)]});
};
