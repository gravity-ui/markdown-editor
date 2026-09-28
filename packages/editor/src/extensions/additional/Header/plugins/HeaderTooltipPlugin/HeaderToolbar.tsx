import {useCallback, useMemo} from 'react';

import {
    ArrowsRotateLeft,
    LayoutHeader,
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
import {Toolbar, type ToolbarData, ToolbarDataType} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    HEADER_FILLS,
    HeaderAttr,
    type HeaderAttrs,
    HeaderBackground,
    HeaderDecor,
    HeaderEffect,
    HeaderFormat,
} from '../../HeaderSpecs';
import {generateHeaderLook, removeHeader, setHeaderAttrs} from '../../commands';
import {uploadHeaderImage} from '../imageUpload';

const ToolbarMemoized = typedMemo(Toolbar);

const FORMAT_LABEL = {
    [HeaderFormat.Large]: () => i18n('format_large'),
    [HeaderFormat.Small]: () => i18n('format_small'),
};

const BACKGROUND_LABEL = {
    [HeaderBackground.Fill]: () => i18n('bg_fill'),
    [HeaderBackground.Gradient]: () => i18n('bg_gradient'),
    [HeaderBackground.Mesh]: () => i18n('bg_mesh'),
    [HeaderBackground.Pattern]: () => i18n('bg_pattern'),
    [HeaderBackground.Image]: () => i18n('bg_image'),
};

const EFFECT_LABEL = {
    [HeaderEffect.None]: () => i18n('effect_none'),
    [HeaderEffect.Blur]: () => i18n('effect_blur'),
    [HeaderEffect.Dim]: () => i18n('effect_dim'),
    [HeaderEffect.Gradient]: () => i18n('effect_gradient'),
};

const FILL_LABEL = {
    blue: () => i18n('color_blue'),
    indigo: () => i18n('color_indigo'),
    purple: () => i18n('color_purple'),
    teal: () => i18n('color_teal'),
    green: () => i18n('color_green'),
    amber: () => i18n('color_amber'),
    red: () => i18n('color_red'),
    navy: () => i18n('color_navy'),
};

const toggleDecor = (pos: number, node: Node) =>
    setHeaderAttrs(pos, {
        [HeaderAttr.Decor]:
            node.attrs[HeaderAttr.Decor] === HeaderDecor.Shapes
                ? HeaderDecor.None
                : HeaderDecor.Shapes,
    });

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

    const onFocus = useCallback(() => editorView.focus(), [editorView]);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        const attrOf = <T,>(attr: keyof HeaderAttrs): T => nodeRef.current.attrs[attr] as T;

        const patchItem = (id: string, attr: keyof HeaderAttrs, value: string, title: string) => ({
            id,
            title,
            icon: {data: LayoutHeader},
            isActive: () => attrOf(attr) === value,
            isEnable: (view: EditorView) =>
                setHeaderAttrs(posRef.current, {[attr]: value})(view.state),
            exec: (view: EditorView) =>
                setHeaderAttrs(posRef.current, {[attr]: value})(view.state, view.dispatch),
        });

        return [
            [
                {
                    id: 'header-format',
                    type: ToolbarDataType.ListButton,
                    icon: {data: LayoutHeader},
                    title: i18n('format'),
                    withArrow: true,
                    data: Object.values(HeaderFormat).map((value) =>
                        patchItem(
                            `header-format-${value}`,
                            HeaderAttr.Format,
                            value,
                            FORMAT_LABEL[value](),
                        ),
                    ),
                },
                {
                    id: 'header-bg',
                    type: ToolbarDataType.ListButton,
                    icon: {data: Shapes3},
                    title: i18n('background'),
                    withArrow: true,
                    data: Object.values(HeaderBackground).map((value) =>
                        patchItem(
                            `header-bg-${value}`,
                            HeaderAttr.Background,
                            value,
                            BACKGROUND_LABEL[value](),
                        ),
                    ),
                },
                {
                    id: 'header-fill',
                    type: ToolbarDataType.ListButton,
                    icon: {data: Palette},
                    title: i18n('color'),
                    withArrow: true,
                    data: HEADER_FILLS.map((value) =>
                        patchItem(
                            `header-fill-${value}`,
                            HeaderAttr.Fill,
                            value,
                            FILL_LABEL[value](),
                        ),
                    ),
                },
                {
                    id: 'header-effect',
                    type: ToolbarDataType.ListButton,
                    icon: {data: Picture},
                    title: i18n('effect'),
                    withArrow: true,
                    hideDisabled: true,
                    data: Object.values(HeaderEffect).map((value) => ({
                        ...patchItem(
                            `header-effect-${value}`,
                            HeaderAttr.Effect,
                            value,
                            EFFECT_LABEL[value](),
                        ),
                        isEnable: (view: EditorView) =>
                            attrOf(HeaderAttr.Background) === HeaderBackground.Image &&
                            setHeaderAttrs(posRef.current, {[HeaderAttr.Effect]: value})(
                                view.state,
                            ),
                    })),
                },
            ],
            [
                {
                    id: 'header-decor',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: Shapes3},
                    title: i18n('decor'),
                    isActive: () => attrOf(HeaderAttr.Decor) === HeaderDecor.Shapes,
                    isEnable: (view: EditorView) =>
                        attrOf(HeaderAttr.Background) === HeaderBackground.Fill &&
                        toggleDecor(posRef.current, nodeRef.current)(view.state),
                    exec: (view: EditorView) =>
                        toggleDecor(posRef.current, nodeRef.current)(view.state, view.dispatch),
                },
                {
                    id: 'header-generate',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: ArrowsRotateLeft},
                    title: i18n('generate'),
                    isActive: () => false,
                    isEnable: (view: EditorView) => generateHeaderLook(posRef.current)(view.state),
                    exec: (view: EditorView) =>
                        generateHeaderLook(posRef.current)(view.state, view.dispatch),
                },
                {
                    id: 'header-image',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: Picture},
                    title: i18n('image_add'),
                    isActive: () => attrOf(HeaderAttr.Background) === HeaderBackground.Image,
                    isEnable: () => Boolean(fileUploadHandler),
                    exec: (view: EditorView) => {
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
    }, [fileUploadHandler, nodeRef, posRef, toaster]);

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
