import {type CSSProperties, useEffect, useRef, useState} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {createStyleSheet} from '@gravity-ui/markdown-editor/shadow-styles';
import {PortalProvider, ThemeProvider} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

const editorStyleSheet = createStyleSheet();

const markup = '#|\n|| First | Second ||\n|| Third | Fourth ||\n|#';

// Document stylesheets of the test page define these variables on `:root`.
// The reset keeps the host from inheriting them, so only `:host` rules can set them.
const resetDocumentVariables = {
    '--toolbar-item-preview-width': 'initial',
    '--yfm-colorify-violet': 'initial',
} as CSSProperties;

export function ShadowDomStyles({adoptStyles = true}: {adoptStyles?: boolean}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const portalContainerRef = useRef<HTMLDivElement>(null);
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
    const editor = useMarkdownEditor({initial: {markup, mode: 'wysiwyg'}});

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const root = host.shadowRoot ?? host.attachShadow({mode: 'open'});
        root.adoptedStyleSheets = adoptStyles ? [editorStyleSheet] : [];
        setShadowRoot(root);
    }, [adoptStyles]);

    return (
        <div style={resetDocumentVariables}>
            <div ref={hostRef} data-qa="shadow-host">
                {shadowRoot &&
                    createPortal(
                        <ThemeProvider theme="light" scoped>
                            <PortalProvider container={portalContainerRef}>
                                <div style={{height: 400, overflow: 'auto'}}>
                                    <MarkdownEditorView editor={editor} stickyToolbar />
                                </div>
                                <div ref={portalContainerRef} />
                            </PortalProvider>
                        </ThemeProvider>,
                        shadowRoot,
                    )}
            </div>
        </div>
    );
}
