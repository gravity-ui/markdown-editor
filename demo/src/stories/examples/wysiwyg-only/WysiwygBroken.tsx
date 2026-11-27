import {
    MarkdownWysiwygEditorView,
    ToolbarDataType,
    type ToolbarsPreset,
    useMarkdownWysiwygEditor,
} from '@gravity-ui/markdown-editor';
import {ToolbarName} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const brokenPreset: ToolbarsPreset = {
    items: {
        broken: {
            view: {type: ToolbarDataType.ReactComponent},
            wysiwyg: {width: 100, component: BrokenToolbarItem},
        },
    },
    orders: {[ToolbarName.wysiwygMain]: [['broken']]},
};

export function WysiwygBroken() {
    const editor = useMarkdownWysiwygEditor({
        initial: {markup: '## Document before the error\n\nThis text can still be exported.'},
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownWysiwygEditorView
                    editor={editor}
                    className={className}
                    qa="demo-md-editor"
                    stickyToolbar
                    toolbarsPreset={brokenPreset}
                />
            )}
        />
    );
}

function BrokenToolbarItem(): never {
    throw new Error('Toolbar rendering failed');
}
