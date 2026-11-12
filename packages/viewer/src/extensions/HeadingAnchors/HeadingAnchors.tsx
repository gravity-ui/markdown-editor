import {type MouseEvent, useState} from 'react';

import {ClipboardButton} from '@gravity-ui/uikit';

import {ViewerTargets} from '../../components/ViewerTargets';
import {createClassRegistration} from '../../utils/class-registration';
import {cn} from '../../utils/classname';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

import {i18n} from './i18n';

import './HeadingAnchors.scss';

const b = cn('heading-anchor');
const registerHeadingAnchor = createClassRegistration(b());

export interface HeadingAnchorTarget {
    readonly id: string;
    readonly element: HTMLElement;
}

export interface HeadingAnchorsProps {
    /** @default 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]' */
    selector?: string;
    getHref: (heading: HeadingAnchorTarget) => string;
    onClick?: (event: MouseEvent<HTMLButtonElement>, heading: HeadingAnchorTarget) => void;
}

export function HeadingAnchors({
    selector = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
    getHref,
    onClick,
}: HeadingAnchorsProps) {
    return (
        <ViewerTargets selector={selector} className={b('slot')}>
            {(heading) => <HeadingAnchor heading={heading} getHref={getHref} onClick={onClick} />}
        </ViewerTargets>
    );
}

function HeadingAnchor({
    heading,
    getHref,
    onClick,
}: Omit<HeadingAnchorsProps, 'selector'> & {heading: HTMLElement}) {
    const {t} = i18n.useTranslation();
    const [ownsHeading, setOwnsHeading] = useState(false);

    useClientLayoutEffect(() => registerHeadingAnchor(heading, setOwnsHeading), [heading]);

    if (!ownsHeading) return null;

    return (
        <ClipboardButton
            className={b('button')}
            size="s"
            icon="#"
            text={() => getHref({id: heading.id, element: heading})}
            timeout={1000}
            tooltipInitialText={t('copy_link')}
            onClick={(event) => {
                if (heading.parentElement?.classList.contains('heading-section')) {
                    // TODO: Fix @diplodoc/folding-headings-extension to ignore
                    // interactive controls and events with defaultPrevented.
                    event.stopPropagation();
                }
                onClick?.(event, {id: heading.id, element: heading});
            }}
        />
    );
}
