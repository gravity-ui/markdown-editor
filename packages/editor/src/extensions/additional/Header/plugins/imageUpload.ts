import type {EditorView} from 'prosemirror-view';

import type {FileUploadHandler} from 'src/utils/upload';

import {
    HeaderAttr,
    HeaderLayer,
    HeaderText,
    type HeaderTextValue,
    normalizeHeaderAttrs,
} from '../HeaderSpecs';
import {headerAt, setHeaderAttrs} from '../commands';

const SAMPLE_SIZE = 64;
/** Заголовок занимает левую часть обложки, яркость меряется по ней. */
const TITLE_AREA_WIDTH = 0.6;

export function pickImageFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', () => resolve(input.files?.[0] ?? null), {once: true});
        input.addEventListener('cancel', () => resolve(null), {once: true});
        input.click();
    });
}

/** Яркость считается по локальному файлу: у загруженной ссылки canvas закрыт политикой домена. */
export async function measureTitleTone(file: File): Promise<HeaderTextValue> {
    const url = URL.createObjectURL(file);
    try {
        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;

        const context = canvas.getContext('2d', {willReadFrequently: true});
        if (!context) return HeaderText.Light;

        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const width = Math.max(1, Math.round(SAMPLE_SIZE * TITLE_AREA_WIDTH));
        const {data} = context.getImageData(0, 0, width, SAMPLE_SIZE);

        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
            sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        const average = sum / (data.length / 4);

        return average > 140 ? HeaderText.Dark : HeaderText.Light;
    } catch {
        return HeaderText.Light;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

export async function uploadHeaderImage(
    view: EditorView,
    pos: number,
    handler: FileUploadHandler,
): Promise<'done' | 'cancelled' | 'failed'> {
    const file = await pickImageFile();
    if (!file) return 'cancelled';

    const tone = await measureTitleTone(file);

    let url: string;
    try {
        ({url} = await handler(file));
    } catch {
        return 'failed';
    }

    const node = headerAt(view.state.doc, pos);
    if (!url || !node) return 'failed';

    // Замер относится к снимку на всю площадь: под декором и плиткой тон заголовка задаёт заливка.
    const onCover = normalizeHeaderAttrs(node.attrs)[HeaderAttr.Layer] === HeaderLayer.Cover;

    setHeaderAttrs(pos, {
        [HeaderAttr.Image]: url,
        ...(onCover ? {[HeaderAttr.Text]: tone} : {}),
    })(view.state, view.dispatch);

    return 'done';
}
