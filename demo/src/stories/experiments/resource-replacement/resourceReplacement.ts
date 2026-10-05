import {FILE_TOKEN} from '@diplodoc/file-extension';
import type {Extension, ResourceReplacementConfig} from '@gravity-ui/markdown-editor';

export const SOURCE_URL =
    'https://avatars.mds.yandex.net/get-shedevrum/15170052/img_7ba17345eee211efa1d9c61932b2752e/orig';
export const TARGET_URL =
    'https://avatars.mds.yandex.net/get-shedevrum/15320627/img_d62906eeeee211ef9e61968caa0a2b17/orig';

export const IMAGE_MARKDOWN = `![Source image](${SOURCE_URL} =160x160)`;
export const FILE_MARKDOWN = `{% file src="${SOURCE_URL}" name="source-image.jpg" %}`;
export const INITIAL_MARKDOWN = `Paste a sample into a new paragraph below these existing resources.

${IMAGE_MARKDOWN}

${FILE_MARKDOWN}

Paste here:
`;

export const resourceMetadata: Extension = (builder) => {
    builder.overrideNodeSpec('image', (spec) => ({
        ...spec,
        _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
    }));
    builder.overrideNodeSpec(FILE_TOKEN, (spec) => ({
        ...spec,
        _resource: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
    }));
};

export const resolveResources: NonNullable<ResourceReplacementConfig['resolve']> = async (
    resources,
    {signal},
) => {
    await new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Resource replacement cancelled', 'AbortError'));
            return;
        }

        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, 3000);

        function onAbort() {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            reject(new DOMException('Resource replacement cancelled', 'AbortError'));
        }

        signal.addEventListener('abort', onAbort, {once: true});
    });

    return {
        replacements: resources
            .filter(({kind}) => kind === 'image' || kind === 'file')
            .map(({kind, value}) => ({kind, oldValue: value, newValue: TARGET_URL})),
    };
};
