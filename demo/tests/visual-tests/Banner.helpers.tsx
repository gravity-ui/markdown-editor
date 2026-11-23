import * as DefaultBannerStories from '../../src/stories/banner/Banner.stories';

import {TEST_IMAGE} from './Banner.const';
import {composeStories} from './utils/compose-stories';

export const BannerStories = composeStories(DefaultBannerStories, {
    uploadFile: async () => ({url: TEST_IMAGE}),
});

export function BannerUploadExample() {
    return (
        <BannerStories.Banner
            width={660}
            uploadFile={async () => {
                const response = await fetch('/banner-background-upload');
                if (!response.ok) throw new Error('Upload failed');
                return {url: TEST_IMAGE};
            }}
        />
    );
}
