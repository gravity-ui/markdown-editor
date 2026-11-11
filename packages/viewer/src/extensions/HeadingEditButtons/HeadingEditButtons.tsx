import type {MouseEvent} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {ViewerTargets} from '../../components/ViewerTargets';
import {cn} from '../../utils/classname';

import {i18n} from './i18n';

import './HeadingEditButtons.scss';

const b = cn('heading-edit');

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
    const {t} = i18n.useTranslation();

    return (
        <ViewerTargets selector={selector} className={b('slot')}>
            {(heading) => {
                const line = Number(heading.dataset.line);
                if (!Number.isInteger(line) || line < 0) return null;

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
            }}
        </ViewerTargets>
    );
}
