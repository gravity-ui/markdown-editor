import React from 'react';

import {i18n} from '../../i18n/menubar';
import {Action as A, formatter as f} from '../../shortcuts';
import type {WToolbarListButtonData, WToolbarListButtonItemData} from '../toolbar/types';

import {ActionName} from './action-names';
import {icons} from './icons';
import {HeadingPreview} from './previews/HeadingPreview';
import {TextPreview} from './previews/TextPreview';

export const wTextItemData: WToolbarListButtonItemData = {
    id: ActionName.paragraph,
    title: i18n.bind(null, 'text'),
    icon: icons.text,
    hotkey: f.toView(A.Text),
    exec: (e) => e.actions.toParagraph.run(),
    isActive: (e) => e.actions.toParagraph.isActive(),
    isEnable: (e) => e.actions.toParagraph.isEnable(),
    doNotActivateList: true,
    preview: <TextPreview />,
};
export const wHeading1ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading1,
    title: i18n.bind(null, 'heading1'),
    icon: icons.h1,
    hotkey: f.toView(A.Heading1),
    exec: (e) => e.actions.toH1.run(),
    isActive: (e) => e.actions.toH1.isActive(),
    isEnable: (e) => e.actions.toH1.isEnable(),
    preview: <HeadingPreview level={1} />,
};
export const wHeading2ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading2,
    title: i18n.bind(null, 'heading2'),
    icon: icons.h2,
    hotkey: f.toView(A.Heading2),
    exec: (e) => e.actions.toH2.run(),
    isActive: (e) => e.actions.toH2.isActive(),
    isEnable: (e) => e.actions.toH2.isEnable(),
    preview: <HeadingPreview level={2} />,
};
export const wHeading3ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading3,
    title: i18n.bind(null, 'heading3'),
    icon: icons.h3,
    hotkey: f.toView(A.Heading3),
    exec: (e) => e.actions.toH3.run(),
    isActive: (e) => e.actions.toH3.isActive(),
    isEnable: (e) => e.actions.toH3.isEnable(),
    preview: <HeadingPreview level={3} />,
};
export const wHeading4ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading4,
    title: i18n.bind(null, 'heading4'),
    icon: icons.h4, // Предполагается, что icon исправлен для h4
    hotkey: f.toView(A.Heading4),
    exec: (e) => e.actions.toH4.run(),
    isActive: (e) => e.actions.toH4.isActive(),
    isEnable: (e) => e.actions.toH4.isEnable(),
    preview: <HeadingPreview level={4} />,
};
export const wHeading5ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading5,
    title: i18n.bind(null, 'heading5'),
    icon: icons.h5, // Предполагается, что icon исправлен для h5
    hotkey: f.toView(A.Heading5),
    exec: (e) => e.actions.toH5.run(),
    isActive: (e) => e.actions.toH5.isActive(),
    isEnable: (e) => e.actions.toH5.isEnable(),
    preview: <HeadingPreview level={5} />,
};
export const wHeading6ItemData: WToolbarListButtonItemData = {
    id: ActionName.heading6,
    title: i18n.bind(null, 'heading6'),
    icon: icons.h6, // Предполагается, что icon исправлен для h6
    hotkey: f.toView(A.Heading6),
    exec: (e) => e.actions.toH6.run(),
    isActive: (e) => e.actions.toH6.isActive(),
    isEnable: (e) => e.actions.toH6.isEnable(),
    preview: <HeadingPreview level={6} />,
};

export const wHeadingListConfig: WToolbarListButtonData = {
    icon: icons.headline,
    withArrow: true,
    title: i18n.bind(null, 'heading'),
    data: [
        wTextItemData,
        wHeading1ItemData,
        wHeading2ItemData,
        wHeading3ItemData,
        wHeading4ItemData,
        wHeading5ItemData,
        wHeading6ItemData,
    ],
};
