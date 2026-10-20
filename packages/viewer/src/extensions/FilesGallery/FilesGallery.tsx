import {useGallery} from '@gravity-ui/components';

import {VIEWER_SLOT_ATTRIBUTE} from '../../components/ViewerTargets/constants';
import {useViewerEffect} from '../../hooks/use-viewer-effect';
import {cn} from '../../utils/classname';

import {collectGallery} from './helpers/collect-gallery';
import {i18n} from './i18n';
import type {FilesGalleryProps} from './types';

import './FilesGallery.scss';

const b = cn('files-gallery');

export function FilesGallery({
    additionalItems,
    getDownloadUrl,
    getCopyUrl,
    onLinkCopied,
    transformItem,
    resolveCustomItem,
}: FilesGalleryProps) {
    const {openGallery} = useGallery();
    const {t} = i18n.useTranslation();

    useViewerEffect(
        ({root, signal}) => {
            const container = root.parentElement;
            const hadClass = container?.classList.contains(b());
            container?.classList.add(b());

            function handleClick(event: MouseEvent) {
                if (
                    event.defaultPrevented ||
                    event.button !== 0 ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                )
                    return;

                const clickedElement = event.target;
                if (!(clickedElement instanceof Element)) return;

                const slot = clickedElement.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`);
                if (slot && root.contains(slot)) return;

                const target = clickedElement.closest('img,a');
                if (!target || !root.contains(target)) return;
                if (target.tagName === 'IMG' && target.closest('a')) return;

                const gallery = collectGallery(
                    root,
                    target,
                    {
                        additionalItems,
                        getDownloadUrl,
                        getCopyUrl,
                        onLinkCopied,
                        transformItem,
                        resolveCustomItem,
                    },
                    t('copy_link'),
                );
                if (!gallery) return;

                event.preventDefault();
                openGallery(gallery.items, gallery.initialIndex);
            }

            root.addEventListener('click', handleClick, {signal});
            return () => {
                if (!hadClass) container?.classList.remove(b());
            };
        },
        [
            additionalItems,
            getDownloadUrl,
            getCopyUrl,
            transformItem,
            resolveCustomItem,
            openGallery,
            onLinkCopied,
            t,
        ],
    );

    return null;
}
