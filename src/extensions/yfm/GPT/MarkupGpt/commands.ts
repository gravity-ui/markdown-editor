import type {EditorView} from '../../../../cm/view';

import {HideMarkupGptEffect, ShowMarkupGptEffect} from './effects';

export const showMarkupGpt = (view: EditorView) => {
    view.dispatch({effects: [ShowMarkupGptEffect.of(null)]});
};

export const hideMarkupGpt = (view: EditorView) => {
    view.dispatch({effects: [HideMarkupGptEffect.of(null)]});
};
