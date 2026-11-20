import * as DefaultHeaderStories from '../../src/stories/header/Header.stories';

import {TEST_IMAGE} from './Header.const';
import {composeStories} from './utils/compose-stories';

export const HeaderStories = composeStories(DefaultHeaderStories, {
    uploadFile: async () => ({url: TEST_IMAGE}),
});

export function HeaderUploadExample() {
    return (
        <HeaderStories.Header
            width={660}
            uploadFile={async () => {
                const response = await fetch('/header-background-upload');
                if (!response.ok) throw new Error('Upload failed');
                return {url: TEST_IMAGE};
            }}
        />
    );
}
