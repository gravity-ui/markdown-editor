import {describe, expect, it} from 'vitest';

import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';

import {WysiwygEditor} from './Editor';
import type {Exporter} from './exporters/types';

describe('WysiwygEditor document', () => {
    it('should expose the current document and preserve previous snapshots', () => {
        const editor = new WysiwygEditor({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
            initialContent: 'initial',
        });
        try {
            const snapshot = editor.doc;

            expect(snapshot.type.name).toBe('doc');
            expect(snapshot.textContent).toBe('initial');
            expect(editor.doc).toBe(snapshot);

            editor.replace('updated');

            expect(editor.doc.textContent).toBe('updated');
            expect(editor.doc).not.toBe(snapshot);
            expect(snapshot.textContent).toBe('initial');
        } finally {
            editor.destroy();
        }
    });

    it('should expose the final schema shared by the document and exporter', () => {
        const editor = new WysiwygEditor({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).overrideNodeSpec('paragraph', (spec) => ({
                    ...spec,
                    attrs: {...spec.attrs, source: {default: 'override'}},
                })),
            modifiers: [{type: 'schemaNodeSpec', nodeName: 'paragraph', allowedAttrs: ['dynamic']}],
            exporters: [{name: 'schema', create: ({schema}) => ({export: () => schema})}],
        });
        try {
            const schema = editor.schema;
            const exporter = editor.getExporter<Exporter<typeof schema>>('schema');
            const paragraph = schema.node('paragraph');

            expect(schema).toBe(editor.doc.type.schema);
            expect(exporter.export(editor.doc)).toBe(schema);
            expect(paragraph.attrs).toMatchObject({source: 'override', dynamic: null});
        } finally {
            editor.destroy();
        }
    });

    it('should keep the last document and schema readable after destruction', () => {
        const editor = new WysiwygEditor({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
            initialContent: 'initial',
        });
        editor.replace('last document');
        const doc = editor.doc;
        const schema = editor.schema;

        editor.destroy();

        expect(editor.doc).toBe(doc);
        expect(editor.doc.textContent).toBe('last document');
        expect(editor.schema).toBe(schema);
    });
});
