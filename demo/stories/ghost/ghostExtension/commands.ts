import type {EditorView} from '#cm/view';

import {HideGhostPopupEffect, ShowGhostPopupEffect} from './effects';

export const showGhostPopup = (view: EditorView) => {
    view.dispatch({effects: [ShowGhostPopupEffect.of(null)]});
};

export const hideGhostPopup = (view: EditorView) => {
    view.dispatch({effects: [HideGhostPopupEffect.of(null)]});
};
