import {useCallback, useMemo} from 'react';

import {
    Aperture,
    ArrowsRotateLeft,
    BucketPaint,
    Circles4Square,
    Dots9,
    Layers3Diagonal,
    LayoutHeader,
    Moon,
    Palette,
    Picture,
    Shapes3,
    TrashBin,
} from '@gravity-ui/icons';
import {useToaster} from '@gravity-ui/uikit';
import {useLatest} from 'react-use';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/header';
import {typedMemo} from 'src/react-utils/memo';
import {Toolbar, type ToolbarData, ToolbarDataType, type ToolbarIconData} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    HeaderAttr,
    type HeaderAttrs,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderEffect,
    type HeaderEffectValue,
    type HeaderFillValue,
    HeaderFormat,
    type HeaderFormatValue,
} from '../../HeaderSpecs';
import {
    type HeaderPatch,
    generateHeaderLook,
    headerAt,
    removeHeader,
    removeHeaderImage,
    setHeaderAttrs,
} from '../../commands';
import {uploadHeaderImage} from '../imageUpload';

import {HeaderPalette} from './HeaderPalette';

const ToolbarMemoized = typedMemo(Toolbar);

type AttrItem<T extends string> = {value: T; icon: ToolbarIconData; label: () => string};

const FORMAT_ITEMS: AttrItem<HeaderFormatValue>[] = [
    {value: HeaderFormat.Large, icon: {data: LayoutHeader}, label: () => i18n('format_large')},
    {value: HeaderFormat.Small, icon: {data: LayoutHeader}, label: () => i18n('format_small')},
];

const BACKGROUND_ITEMS: AttrItem<HeaderBackgroundValue>[] = [
    {value: HeaderBackground.Fill, icon: {data: BucketPaint}, label: () => i18n('bg_fill')},
    {value: HeaderBackground.Shapes, icon: {data: Shapes3}, label: () => i18n('bg_shapes')},
    {
        value: HeaderBackground.Gradient,
        icon: {data: Layers3Diagonal},
        label: () => i18n('bg_gradient'),
    },
    {value: HeaderBackground.Mesh, icon: {data: Circles4Square}, label: () => i18n('bg_mesh')},
    {value: HeaderBackground.Pattern, icon: {data: Dots9}, label: () => i18n('bg_pattern')},
];

/** Слой поверх изображения занимает в меню место фона: под снимком фон всё равно не виден. */
const EFFECT_ITEMS: AttrItem<HeaderEffectValue>[] = [
    {value: HeaderEffect.None, icon: {data: Picture}, label: () => i18n('effect_none')},
    {
        value: HeaderEffect.Gradient,
        icon: {data: Layers3Diagonal},
        label: () => i18n('effect_gradient'),
    },
    {value: HeaderEffect.Dim, icon: {data: Moon}, label: () => i18n('effect_dim')},
    {value: HeaderEffect.Blur, icon: {data: Aperture}, label: () => i18n('effect_blur')},
];

export type HeaderToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    fileUploadHandler?: FileUploadHandler;
};

export function HeaderToolbar({node, pos, editorView, fileUploadHandler}: HeaderToolbarProps) {
    const posRef = useLatest(pos);
    const nodeRef = useLatest(node);
    const toaster = useToaster();
    const withImage = Boolean(node.attrs[HeaderAttr.Image]);

    const onFocus = useCallback(() => editorView.focus(), [editorView]);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        const attrOf = <T = string,>(attr: keyof HeaderAttrs): T =>
            nodeRef.current.attrs[attr] as T;
        const canEdit = (view: EditorView) => Boolean(headerAt(view.state.doc, posRef.current));

        const listItem = (attr: keyof HeaderAttrs, item: AttrItem<string>, patch: HeaderPatch) => ({
            id: `header-${attr}-${item.value}`,
            title: item.label(),
            icon: item.icon,
            isActive: () => attrOf(attr) === item.value,
            isEnable: canEdit,
            exec: (view: EditorView) =>
                setHeaderAttrs(posRef.current, patch)(view.state, view.dispatch),
        });

        return [
            [
                {
                    id: 'header-format',
                    type: ToolbarDataType.ListButton,
                    icon: {data: LayoutHeader},
                    title: i18n('format'),
                    withArrow: true,
                    data: FORMAT_ITEMS.map((item) =>
                        listItem(HeaderAttr.Format, item, {[HeaderAttr.Format]: item.value}),
                    ),
                },
                {
                    id: 'header-bg',
                    type: ToolbarDataType.ListButton,
                    icon: {data: BucketPaint},
                    title: i18n('background'),
                    withArrow: true,
                    data: withImage
                        ? EFFECT_ITEMS.map((item) =>
                              listItem(HeaderAttr.Effect, item, {[HeaderAttr.Effect]: item.value}),
                          )
                        : BACKGROUND_ITEMS.map((item) =>
                              listItem(HeaderAttr.Background, item, {
                                  [HeaderAttr.Background]: item.value,
                              }),
                          ),
                },
            ],
            [
                {
                    id: 'header-fill',
                    type: ToolbarDataType.ButtonPopup,
                    icon: {data: Palette},
                    title: i18n('color'),
                    isActive: () => false,
                    isEnable: canEdit,
                    exec: () => {},
                    renderPopup: ({anchorElement, hide, editor}) => (
                        <HeaderPalette
                            value={attrOf<HeaderFillValue>(HeaderAttr.Fill)}
                            anchorElement={anchorElement}
                            hide={hide}
                            onPick={(fill) =>
                                setHeaderAttrs(posRef.current, {[HeaderAttr.Fill]: fill})(
                                    editor.state,
                                    editor.dispatch,
                                )
                            }
                        />
                    ),
                },
                {
                    id: 'header-generate',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: ArrowsRotateLeft},
                    title: i18n('generate'),
                    isActive: () => false,
                    // Под снимком новый фон не виден — кроме градиента, который берёт цвет заливки.
                    isEnable: (view: EditorView) =>
                        (!withImage || attrOf(HeaderAttr.Effect) === HeaderEffect.Gradient) &&
                        generateHeaderLook(posRef.current)(view.state),
                    exec: (view: EditorView) =>
                        generateHeaderLook(posRef.current)(view.state, view.dispatch),
                },
            ],
            [
                {
                    id: 'header-image',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: Picture},
                    title: withImage ? i18n('image_remove') : i18n('image_add'),
                    isActive: () => withImage,
                    isEnable: (view: EditorView) =>
                        withImage
                            ? removeHeaderImage(posRef.current)(view.state)
                            : Boolean(fileUploadHandler),
                    exec: (view: EditorView) => {
                        if (withImage) {
                            removeHeaderImage(posRef.current)(view.state, view.dispatch);
                            return;
                        }
                        if (!fileUploadHandler) return;

                        uploadHeaderImage(view, posRef.current, fileUploadHandler).then(
                            (result) => {
                                if (result === 'failed') {
                                    toaster.add({
                                        name: 'header-image-upload',
                                        theme: 'danger',
                                        title: i18n('image_error'),
                                    });
                                }
                            },
                        );
                    },
                },
            ],
            [
                {
                    id: 'header-remove',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: TrashBin},
                    title: i18n('remove'),
                    theme: 'danger',
                    isActive: () => false,
                    isEnable: (view: EditorView) => removeHeader(posRef.current)(view.state),
                    exec: (view: EditorView) =>
                        removeHeader(posRef.current)(view.state, view.dispatch),
                },
            ],
        ];
    }, [fileUploadHandler, nodeRef, posRef, toaster, withImage]);

    return (
        <ToolbarWrapToContext editor={editorView}>
            <ToolbarMemoized
                editor={editorView}
                focus={onFocus}
                qa="g-md-toolbar-header"
                data={toolbarData}
            />
        </ToolbarWrapToContext>
    );
}
