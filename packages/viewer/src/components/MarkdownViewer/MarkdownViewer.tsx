import {type HTMLAttributes, type PropsWithChildren, forwardRef} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import {cn} from '../../utils/classname';

const b = cn('viewer');

export type MarkdownViewerProps = PropsWithChildren<
    Omit<HTMLAttributes<HTMLDivElement>, 'dangerouslySetInnerHTML'> &
        QAProps & {
            /** Pre-transformed HTML string. The component does not sanitize it — make sure to sanitize before passing. */
            html: string;
        }
>;

export const MarkdownViewer = forwardRef<HTMLDivElement, MarkdownViewerProps>(
    function MarkdownViewer({html, className, qa, children, ...restProps}, ref) {
        return (
            <div className={b()}>
                <div
                    {...restProps}
                    ref={ref}
                    data-qa={qa}
                    className={b('content', className)}
                    dangerouslySetInnerHTML={{__html: html}}
                />
                {children}
            </div>
        );
    },
);
