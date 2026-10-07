import {describe, expect, it, vi} from 'vitest';

import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';

import {WysiwygEditor, type WysiwygEditorOptions} from './Editor';
import type {Exporter, ExporterFactory} from './exporters/types';

describe('WysiwygEditor exporters', () => {
    it('should expose its exporter for nodes and fragments', () => {
        const create = vi.fn<ExporterFactory>(() => ({
            export: (input: Parameters<Exporter['export']>[0]) => input.childCount,
        }));
        const editor = new WysiwygEditor({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
            initialContent: 'text',
            exporters: [{name: 'statistics', create}],
        });
        try {
            const exporter = editor.getExporter<Exporter<number>>('statistics');

            expect(exporter.export(editor.view.state.doc)).toBe(1);
            expect(exporter.export(editor.view.state.doc.content)).toBe(1);
            expect(editor.getExporter('statistics')).toBe(exporter);
            expect(create).toHaveBeenCalledTimes(1);
        } finally {
            editor.destroy();
        }
    });

    it('should create independent exporter instances for separate editors', () => {
        const create = vi.fn<ExporterFactory>(() => ({export: () => 0}));
        const options: WysiwygEditorOptions = {
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
            exporters: [{name: 'statistics', create}],
        };
        const first = new WysiwygEditor(options);
        const second = new WysiwygEditor(options);
        try {
            expect(first.getExporter('statistics')).not.toBe(second.getExporter('statistics'));
            expect(create).toHaveBeenCalledTimes(2);
        } finally {
            first.destroy();
            second.destroy();
        }
    });

    it('should keep the legacy serializer and escape settings with an additional exporter', () => {
        const exportDocument = vi.fn<Exporter<string>['export']>(() => 'new format');
        const editor = new WysiwygEditor({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
            initialContent: '!text@value',
            escapeConfig: {commonEscape: /[@]/g, startOfLineEscape: /^!/},
            exporters: [{name: 'custom', create: () => ({export: exportDocument})}],
        });
        try {
            expect(editor.getValue()).toBe('\\!text\\@value');
            expect(editor.serializer.serialize(editor.view.state.doc)).toBe('!text@value');
            expect(exportDocument).not.toHaveBeenCalled();
            expect(
                editor.getExporter<Exporter<string>>('custom').export(editor.view.state.doc),
            ).toBe('new format');
        } finally {
            editor.destroy();
        }
    });
});
