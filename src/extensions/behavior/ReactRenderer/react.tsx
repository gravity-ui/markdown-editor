import React, {memo, useEffect} from 'react';

import {useUpdate} from 'react-use';

import {RenderStorage, RenderStorageItem} from './types';

export type RendererProps = {
    storage: RenderStorage<React.ReactNode>;
};

export const Renderer = memo<RendererProps>(({storage}) => {
    const update = useUpdate();
    useEffect(() => {
        storage.on('update', update);
        return () => {
            storage.off('update', update);
        };
    }, [storage, update]);

    return (
        <>
            {storage.getItems().map((item) => (
                <ItemRenderer key={item.id} item={item} />
            ))}
        </>
    );
});
Renderer.displayName = 'ReactRenderer';

type ItemRendererProps = {
    item: RenderStorageItem<React.ReactNode>;
};

const ItemRenderer = memo<ItemRendererProps>(({item}) => {
    const update = useUpdate();
    useEffect(() => {
        item.on('rerender', update);
        return () => {
            item.off('rerender', update);
        };
    }, [item, update]);
    return <>{item.render()}</>;
});
ItemRenderer.displayName = 'ReactItemRenderer';
