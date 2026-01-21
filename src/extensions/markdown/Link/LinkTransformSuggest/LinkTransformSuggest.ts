import type {Extension} from '#core';

import {LinkSuggestHandler} from './handler';
import {linkTransformSuggest} from './plugin';
import type {SuggestItem} from './types';

type SuggestStorage = Map<string, SuggestItem>;

export const LinkTransformSuggest: Extension = (builder) => {
    builder.context.set('linkTransformSuggestConfig', new Map());

    builder.addPlugin(() => {
        const storage = builder.context.get('linkTransformSuggestConfig');
        if (!storage?.size) return [];

        const items = Array.from(storage.values()).sort(
            (a, b) => (a.priority || 0) - (b.priority || 0),
        );

        return linkTransformSuggest({
            createHandler: (view) =>
                new LinkSuggestHandler(view, {
                    items,
                    logger: builder.logger.nested({
                        module: 'link-transform-suggest',
                    }),
                }),
        });
    });
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            linkTransformSuggestConfig: SuggestStorage;
        }
    }
}
