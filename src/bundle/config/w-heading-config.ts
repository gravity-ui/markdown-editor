import {ActionStorage} from '../../core';
import type {WToolbarListButtonData} from '../toolbar/types';

import {icons} from './icons';

export const wHeadingListConfig: WToolbarListButtonData = {
    icon: icons.text,
    title: 'Text style',
    data: [
        {
            id: 'p',
            title: 'Normal text',
            icon: icons.text,
            exec: (e: ActionStorage) => e.actions.toParagraph.run(),
            isActive: (e: ActionStorage) => e.actions.toParagraph.isActive(),
            isEnable: (e: ActionStorage) => e.actions.toParagraph.isEnable(),
        },
        {
            id: 'h1',
            title: 'Heading 1',
            icon: icons.h1,
            exec: (e: ActionStorage) => e.actions.toH1.run(),
            isActive: (e: ActionStorage) => e.actions.toH1.isActive(),
            isEnable: (e: ActionStorage) => e.actions.toH1.isEnable(),
        },
        {
            id: 'h2',
            title: 'Heading 2',
            icon: icons.h2,
            exec: (e: ActionStorage) => e.actions.toH2.run(),
            isActive: (e: ActionStorage) => e.actions.toH2.isActive(),
            isEnable: (e: ActionStorage) => e.actions.toH2.isEnable(),
        },
        {
            id: 'h3',
            title: 'Heading 3',
            icon: icons.h3,
            exec: (e: ActionStorage) => e.actions.toH3.run(),
            isActive: (e: ActionStorage) => e.actions.toH3.isActive(),
            isEnable: (e: ActionStorage) => e.actions.toH3.isEnable(),
        },
    ],
};
