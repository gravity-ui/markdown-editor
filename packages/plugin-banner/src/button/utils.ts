import {includes} from '../utils';

import {
    type ButtonColor,
    type ButtonModel,
    type ButtonTarget,
    type ButtonView,
    buttonDefaults,
    buttonTargets,
    buttonViewColors,
    buttonViews,
} from './const';

export const buttonDefaultColor = (view: ButtonView): ButtonColor => buttonViewColors[view][0];

export function isButtonView(value: unknown): value is ButtonView {
    return includes(buttonViews, value);
}

export function isButtonTarget(value: unknown): value is ButtonTarget {
    return includes(buttonTargets, value);
}

export function buttonModel(attrs: Partial<Record<keyof ButtonModel, unknown>>): ButtonModel {
    const view = isButtonView(attrs.view) ? attrs.view : buttonDefaults.view;
    const colors = buttonViewColors[view];
    return {
        view,
        color: colors.find((color) => color === attrs.color) ?? buttonDefaultColor(view),
        target: isButtonTarget(attrs.target) ? attrs.target : buttonDefaults.target,
        href: typeof attrs.href === 'string' ? attrs.href : '',
        title: typeof attrs.title === 'string' ? attrs.title : '',
    };
}
