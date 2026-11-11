import {type MouseEvent, useState} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {ViewerTargets} from '../../components/ViewerTargets';
import {createClassRegistration} from '../../utils/class-registration';
import {cn} from '../../utils/classname';
import {useClientLayoutEffect} from '../../utils/use-client-layout-effect';

import {i18n} from './i18n';

import './HeadingEditButtons.scss';

const b = cn('heading-edit');
const registerHeadingEdit = createClassRegistration(b());

export interface HeadingEditTarget {
    readonly line: number;
    readonly element: HTMLElement;
}

export interface HeadingEditButtonsProps {
    /** @default 'h1[data-line], h2[data-line], h3[data-line], h4[data-line], h5[data-line], h6[data-line]' */
    selector?: string;
    /** Accessible button label. Defaults to the localized "Edit". */
    label?: string;
    /** Handle a click with the zero-based source line and heading element. */
    onClick: (event: MouseEvent<HTMLButtonElement>, heading: HeadingEditTarget) => void;
}

export function HeadingEditButtons({
    selector = 'h1[data-line], h2[data-line], h3[data-line], h4[data-line], h5[data-line], h6[data-line]',
    label,
    onClick,
}: HeadingEditButtonsProps) {
    return (
        <ViewerTargets selector={selector} className={b('slot')}>
            {(heading) => {
                const value = heading.dataset.line?.trim();
                if (!value) return null;

                const line = Number(value);
                if (!Number.isInteger(line) || line < 0) return null;

                return (
                    <HeadingEditButton
                        heading={heading}
                        line={line}
                        label={label}
                        onClick={onClick}
                    />
                );
            }}
        </ViewerTargets>
    );
}

function HeadingEditButton({
    heading,
    line,
    label,
    onClick,
}: Omit<HeadingEditButtonsProps, 'selector'> & {heading: HTMLElement; line: number}) {
    const {t} = i18n.useTranslation();
    const [ownsHeading, setOwnsHeading] = useState(false);

    useClientLayoutEffect(() => registerHeadingEdit(heading, setOwnsHeading), [heading]);

    if (!ownsHeading) return null;

    return (
        <Button
            size="s"
            view="flat-secondary"
            aria-label={label ?? t('edit')}
            onClick={(event) => {
                if (heading.parentElement?.classList.contains('heading-section')) {
                    // TODO: Fix folding headings to ignore interactive controls.
                    event.stopPropagation();
                }
                onClick(event, {line, element: heading});
            }}
        >
            <Icon data={Pencil} size={16} />
        </Button>
    );
}
