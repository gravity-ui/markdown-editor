import {Picture} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {Icon} from '@gravity-ui/uikit';

export const cnHeaderImageNodeView = cn('header-image-nodeview');

const ICON_SIZE = 64;

export function HeaderImagePlaceholder() {
    return <Icon className={cnHeaderImageNodeView('icon')} data={Picture} size={ICON_SIZE} />;
}
