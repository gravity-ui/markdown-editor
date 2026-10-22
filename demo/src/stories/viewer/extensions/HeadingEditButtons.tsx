import type {MouseEvent} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {ViewerTargets} from '@gravity-ui/markdown-viewer';
import {Button, Icon} from '@gravity-ui/uikit';

import {cn} from '../cn';

import './HeadingEditButtons.scss';

export interface HeadingEditButtonsProps {
    selector?: string;
    onClick: (event: MouseEvent<HTMLButtonElement>, line: number) => void;
}

export function HeadingEditButtons({
    selector = 'h1[data-line], h2[data-line], h3[data-line], h4[data-line], h5[data-line], h6[data-line]',
    onClick,
}: HeadingEditButtonsProps) {
    return (
        <ViewerTargets selector={selector} className={cn('heading-edit-slot')}>
            {(heading) => {
                const line = Number(heading.dataset.line);
                if (!Number.isInteger(line) || line < 0) return null;

                return (
                    <Button
                        size="s"
                        view="flat-secondary"
                        aria-label="Edit section"
                        onClick={(event) => {
                            if (heading.parentElement?.classList.contains('heading-section')) {
                                // TODO: Fix folding headings to ignore interactive controls.
                                event.stopPropagation();
                            }
                            onClick(event, line);
                        }}
                    >
                        <Icon data={Pencil} size={16} />
                    </Button>
                );
            }}
        </ViewerTargets>
    );
}
