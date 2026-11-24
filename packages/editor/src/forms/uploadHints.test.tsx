import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

import {FileForm} from './FileForm';
import {ImageForm} from './ImageForm';

describe('upload hints', () => {
    const commonImageProps = {
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
        onAttach: () => {},
    };

    it('ImageForm should display custom upload hint', () => {
        const html = renderToStaticMarkup(
            <ImageForm {...commonImageProps} uploadHint="custom image hint" />,
        );

        expect(html).toContain('custom image hint');
    });

    it('should allow choosing a single file', () => {
        const container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <ImageForm {...commonImageProps} multiple={false} />,
        );
        expect(container.querySelector<HTMLInputElement>('input[type=file]')?.multiple).toBe(false);
    });

    it('should render just the labelled link field when no extra fields are requested', () => {
        const container = document.createElement('div');
        container.innerHTML = renderToStaticMarkup(
            <ImageForm {...commonImageProps} onAttach={undefined} fields={[]} />,
        );
        const inputs = container.querySelectorAll('input');
        expect(inputs).toHaveLength(1);
        const labelId = inputs[0].getAttribute('aria-labelledby');
        expect(container.querySelector(`[id="${labelId}"]`)?.textContent).toBeTruthy();
    });

    it('FileForm should display custom upload hint', () => {
        const html = renderToStaticMarkup(
            <FileForm {...commonImageProps} uploadHint="custom file hint" />,
        );

        expect(html).toContain('custom file hint');
    });
});
