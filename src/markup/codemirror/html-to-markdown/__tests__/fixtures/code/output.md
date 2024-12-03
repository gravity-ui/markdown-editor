Inline code with escape `` test` ``

```
import React from 'react';
    import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
    import { toaster } from '@gravity-ui/uikit/toaster-singleton-react-18';

    function Editor({ onSubmit }) {
      const editor = useMarkdownEditor({ allowHTML: false });

      React.useEffect(() => {
        function submitHandler() {
          // Serialize current content to markdown markup
          const value = editor.getValue();
          onSubmit(value);
        }

        editor.on('submit', submitHandler);
        return () => {
          editor.off('submit', submitHandler);
        };
      }, [onSubmit]);

      return <MarkdownEditorView stickyToolbar autofocus toaster={toaster} editor={editor} />;
}
```