import {useState} from 'react';

import {
    MarkdownWysiwygEditorView,
    ToolbarDataType,
    type ToolbarsPreset,
    useMarkdownWysiwygEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName} from '@gravity-ui/markdown-editor/toolbars';

export {WysiwygOnly} from '../../src/stories/examples/wysiwyg-only/WysiwygOnly';
export {WysiwygBroken} from '../../src/stories/examples/wysiwyg-only/WysiwygBroken';

const recoveryPreset: ToolbarsPreset = {
    items: {
        recovery: {
            view: {type: ToolbarDataType.ReactComponent},
            wysiwyg: {width: 100, component: FailingToolbarItem},
        },
    },
    orders: {
        [ToolbarName.wysiwygMain]: [['recovery']],
    },
};

export function WysiwygRecovery() {
    const editor = useMarkdownWysiwygEditor({initial: {markup: 'Original text'}});

    return (
        <MarkdownWysiwygEditorView
            editor={editor}
            qa="demo-md-editor"
            stickyToolbar
            toolbarsPreset={recoveryPreset}
        />
    );
}

function FailingToolbarItem() {
    const [failed, setFailed] = useState(false);
    if (failed) throw new Error('Toolbar rendering failed');

    return <button onClick={() => setFailed(true)}>Fail toolbar</button>;
}
