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

    it('should display a custom image upload hint', () => {
        const html = renderToStaticMarkup(
            <ImageForm {...commonImageProps} uploadHint="custom image hint" />,
        );

        expect(html).toContain('custom image hint');
    });

    it('should display a custom file upload hint', () => {
        const html = renderToStaticMarkup(
            <FileForm {...commonImageProps} uploadHint="custom file hint" />,
        );

        expect(html).toContain('custom file hint');
    });
    it('should keep image details in the standard form and only the URL in the source form', () => {
        const props = {onSubmit: vi.fn(), onCancel: vi.fn()};
        const full = document.createElement('div');
        full.innerHTML = renderToStaticMarkup(<ImageForm {...props} />);
        expect(full.querySelectorAll('input')).toHaveLength(5);
        const source = document.createElement('div');
        source.innerHTML = renderToStaticMarkup(<ImageForm {...props} variant="source" />);
        expect(source.querySelectorAll('input')).toHaveLength(1);
        expect(source.querySelector('input')?.getAttribute('aria-label')).toBe('Link');
    });
    it('should allow a single file in the source form while preserving multiple standard uploads', () => {
        const standard = document.createElement('div');
        standard.innerHTML = renderToStaticMarkup(<ImageForm {...commonImageProps} />);
        expect(standard.querySelector('input[type="file"]')?.hasAttribute('multiple')).toBe(true);
        const source = document.createElement('div');
        source.innerHTML = renderToStaticMarkup(
            <ImageForm {...commonImageProps} variant="source" multiple={false} />,
        );
        expect(source.querySelector('input[type="file"]')?.hasAttribute('multiple')).toBe(false);
    });
});
