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

    it('FileForm should display custom upload hint', () => {
        const html = renderToStaticMarkup(
            <FileForm {...commonImageProps} uploadHint="custom file hint" />,
        );

        expect(html).toContain('custom file hint');
    });
});
