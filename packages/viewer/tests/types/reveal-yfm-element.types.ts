import {createElement} from 'react';

import {type RevealYfmElementOptions, type RevealYfmTarget, revealYfmElement} from '../../src';
import {RevealYfmElement, type RevealYfmElementProps} from '../../src/extensions';

export function shouldAcceptRevealTargets(element: Element) {
    const targets: (RevealYfmTarget | null)[] = [
        element,
        {id: 'target'},
        {selector: '.target'},
        null,
    ];
    const options: RevealYfmElementOptions = {root: element};
    const results: (Element | null)[] = targets.map((target) => revealYfmElement(target, options));
    const withoutRoot: Element | null = revealYfmElement(element);
    return {results, withoutRoot};
}

export function shouldAcceptRevealProps(element: Element) {
    const props: RevealYfmElementProps[] = [
        {id: 'target'},
        {selector: '.target'},
        {element},
        {id: null},
        {selector: null},
        {element: null},
        {id: 'target', onReveal: (target: Element) => target.scrollIntoView()},
    ];
    return props.map((value) => createElement(RevealYfmElement, {...value, key: 'request'}));
}

export function shouldRejectAmbiguousTargets(element: Element) {
    // @ts-expect-error Choose either an ID or a selector.
    revealYfmElement({id: 'target', selector: '.target'});
    // @ts-expect-error A string does not identify the lookup method.
    revealYfmElement('target');
    // @ts-expect-error Text nodes are not supported.
    revealYfmElement(element.ownerDocument.createTextNode('target'));
}

export function shouldRejectAmbiguousProps(element: Element) {
    // @ts-expect-error A target prop is required.
    const missing: RevealYfmElementProps = {};
    // @ts-expect-error Choose either an ID or a selector.
    const both: RevealYfmElementProps = {id: 'target', selector: '.target'};
    // @ts-expect-error Choose either an element or an ID.
    const mixed: RevealYfmElementProps = {element, id: 'target'};
    return {missing, both, mixed};
}
