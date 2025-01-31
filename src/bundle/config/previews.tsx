import React from 'react';

import {ActionName} from './action-names';
import {HeadingPreview} from './previews/HeadingPreview';
import {TextPreview} from './previews/TextPreview';

type Previews = Partial<Record<keyof typeof ActionName, React.ReactNode>>;

export const previews: Previews = {
    [ActionName.paragraph]: <TextPreview />,
    [ActionName.heading1]: <HeadingPreview level={1} />,
    [ActionName.heading2]: <HeadingPreview level={2} />,
    [ActionName.heading3]: <HeadingPreview level={3} />,
    [ActionName.heading4]: <HeadingPreview level={4} />,
    [ActionName.heading5]: <HeadingPreview level={5} />,
    [ActionName.heading6]: <HeadingPreview level={6} />,
};
