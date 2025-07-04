import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

import {ImageForm} from './ImageForm';
import {FileForm} from './FileForm';

describe('upload hints', () => {
    const commonImageProps = {
        onSubmit: jest.fn(),
        onCancel: jest.fn(),
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
