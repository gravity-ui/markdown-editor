import type {FC} from 'react';

import {GalleryProvider} from '@gravity-ui/components';
import {YfmStaticView, type YfmStaticViewProps, useFilesGallery} from '@gravity-ui/markdown-editor';

import './ViewWithGallery.scss';

export type ViewWithGalleryProps = YfmStaticViewProps;

const getCopyUrl = (url: string) => url;
const getDownloadUrl = (url: string) => url;

const ViewWithGalleryContent: FC<ViewWithGalleryProps> = (props) => {
    const {openFilesGallery} = useFilesGallery(undefined, {
        copyUrl: getCopyUrl,
        download: getDownloadUrl,
    });

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
        <div className="view-with-gallery" onClick={openFilesGallery}>
            <YfmStaticView {...props} />
        </div>
    );
};

export const ViewWithGallery: FC<ViewWithGalleryProps> = (props) => {
    return (
        <GalleryProvider>
            <ViewWithGalleryContent {...props} />
        </GalleryProvider>
    );
};
