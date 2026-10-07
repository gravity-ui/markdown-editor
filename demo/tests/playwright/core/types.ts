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

import type {PlaywrightActions} from 'playwright/core/actions';

import type {MarkdownEditorPage} from './editor';
import type {DebugHelpers, PlaywrightHelpers} from './helpers';

export interface MountExtraOptions {
    width?: number | string;
    rootStyle?: React.CSSProperties;
    hidePlaygroundBlocks?: boolean;
    styles?: string;
}

interface ComponentFixtures {
    mount<HooksConfig>(
        component: JSX.Element,
        options?: MountOptions<HooksConfig> & MountExtraOptions,
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
    actions: PlaywrightActions;
    editor: MarkdownEditorPage;
    helpers: PlaywrightHelpers;
    debug: DebugHelpers;
    platform: NodeJS.Platform;
};

// Playwright's own `mount` fixture also accepts a story id, so the overridden fixture has to
// keep that call signature alongside the component one to stay assignable to the base fixture.
export type MountFixture = PlaywrightFixtures['mount'];

export interface ExpectScreenshotFixture {
    (props?: CaptureScreenshotParams): Promise<void>;
}

export interface WaitFixture {
    loadersHiddenQASelect(): Promise<void>;
    loadersHidden(): Promise<void>;
    visible(selector: Locator): Promise<void>;
    hidden(selector: Locator): Promise<void>;
    timeout(delay?: number): Promise<void>;
}

export interface CaptureScreenshotParams extends PageScreenshotOptions {
    nameSuffix?: string;
    component?: Locator | Page;
    themes?: readonly ('light' | 'dark')[];
}
