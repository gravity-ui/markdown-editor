import {createElement} from 'react';

import {
    type HeadingAnchorTarget,
    HeadingAnchors,
    type HeadingAnchorsProps,
} from '../../src/extensions';

export function shouldAcceptHeadingAnchorsProps() {
    const props: HeadingAnchorsProps = {
        selector: 'h2[id]',
        getHref: ({id}: HeadingAnchorTarget) => `https://example.com/#${id}`,
        onClick: (event, heading) => {
            const target: HeadingAnchorTarget = heading;
            target.element.focus();
            event.preventDefault();
        },
    };

    return createElement(HeadingAnchors, props);
}
