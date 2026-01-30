import dd from 'ts-dedent';

import type {MountFixture, PlaywrightFixture} from './types';

export const mount: PlaywrightFixture<MountFixture> = async ({mount: baseMount}, use) => {
    const mount: MountFixture = async (component, options) => {
        return await baseMount(
            <div
                style={{
                    padding: 20,
                    // When we set width we didn't expect that paddings for better screenshots would be included
                    boxSizing: options?.width ? 'content-box' : undefined,
                    width: options?.width ? options.width : 'fit-content',
                    height: 'fit-content',
                    ...options?.rootStyle,
                }}
                className="playwright-wrapper-test"
            >
                {/* reset body styles */}
                <style>{'body {margin: 0}'}</style>
                {/* Do not scale buttons while clicking. Floating UI might position its elements differently in every test run. */}
                <style>{'.g-button, .g-button::after { transform: scale(1) !important; }'}</style>
                {/* Do not show ProseMirror dev toolkit. */}
                <style>{'.__prosemirror-dev-toolkit__ {display: none;}'}</style>
                {options?.hidePlaygroundBlocks && (
                    <style>
                        {dd`
                            .playground__header,
                            .playground__actions {
                                display: none;
                            }
                            .playground__pm-selection {
                                pointer-events: none;
                            }
                        `}
                    </style>
                )}
                {component}
            </div>,
            options,
        );
    };

    await use(mount);
};
