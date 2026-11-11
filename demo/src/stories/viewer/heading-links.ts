import type {MouseEvent} from 'react';

import type {HeadingAnchorTarget} from '@gravity-ui/markdown-viewer/extensions';

export function getHeadingHref({id}: HeadingAnchorTarget) {
    const url = new URL(window.location.href);
    url.hash = encodeURIComponent(id);
    return url.href;
}

export function navigateToHeading(
    _event: MouseEvent<HTMLButtonElement>,
    heading: HeadingAnchorTarget,
) {
    // Keep focus on the button to show the copy result.
    window.history.pushState(window.history.state, '', getHeadingHref(heading));
}
