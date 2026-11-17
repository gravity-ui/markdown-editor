import {Icon} from '@gravity-ui/uikit';

import {cnIconRefuge} from './IconRefuge.classname';
import type {IconRefugeProps} from './IconRefuge.types';

import './IconRefuge.scss';

/**
 * Creates a div wrapper above the icon, which sets the min-width and min-height
 * equal to its refugeSize prop, puts the original icon in the middle and
 * proxies the rest of the propses to it.
 *
 * The component is made in order to add margins to icons that have
 * margins are indented, but their svg exactly wrap around the edges of the image
 *
 * It seems that all icons will be square, if not, then you can simply add
 * refugeWidth and refugeHeight
 */

export const IconRefuge: React.FC<IconRefugeProps> = ({
    refugeSize,
    containerClassName,
    containerStyle,
    widthOnly,
    inlineIcon,
    title,
    'aria-label': ariaLabel,
    ...props
}) => {
    if (props.size === refugeSize && !title && !ariaLabel && !containerStyle) {
        return <Icon {...props} />;
    }

    return (
        <div
            className={cnIconRefuge({inline: inlineIcon}, containerClassName)}
            title={title}
            aria-label={ariaLabel}
            style={{
                minWidth: refugeSize,
                minHeight: widthOnly ? undefined : refugeSize,
                ...containerStyle,
            }}
        >
            <Icon size={refugeSize} {...props} />
        </div>
    );
};

IconRefuge.displayName = 'Icon';
