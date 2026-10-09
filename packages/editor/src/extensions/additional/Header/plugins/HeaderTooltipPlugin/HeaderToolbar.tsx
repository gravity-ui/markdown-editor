import {useCallback, useMemo} from 'react';

import {
    Aperture,
    ArrowsRotateLeft,
    BucketPaint,
    ChevronDown,
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
import {
    Toolbar,
    type ToolbarData,
    ToolbarDataType,
    type ToolbarGroupItemData,
    type ToolbarIconData,
} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    HeaderAttr,
    type HeaderAttrs,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderDirection,
    HeaderEffect,
    type HeaderEffectValue,
    type HeaderFillValue,
    HeaderFit,
    HeaderFocus,
    HeaderFormat,
    type HeaderFormatValue,
    HeaderLayer,
    HeaderScale,
    HeaderShapes,
    HeaderText,
    hasImage,
    isCovered,
    normalizeHeaderAttrs,
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

/** Слой поверх изображения занимает в меню место фона: под снимком на всю площадь фон не виден. */
const EFFECT_ITEMS: AttrItem<HeaderEffectValue>[] = [
    {value: HeaderEffect.None, icon: {data: Picture}, label: () => i18n('effect_none')},
    {
        value: HeaderEffect.Fade,
        icon: {data: Layers3Diagonal},
        label: () => i18n('effect_fade'),
    },
    {value: HeaderEffect.Darken, icon: {data: Moon}, label: () => i18n('effect_darken')},
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

    const attrs = normalizeHeaderAttrs(node.attrs);
    const background = attrs[HeaderAttr.Background];
    const withImage = hasImage(attrs);
    const withEffects = isCovered(attrs);
    const withSecondFill =
        background === HeaderBackground.Gradient || background === HeaderBackground.Mesh;

    const onFocus = useCallback(() => editorView.focus(), [editorView]);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        const attrOf = <T = string,>(attr: keyof HeaderAttrs): T =>
            nodeRef.current.attrs[attr] as T;
        const canEdit = (view: EditorView) => Boolean(headerAt(view.state.doc, posRef.current));
        const patch = (view: EditorView, next: HeaderPatch) =>
            setHeaderAttrs(posRef.current, next)(view.state, view.dispatch);

        const attrList = <T extends string>(attr: keyof HeaderAttrs, items: AttrItem<T>[]) =>
            items.map((item) => ({
                id: `header-${attr}-${item.value}`,
                title: item.label(),
                icon: item.icon,
                isActive: () => attrOf(attr) === item.value,
                isEnable: canEdit,
                exec: (view: EditorView) =>
                    patch(view, {
                        [attr]: item.value,
                        ...(attr === HeaderAttr.Layer && item.value !== HeaderLayer.Full
                            ? {[HeaderAttr.Text]: HeaderText.Auto}
                            : {}),
                    }),
            }));

        const backgroundGroup: ToolbarGroupItemData<EditorView>[] = [
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
                        secondValue={
                            withSecondFill ? attrOf<HeaderFillValue>(HeaderAttr.Fill2) : undefined
                        }
                        anchorElement={anchorElement}
                        hide={hide}
                        onPick={(attr, fill) => patch(editor, {[attr]: fill})}
                    />
                ),
            },
        ];

        const optionItems = <T extends string>(
            attr: keyof HeaderAttrs,
            values: readonly T[],
            icon: ToolbarIconData,
        ) =>
            values.map((value) => ({
                value,
                icon,
                label: () => i18n(`${attr}_${value}` as Parameters<typeof i18n>[0]),
            }));
        const optionGroup = <T extends string>(
            attr: keyof HeaderAttrs,
            values: readonly T[],
            icon: ToolbarIconData,
            title: string,
        ): ToolbarGroupItemData<EditorView> => ({
            id: `header-${attr}`,
            type: ToolbarDataType.ListButton,
            icon,
            title,
            withArrow: true,
            data: attrList(attr, optionItems(attr, values, icon)),
        });

        if (background === HeaderBackground.Gradient) {
            backgroundGroup.push(
                optionGroup(
                    HeaderAttr.Direction,
                    Object.values(HeaderDirection),
                    {data: Layers3Diagonal},
                    i18n('direction'),
                ),
            );
        }
        if (background === HeaderBackground.Shapes || background === HeaderBackground.Mesh) {
            backgroundGroup.push(
                optionGroup(
                    HeaderAttr.Shapes,
                    Object.values(HeaderShapes),
                    {data: Shapes3},
                    i18n('shapes'),
                ),
            );
        }
        if (
            background === HeaderBackground.Pattern ||
            (withImage && attrs[HeaderAttr.Layer] === HeaderLayer.Tile)
        ) {
            backgroundGroup.push(
                optionGroup(
                    HeaderAttr.Scale,
                    Object.values(HeaderScale),
                    {data: Dots9},
                    i18n('scale'),
                ),
            );
        }

        backgroundGroup.push({
            id: 'header-generate',
            type: ToolbarDataType.SingleButton,
            icon: {data: ArrowsRotateLeft},
            title: i18n('generate'),
            isActive: () => false,
            // Под снимком на всю площадь новый фон не виден — кроме градиента, берущего цвет заливки.
            isEnable: (view: EditorView) =>
                (!withEffects || attrOf(HeaderAttr.Effect) === HeaderEffect.Fade) &&
                generateHeaderLook(posRef.current)(view.state),
            exec: (view: EditorView) =>
                generateHeaderLook(posRef.current)(view.state, view.dispatch),
        });

        const imageGroup: ToolbarGroupItemData<EditorView>[] = [
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

                    uploadHeaderImage(view, posRef.current, fileUploadHandler).then((result) => {
                        if (result === 'failed') {
                            toaster.add({
                                name: 'header-image-upload',
                                theme: 'danger',
                                title: i18n('image_error'),
                            });
                        }
                    });
                },
            },
        ];

        if (withEffects) {
            imageGroup.push({
                id: 'header-effect',
                type: ToolbarDataType.ListButton,
                icon: {data: ChevronDown},
                title: i18n('image_effect'),
                data: attrList(HeaderAttr.Effect, EFFECT_ITEMS),
            });
        }
        if (withImage) {
            imageGroup.push(
                optionGroup(
                    HeaderAttr.Layer,
                    Object.values(HeaderLayer),
                    {data: Picture},
                    i18n('layer'),
                ),
            );
            if (attrs[HeaderAttr.Layer] !== HeaderLayer.Tile) {
                imageGroup.push(
                    optionGroup(
                        HeaderAttr.Fit,
                        Object.values(HeaderFit),
                        {data: Picture},
                        i18n('fit'),
                    ),
                );
                imageGroup.push(
                    optionGroup(
                        HeaderAttr.Focus,
                        Object.values(HeaderFocus),
                        {data: Picture},
                        i18n('focus'),
                    ),
                );
            }
            imageGroup.push(
                optionGroup(
                    HeaderAttr.Text,
                    Object.values(HeaderText),
                    {data: Palette},
                    i18n('text'),
                ),
            );
        }

        return [
            [
                {
                    id: 'header-format',
                    type: ToolbarDataType.ListButton,
                    icon: {data: LayoutHeader},
                    title: i18n('format'),
                    withArrow: true,
                    data: attrList(HeaderAttr.Format, FORMAT_ITEMS),
                },
                {
                    id: 'header-bg',
                    type: ToolbarDataType.ListButton,
                    icon: {data: BucketPaint},
                    title: i18n('background'),
                    withArrow: true,
                    data: attrList(HeaderAttr.Background, BACKGROUND_ITEMS),
                },
            ],
            backgroundGroup,
            imageGroup,
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
    }, [
        fileUploadHandler,
        nodeRef,
        posRef,
        toaster,
        attrs,
        background,
        withEffects,
        withImage,
        withSecondFill,
    ]);

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
