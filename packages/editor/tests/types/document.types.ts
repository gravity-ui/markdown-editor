import type {Node, Schema} from 'prosemirror-model';

import type * as PublicPackage from '../../src';
import type * as Core from '../../src/core';

export function shouldExposeReadonlyDocumentAndSchema(editor: Core.WysiwygEditor) {
    const publicEditor: PublicPackage.WysiwygEditor = editor;
    const doc: Node = editor.doc;
    const schema: Schema = editor.schema;
    const publicDoc: Node = publicEditor.doc;
    const publicSchema: Schema = publicEditor.schema;

    // @ts-expect-error The document getter is read-only.
    publicEditor.doc = publicDoc;
    // @ts-expect-error The schema getter is read-only.
    publicEditor.schema = publicSchema;

    return {doc, schema, publicDoc, publicSchema};
}
