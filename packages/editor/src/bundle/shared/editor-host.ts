import type {ReactNode} from 'react';

import type {CommonEditor} from 'src/common';
import type {Logger2} from 'src/logger';
import type {RenderStorage} from 'src/modules/react-renderer';

import type {ModeEvents} from './events';

/** @internal */
export interface EditorHost extends ModeEvents, Pick<CommonEditor, 'focus'> {
    readonly logger: Logger2.ILogger;
    readonly renderStorage: RenderStorage<ReactNode>;
    readonly mobile: boolean;
    destroy(): void;
}
