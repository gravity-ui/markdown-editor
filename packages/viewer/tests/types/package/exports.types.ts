import {expectTypeOf} from 'vitest';

import type * as BuiltRoot from '@gravity-ui/markdown-viewer';
import type * as BuiltExtensions from '@gravity-ui/markdown-viewer/extensions';

import type * as SourceExtensions from '../../../src/extensions';
import type * as SourceRoot from '../../../src/index';

expectTypeOf<typeof BuiltRoot>().toEqualTypeOf<typeof SourceRoot>();
expectTypeOf<BuiltRoot.MarkdownViewerProps>().toEqualTypeOf<SourceRoot.MarkdownViewerProps>();
expectTypeOf<BuiltRoot.ViewerEffect>().toEqualTypeOf<SourceRoot.ViewerEffect>();
expectTypeOf<BuiltRoot.ViewerEffectCleanup>().toEqualTypeOf<SourceRoot.ViewerEffectCleanup>();
expectTypeOf<BuiltRoot.ViewerEffectContext>().toEqualTypeOf<SourceRoot.ViewerEffectContext>();
expectTypeOf<BuiltRoot.ViewerNodeInfo>().toEqualTypeOf<SourceRoot.ViewerNodeInfo>();
expectTypeOf<BuiltRoot.ViewerTargetsProps>().toEqualTypeOf<SourceRoot.ViewerTargetsProps>();
expectTypeOf<BuiltRoot.YFMMods>().toEqualTypeOf<SourceRoot.YFMMods>();

expectTypeOf<typeof BuiltExtensions>().toEqualTypeOf<typeof SourceExtensions>();
expectTypeOf<BuiltExtensions.FilesGalleryItemType>().toEqualTypeOf<SourceExtensions.FilesGalleryItemType>();
expectTypeOf<BuiltExtensions.FilesGalleryProps>().toEqualTypeOf<SourceExtensions.FilesGalleryProps>();
expectTypeOf<BuiltExtensions.FilesGallerySource>().toEqualTypeOf<SourceExtensions.FilesGallerySource>();
expectTypeOf<BuiltExtensions.YfmCodeBlockActionsProps>().toEqualTypeOf<SourceExtensions.YfmCodeBlockActionsProps>();
