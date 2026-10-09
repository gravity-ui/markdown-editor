import type {ComponentProps, ComponentType, FC} from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StoryModule = {default: {component?: ComponentType<any>}};

type StoryProps<M extends StoryModule> = Partial<
    ComponentProps<NonNullable<M['default']['component']>>
>;

export type Stories<M extends StoryModule> = {
    [K in Exclude<keyof M, 'default'>]: FC<StoryProps<M>>;
};

/**
 * `composeStories` of @storybook/react adds its runtime to every test page, about 2 MB of script
 * per mount. Visual tests need nothing of it but the args, so they are merged here instead.
 *
 * Loaders and the `beforeEach` of a story stay unapplied, as they do with `composeStories` until
 * a story is awaited with `load()`.
 */
export function composeStories<M extends StoryModule>(
    storyModule: M,
    overrides?: StoryProps<M>,
): Stories<M> {
    const {default: meta, ...stories} = storyModule;
    // a story module always declares the component it renders
    const Component = meta.component as ComponentType<StoryProps<M>>;
    const metaArgs = (meta as {args?: StoryProps<M>}).args;

    const composed = Object.entries(stories).map(([name, story]) => {
        const storyArgs = (story as {args?: StoryProps<M>}).args;

        const Story: FC<StoryProps<M>> = (props) => (
            <Component {...metaArgs} {...storyArgs} {...overrides} {...props} />
        );
        Story.displayName = name;

        return [name, Story] as const;
    });

    return Object.fromEntries(composed) as Stories<M>;
}
