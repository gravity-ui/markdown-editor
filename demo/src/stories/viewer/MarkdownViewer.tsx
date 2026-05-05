import {useEffect, useState} from 'react';

import transform from '@diplodoc/transform';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';

export type ViewerProps = {
    markdown: string;
};

export const Viewer: React.FC<ViewerProps> = ({markdown}) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        setHtml(transform(markdown).result.html);
    }, [markdown]);

    return (
        <MarkdownViewer
            html={html}
            className={cnYFM({
                'no-list-reset': true,
                'no-stripe-table': true,
            })}
            qa="demo-markdown-viewer"
            role="presentation"
        />
    );
};
