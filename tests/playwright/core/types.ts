import type * as React from 'react';

import type {MountOptions, MountResult} from '@playwright/experimental-ct-react';
import type {
    Locator,
    Page,
    PageScreenshotOptions,
    PlaywrightTestArgs,
    PlaywrightTestOptions,
    PlaywrightWorkerArgs,
    PlaywrightWorkerOptions,
    TestFixture,
} from '@playwright/test';

import type {MarkdownEditorPage} from './editor';
import type {DebugHelpers, PlaywrightHelpers} from './helpers';

interface ComponentFixtures {
    mount<HooksConfig>(
        component: JSX.Element,
        options?: MountOptions<HooksConfig> & {
            width?: number | string;
            rootStyle?: React.CSSProperties;
        },
    ): Promise<MountResult>;
}

type PlaywrightTestFixtures = PlaywrightTestArgs & PlaywrightTestOptions & ComponentFixtures;
type PlaywrightWorkerFixtures = PlaywrightWorkerArgs & PlaywrightWorkerOptions;
type PlaywrightFixtures = PlaywrightTestFixtures & PlaywrightWorkerFixtures;
export type PlaywrightFixture<T> = TestFixture<T, PlaywrightFixtures>;

export type Fixtures = {
    mount: MountFixture;
    expectScreenshot: ExpectScreenshotFixture;
    wait: WaitFixture;
    editor: MarkdownEditorPage;
    helpers: PlaywrightHelpers;
    debug: DebugHelpers;
    platform: NodeJS.Platform;
};

export type MountFixture = ComponentFixtures['mount'];

export interface ExpectScreenshotFixture {
    (props?: CaptureScreenshotParams): Promise<void>;
}

export interface WaitFixture {
    loadersHiddenQASelect(): Promise<void>;
    loadersHidden(): Promise<void>;
}

export interface CaptureScreenshotParams extends PageScreenshotOptions {
    nameSuffix?: string;
    component?: Locator | Page;
    themes?: Array<'light' | 'dark'>;
}
