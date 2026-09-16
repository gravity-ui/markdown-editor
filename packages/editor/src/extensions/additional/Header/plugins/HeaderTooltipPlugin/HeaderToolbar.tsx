import {useCallback, useMemo} from 'react';

import {
    ArrowUpFromSquare,
    ArrowsRotateLeft,
    BucketPaint,
    Font,
    LayoutHeader,
    LayoutHeaderCellsLarge,
    LayoutSideContentRight,
    Moon,
    Palette,
    Picture,
    Plus,
    Square,
    SquareDashed,
    SquareDot,
    SquareXmark,
    Sun,
    TrashBin,
    VectorSquare,
} from '@gravity-ui/icons';
import {Popup} from '@gravity-ui/uikit';
import {useLatest} from 'react-use';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';
import {typedMemo} from 'src/react-utils/memo';
import {
    Toolbar,
    type ToolbarData,
    ToolbarDataType,
    type ToolbarGroupItemData,
    type ToolbarIconData,
    type ToolbarListButtonItemData,
} from 'src/toolbar';
import {ToolbarWrapToContext} from 'src/toolbar/ToolbarRerender';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    type HeaderAttrs,
    HeaderBackground,
    HeaderBorder,
    HeaderEdges,
    type HeaderFillValue,
    HeaderFormat,
    HeaderLayout,
    HeaderTextColor,
    MAX_HEADER_ACTIONS,
} from '../../HeaderSpecs';
import {addHeaderAction, removeHeader, setHeaderAttrs} from '../../commands';

import {FillPalette} from './FillPalette';
import {useImageUpload} from './useImageUpload';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');
const ToolbarMemoized = typedMemo(Toolbar);

type AttrKey = keyof HeaderAttrs;
type Choice = {value: string; icon: ToolbarIconData; title: string};
type ChoiceGroup = {icon: ToolbarIconData; title: string; choices: Choice[]};

/**
 * Подписи лежат рядом со значениями, а не собираются шаблоном `i18n(`${key}.${value}`)`:
 * так опечатка и новое значение ловятся компилятором, а не находятся в проде.
 */
const GROUPS = {
    format: () => ({
        icon: {data: LayoutHeader},
        title: i18n('format'),
        choices: [
            {
                value: HeaderFormat.Large,
                icon: {data: LayoutHeaderCellsLarge},
                title: i18n('format.large'),
            },
            {value: HeaderFormat.Small, icon: {data: LayoutHeader}, title: i18n('format.small')},
        ],
    }),
    edges: () => ({
        icon: {data: VectorSquare},
        title: i18n('edges'),
        choices: [
            {value: HeaderEdges.Rounded, icon: {data: Square}, title: i18n('edges.rounded')},
            {value: HeaderEdges.Bleed, icon: {data: VectorSquare}, title: i18n('edges.bleed')},
        ],
    }),
    border: () => ({
        icon: {data: SquareDashed},
        title: i18n('border'),
        choices: [
            {value: HeaderBorder.None, icon: {data: SquareXmark}, title: i18n('border.none')},
            {value: HeaderBorder.Solid, icon: {data: Square}, title: i18n('border.solid')},
            {value: HeaderBorder.Dashed, icon: {data: SquareDashed}, title: i18n('border.dashed')},
            {value: HeaderBorder.Dotted, icon: {data: SquareDot}, title: i18n('border.dotted')},
        ],
    }),
    bg: () => ({
        icon: {data: Picture},
        title: i18n('bg'),
        choices: [
            {value: HeaderBackground.Fill, icon: {data: BucketPaint}, title: i18n('bg.fill')},
            {value: HeaderBackground.Image, icon: {data: Picture}, title: i18n('bg.image')},
        ],
    }),
    layout: () => ({
        icon: {data: LayoutSideContentRight},
        title: i18n('layout'),
        choices: [
            {value: HeaderLayout.Cover, icon: {data: Picture}, title: i18n('layout.cover')},
            {
                value: HeaderLayout.Split,
                icon: {data: LayoutSideContentRight},
                title: i18n('layout.split'),
            },
        ],
    }),
    text: () => ({
        icon: {data: Font},
        title: i18n('text'),
        choices: [
            {value: HeaderTextColor.Auto, icon: {data: Font}, title: i18n('text.auto')},
            {value: HeaderTextColor.Light, icon: {data: Sun}, title: i18n('text.light')},
            {value: HeaderTextColor.Dark, icon: {data: Moon}, title: i18n('text.dark')},
        ],
    }),
} satisfies Partial<Record<AttrKey, () => ChoiceGroup>>;

export type HeaderToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    /** Загрузчик картинок хоста; без него пункт «загрузить» не показывается. */
    fileUploadHandler?: FileUploadHandler;
};

export function HeaderToolbar({node, pos, editorView, fileUploadHandler}: HeaderToolbarProps) {
    const nodeRef = useLatest(node);
    const posRef = useLatest(pos);
    const focus = useCallback(() => editorView.focus(), [editorView]);

    // Команда — единственный путь изменения, поэтому её же dry-run отвечает за `isEnable`
    const run = useCallback(
        (patch: Partial<HeaderAttrs>, dispatch = true) =>
            setHeaderAttrs(posRef.current, patch)(
                editorView.state,
                dispatch ? editorView.dispatch : undefined,
            ),
        [editorView, posRef],
    );

    // Фон и ссылка ставятся одной транзакцией: два последовательных вызова затирали бы друг друга
    const onUploaded = useCallback(
        (url: string) => {
            setHeaderAttrs(posRef.current, {bg: HeaderBackground.Image, image: url})(
                editorView.state,
                editorView.dispatch,
            );
        },
        [editorView, posRef],
    );
    const upload = useImageUpload(fileUploadHandler, onUploaded);

    const toolbarData = useMemo<ToolbarData<EditorView>>(() => {
        const attrOf = <K extends AttrKey>(key: K) => nodeRef.current.attrs[key] as HeaderAttrs[K];

        const choiceGroup = (key: keyof typeof GROUPS): ToolbarGroupItemData<EditorView> => {
            const group = GROUPS[key]();
            return {
                id: `header-${key}`,
                type: ToolbarDataType.ListButton,
                icon: group.icon,
                title: group.title,
                withArrow: true,
                // У оси всегда есть выбранное значение, поэтому без этого флага кнопка подсвечена
                // постоянно и панель выглядит залитой. Текущее значение показывает галочка в меню.
                alwaysActive: true,
                data: group.choices.map<ToolbarListButtonItemData<EditorView>>((choice) => ({
                    id: `header-${key}-${choice.value}`,
                    icon: choice.icon,
                    title: choice.title,
                    isActive: () => attrOf(key) === choice.value,
                    isEnable: () => run({[key]: choice.value} as Partial<HeaderAttrs>, false),
                    exec: () => run({[key]: choice.value} as Partial<HeaderAttrs>),
                })),
            };
        };

        const isImage = () => attrOf('bg') === HeaderBackground.Image;

        const shape: ToolbarGroupItemData<EditorView>[] = [
            choiceGroup('format'),
            choiceGroup('edges'),
            choiceGroup('border'),
        ];

        const colour: ToolbarGroupItemData<EditorView>[] = [
            {
                id: 'header-fill',
                type: ToolbarDataType.ButtonPopup,
                icon: {data: Palette},
                title: i18n('fill'),
                isActive: () => false,
                isEnable: () => !isImage(),
                hintWhenDisabled: () => i18n('fill.hint_image'),
                exec: () => {},
                renderPopup: ({hide, anchorElement}) => (
                    <Popup
                        open
                        anchorElement={anchorElement}
                        onOpenChange={(open) => !open && hide()}
                    >
                        <div className={b('palette')}>
                            <FillPalette
                                value={attrOf('fill')}
                                onSelect={(fill: HeaderFillValue) => {
                                    run({fill});
                                    hide();
                                }}
                            />
                        </div>
                    </Popup>
                ),
            },
            choiceGroup('text'),
        ];

        const background: ToolbarGroupItemData<EditorView>[] = [choiceGroup('bg')];
        if (isImage()) {
            background.push(choiceGroup('layout'));
            if (upload.pick) {
                const pick = upload.pick;
                background.push({
                    id: 'header-image-upload',
                    type: ToolbarDataType.SingleButton,
                    icon: {data: ArrowUpFromSquare},
                    title: i18n('image.upload'),
                    isActive: () => false,
                    isEnable: () => !upload.uploading,
                    exec: pick,
                });
            }
            background.push({
                id: 'header-image-reset',
                type: ToolbarDataType.SingleButton,
                icon: {data: ArrowsRotateLeft},
                title: i18n('image.reset'),
                isActive: () => false,
                isEnable: () => Boolean(attrOf('image')),
                // Сброс возвращает и фон: иначе остаётся пустой слот с пунктирной рамкой
                exec: () => run({image: '', bg: HeaderBackground.Fill}),
            });
        }

        const block: ToolbarGroupItemData<EditorView>[] = [
            {
                id: 'header-cta-add',
                type: ToolbarDataType.SingleButton,
                icon: {data: Plus},
                title: i18n('cta.add'),
                isActive: () => false,
                isEnable: () => addHeaderAction(posRef.current)(editorView.state),
                hintWhenDisabled: () => i18n('cta.limit', {count: MAX_HEADER_ACTIONS}),
                exec: () => addHeaderAction(posRef.current)(editorView.state, editorView.dispatch),
            },
            {
                id: 'header-remove',
                type: ToolbarDataType.SingleButton,
                icon: {data: TrashBin},
                title: i18n('remove'),
                theme: 'danger',
                isActive: () => false,
                isEnable: () => true,
                exec: () => removeHeader(posRef.current)(editorView.state, editorView.dispatch),
            },
        ];

        return [shape, colour, background, block];
    }, [editorView, nodeRef, posRef, upload, run]);

    return (
        <ToolbarWrapToContext editor={editorView}>
            <ToolbarMemoized
                editor={editorView}
                focus={focus}
                className={b()}
                qa="g-md-toolbar-header"
                data={toolbarData}
            />
        </ToolbarWrapToContext>
    );
}
