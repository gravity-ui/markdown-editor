import {Component, type ReactNode} from 'react';

export class ErrorBoundary extends Component<{children: ReactNode; onError(error: unknown): void}> {
    static getDerivedStateFromError() {
        return {failed: true};
    }

    state = {failed: false};

    componentDidCatch(error: unknown) {
        this.props.onError(error);
    }

    render() {
        return this.state.failed ? 'Failed' : this.props.children;
    }
}
