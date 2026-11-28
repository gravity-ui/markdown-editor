import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerClassName} from '@gravity-ui/markdown-plugin-banner';

import {
    type Toolbars,
    type Tooltips,
    blockToolbarPopup,
    blockTooltip,
} from '../../../../components/BlockToolbar';
import {bannerPlacement} from '../../../../utils/placement';
import {isButtonSettingsOpen} from '../../../Button/plugins/ButtonSettingsPlugin';
import {bannerNodeType} from '../../BannerSpecs';
import type {BannerUploadOptions} from '../../index';
import {bannerParts} from '../../utils';

import {BannerToolbar} from './BannerToolbar';

const toolbars: Toolbars = new WeakMap();
const tooltips: Tooltips = new WeakMap();
const companions = new WeakMap<EditorView, Element>();
const settings = new WeakMap<EditorView, Element>();

export const bannerToolbar = (view: EditorView) => toolbars.get(view);

export const showBannerToolbar = (view: EditorView) => tooltips.get(view)?.show();

export const keepBannerToolbarWith = (view: EditorView, element: Element | null) => {
    if (element) companions.set(view, element);
    else companions.delete(view);
};

/** `options` is read on render, after the editor context is set. */
export const bannerTooltip = (options: () => BannerUploadOptions) =>
    blockTooltip({
        idPrefix: 'banner-tooltip',
        nodeType: bannerNodeType,
        placement: bannerPlacement,
        popupClassName: blockToolbarPopup(),
        hoverSelector: '.' + bannerClassName,
        toolbars,
        tooltips,
        keepWithin: (view, target) =>
            Boolean(companions.get(view)?.contains(target) || settings.get(view)?.contains(target)),
        watch: (_state, node) => Object.values(bannerParts(node)).join(),
        skip: isButtonSettingsOpen,
        content: (view, {node, pos, dom}, {serializer, markupParser}) => (
            <BannerToolbar
                view={view}
                attrs={node.attrs}
                pos={pos}
                block={dom}
                parts={bannerParts(node)}
                onSettingsLayer={(element) => {
                    if (element) settings.set(view, element);
                    else settings.delete(view);
                }}
                markup={() => {
                    const {doc} = view.state;
                    return serializer.serialize(doc.type.create(null, doc.nodeAt(pos) ?? node));
                }}
                parser={markupParser}
                {...options()}
            />
        ),
    });
