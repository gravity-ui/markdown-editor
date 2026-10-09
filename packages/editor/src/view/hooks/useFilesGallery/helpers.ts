import {YfmFileAttrs, YfmFileClassname} from './constants';

type LinkObject = {
    name?: string | null;
    mimetype?: string | null;
    type: 'image' | 'link' | 'file';
    link: string;
};

export function buildLinkObject(elem: Element): LinkObject | null {
    let obj: LinkObject | null = null;

    if (elem.tagName === 'IMG') {
        obj = {
            type: 'image',
            name: elem.getAttribute('alt'),
            link: elem.getAttribute('src') ?? '',
        };
    } else if (elem.tagName === 'A') {
        obj = {
            type: 'link',
            name: elem.getAttribute('title'),
            link: elem.getAttribute('href') ?? '',
        };

        if (elem.classList.contains(YfmFileClassname)) {
            obj.type = 'file';
            obj.name = elem.getAttribute(YfmFileAttrs.Download);
            obj.mimetype = elem.getAttribute(YfmFileAttrs.Type);
        }
    }

    if (obj && !obj.mimetype) {
        obj.mimetype = getMimetypeFromDataUri(obj.link);
    }

    return obj;
}

const dataUriMimetypeRegex = /^data:([^;,]+)/i;
function getMimetypeFromDataUri(link: string) {
    return link.match(dataUriMimetypeRegex)?.[1];
}
