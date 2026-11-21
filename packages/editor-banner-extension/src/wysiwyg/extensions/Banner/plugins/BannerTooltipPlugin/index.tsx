import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {buttonSettingsOpen} from '../../../Button/plugins/ButtonSettingsPlugin';
import {type Toolbars, type Tooltips, blockTooltip} from '../../../blockToolbar';
import {bannerPlacement} from '../../../placement';
import type {BannerOptions} from '../../Banner';
import {bannerNodeType} from '../../BannerSpecs';
import {bannerParts} from '../../utils';

import {BannerToolbar} from './BannerToolbar';

const toolbars: Toolbars = new WeakMap();
const tooltips: Tooltips = new WeakMap();
const companions = new WeakMap<EditorView, Element>();

export const bannerToolbar = (view: EditorView) => toolbars.get(view);

export const showBannerToolbar = (view: EditorView) => tooltips.get(view)?.show();

export const keepBannerToolbarWith = (view: EditorView, element: Element | null) => {
    if (element) companions.set(view, element);
    else companions.delete(view);
};

export const bannerTooltip = (options: BannerOptions) =>
    blockTooltip({
        idPrefix: 'banner-tooltip',
        nodeType: bannerNodeType,
        placement: bannerPlacement,
        toolbars,
        tooltips,
        keepWithin: (view) => companions.get(view),
        watch: (_state, node) => Object.values(bannerParts(node)).join(),
        skip: buttonSettingsOpen,
        content: (view, {node, pos, dom}, {serializer}) => (
            <BannerToolbar
                view={view}
                attrs={node.attrs}
                pos={pos}
                block={dom}
                parts={bannerParts(node)}
                markup={() => {
                    const {doc} = view.state;
                    return serializer.serialize(doc.type.create(null, doc.nodeAt(pos) ?? node));
                }}
                {...options}
            />
        ),
    });
