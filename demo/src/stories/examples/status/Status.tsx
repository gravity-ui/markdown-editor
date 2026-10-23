import {memo, useEffect} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {markup} from './markup';

import './Status.scss';

export type StatusRing = 'outline' | 'shadow' | 'pseudo';

export type StatusDemoProps = {
    mode: 'wysiwyg' | 'markup';
    ring?: StatusRing;
};

export const StatusDemo = memo<StatusDemoProps>(function StatusDemo({mode, ring}) {
    const editor = useMarkdownEditor({initial: {mode, markup}}, [mode]);

    useEffect(() => {
        if (!ring) return undefined;

        const className = `status-ring_${ring}`;
        document.body.classList.add(className);

        return () => document.body.classList.remove(className);
    }, [ring]);

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
});
