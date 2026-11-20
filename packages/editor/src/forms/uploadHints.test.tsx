import {Provider} from '@gravity-ui/uikit';
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
            <Provider>
                <ImageForm {...commonImageProps} uploadHint="custom image hint" />
            </Provider>,
        );

        expect(html).toContain('custom image hint');
    });

    it('should display a custom file upload hint', () => {
        const html = renderToStaticMarkup(
            <Provider>
                <FileForm {...commonImageProps} uploadHint="custom file hint" />
            </Provider>,
        );

        expect(html).toContain('custom file hint');
    });
});
