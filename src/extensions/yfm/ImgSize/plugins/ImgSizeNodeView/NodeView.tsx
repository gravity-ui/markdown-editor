import {HTMLAttributes, useCallback, useEffect, useRef} from 'react';

import {cn} from '../../../../../classname';
import {ReactNodeViewProps, useNodeEditing, useNodeHovered} from '../../../../../react-utils';
import {ResizeDirection, useNodeResizing} from '../../../../../react-utils/useNodeResizing';
import {removeNode} from '../../../../../utils';
import {Resizable} from '../../../../behavior/Resizable/Resizable';
import {ImgSizeAttr} from '../../ImgSizeSpecs';
import {imageRendererKey} from '../../const';

import {ImgSettingsButton} from './ImgSettingsButton';

import './ImgNodeView.scss';

export const cnImgSizeNodeView = cn('img-size-node-view');

export const ImageNodeView: React.FC<ReactNodeViewProps> = ({
    node,
    view,
    getPos,
    updateAttributes,
}) => {
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const alt = node.attrs[ImgSizeAttr.Alt] || '';
    const initialHeight = node.attrs[ImgSizeAttr.Height];
    const initialWidth = node.attrs[ImgSizeAttr.Width];
    const src = node.attrs[ImgSizeAttr.Src] || '';
    const title = node.attrs[ImgSizeAttr.Title] || '';

    const isNodeHovered = useNodeHovered(imageContainerRef);
    const [edit, setEditing, unsetEdit, toggleEdit] = useNodeEditing({
        nodeRef: imageContainerRef,
        view,
    });

    const handleResize = useCallback(
        ({width, height}: {width?: number; height?: number}) => {
            updateAttributes({
                width: width === undefined ? undefined : String(Math.round(width)),
                height: height === undefined ? undefined : String(Math.round(height)),
                name: title,
                alt,
            });
        },
        [alt, title, updateAttributes],
    );

    const {state, startResizing} = useNodeResizing({
        width: initialWidth,
        height: initialHeight,
        ref: imageRef,
        onResize: handleResize,
    });

    const style: HTMLAttributes<HTMLImageElement>['style'] = {
        transition: 'width 0.15s ease-out, height 0.15s ease-out',
    };

    if (state.width) {
        style.width = `${state.width}px`;

        if (state.height) {
            style.aspectRatio = state.width / state.height;
            style.height = 'auto;';
        }
    } else if (state.height) {
        style.height = `${state.height}px`;
    }

    const handleDelete = useCallback(() => {
        const pos = getPos();
        if (pos === undefined) return;
        removeNode({
            node,
            pos,
            tr: view.state.tr,
            dispatch: view.dispatch,
        });
        view.focus();
    }, [getPos, node, view]);

    const createHandleResize =
        (direction: ResizeDirection) => (event: React.MouseEvent<HTMLElement>) => {
            startResizing(event, direction);
        };

    useEffect(() => {
        if (imageRendererKey.getState(view.state)?.linkAdded) {
            setEditing();
        }
    }, [view, setEditing]);

    return (
        <div ref={imageContainerRef}>
            <Resizable
                hover={isNodeHovered}
                resizing={state.resizing}
                onResizeLeft={createHandleResize('left')}
                onResizeRight={createHandleResize('right')}
            >
                <ImgSettingsButton
                    node={node}
                    view={view}
                    getPos={getPos}
                    updateAttributes={updateAttributes}
                    visible={isNodeHovered && !edit && !state.resizing}
                    edit={edit}
                    toggleEdit={toggleEdit}
                    nodeRef={imageRef}
                    onDelete={handleDelete}
                    unsetEdit={unsetEdit}
                />
                <img ref={imageRef} src={src} alt={alt} style={style} />
            </Resizable>
        </div>
    );
};
