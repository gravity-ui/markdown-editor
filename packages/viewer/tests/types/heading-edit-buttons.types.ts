import {type MouseEvent, createElement} from 'react';

import {
    HeadingEditButtons,
    type HeadingEditButtonsProps,
    type HeadingEditTarget,
} from '../../src/extensions';

export function shouldAcceptHeadingEditButtonsProps() {
    const props: HeadingEditButtonsProps = {
        label: 'Edit this heading',
        selector: 'h2[data-line]',
        onClick: (event, heading) => {
            const buttonEvent: MouseEvent<HTMLButtonElement> = event;
            const target: HeadingEditTarget = heading;
            const sourceLine: number = target.line;
            const headingElement: HTMLElement = target.element;
            buttonEvent.preventDefault();
            headingElement.dataset.line = String(sourceLine);
        },
    };

    return createElement(HeadingEditButtons, props);
}

// @ts-expect-error The application must handle edit clicks.
export const shouldRequireOnClick: HeadingEditButtonsProps = {label: 'Edit'};
