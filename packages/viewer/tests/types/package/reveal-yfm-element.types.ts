import {createElement} from 'react';

import {
    type RevealYfmElementOptions,
    type RevealYfmTarget,
    revealYfmElement,
} from '@gravity-ui/markdown-viewer';
import {RevealYfmElement, type RevealYfmElementProps} from '@gravity-ui/markdown-viewer/extensions';

export function shouldExposeRevealContracts(element: Element) {
    const target: RevealYfmTarget = {id: 'target'};
    const options: RevealYfmElementOptions = {root: element};
    const result: Element | null = revealYfmElement(target, options);
    const props: RevealYfmElementProps = {element: result};
    return createElement(RevealYfmElement, props);
}
