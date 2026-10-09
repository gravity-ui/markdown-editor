import {Suspense, lazy} from 'react';

import type {SplitModePreviewProps} from './SplitModePreview';

// The preview pulls in @diplodoc/transform with all its plugins: highlight.js, katex,
// page-constructor. Nothing of that is needed until split mode is turned on.
const SplitModePreview = lazy(() =>
    import('./SplitModePreview').then(({SplitModePreview: component}) => ({default: component})),
);

export const SplitModePreviewLazy: React.FC<SplitModePreviewProps> = (props) => (
    <Suspense fallback={null}>
        <SplitModePreview {...props} />
    </Suspense>
);
