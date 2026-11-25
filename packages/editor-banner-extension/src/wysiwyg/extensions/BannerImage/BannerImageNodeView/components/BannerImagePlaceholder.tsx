import {Picture} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {Icon} from '@gravity-ui/uikit';

export const cnBannerImageNodeView = cn('banner-image-nodeview');

const ICON_SIZE = 64;

export function BannerImagePlaceholder() {
    return <Icon className={cnBannerImageNodeView('icon')} data={Picture} size={ICON_SIZE} />;
}
