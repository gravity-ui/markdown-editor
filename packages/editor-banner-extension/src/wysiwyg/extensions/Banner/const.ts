import type {ButtonColor, ButtonView} from '@gravity-ui/markdown-plugin-banner';

export const insertBannerAction = 'insertBanner';

export const bannerButtonStyles: readonly {view: ButtonView; color: ButtonColor}[] = [
    {view: 'action', color: 'blue'},
    {view: 'normal', color: 'gray'},
    {view: 'flat', color: 'standard'},
];

export const bannerButtonsMax = bannerButtonStyles.length;
