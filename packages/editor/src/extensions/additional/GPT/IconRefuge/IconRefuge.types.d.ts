import type {CSSProperties} from 'react';

import type {IconProps} from '@gravity-ui/uikit';

export type IconRefugeProps = IconProps & {
    refugeSize: number;
    widthOnly?: boolean;
    inlineIcon?: boolean;
    containerClassName?: string;
    containerStyle?: CSSProperties;
    title?: string;
    'aria-label'?: string;
};
