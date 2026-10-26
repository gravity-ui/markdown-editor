import {Component, type HTMLAttributes, type ReactElement, type RefObject} from 'react';

import {ViewerContext} from '../../lifecycle/context';
import {ViewerLifecycle} from '../../lifecycle/viewer-lifecycle';
import {cn} from '../../utils/classname';

const b = cn('viewer');

export interface MarkdownViewerProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'dangerouslySetInnerHTML'
> {
    /** Prepared HTML. The application must sanitize untrusted content. */
    html: string;
    qa?: string;
}

interface ViewerContentProps extends MarkdownViewerProps {
    contentRef: Readonly<RefObject<HTMLDivElement | null>>;
}

export class ViewerContent extends Component<ViewerContentProps> {
    private lifecycle = new ViewerLifecycle();

    componentDidMount() {
        this.lifecycle.resume(this.props.contentRef.current);
    }

    getSnapshotBeforeUpdate(previous: ViewerContentProps) {
        if (previous.html === this.props.html) return false;

        // React calls this before it replaces the old HTML.
        this.lifecycle.pause();
        return true;
    }

    componentDidUpdate(_previous: ViewerContentProps, _state: unknown, replaced: boolean) {
        if (replaced) this.lifecycle.resume(this.props.contentRef.current);
    }

    componentWillUnmount() {
        this.lifecycle.pause();
    }

    render(): ReactElement {
        const {html, className, qa, children, contentRef, ...restProps} = this.props;

        return (
            <ViewerContext.Provider value={this.lifecycle}>
                <div className={b()}>
                    <div
                        {...restProps}
                        ref={contentRef}
                        data-qa={qa}
                        className={b('content', className)}
                        dangerouslySetInnerHTML={{__html: html}}
                    />
                    {children}
                </div>
            </ViewerContext.Provider>
        );
    }
}
