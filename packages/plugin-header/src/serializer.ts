import {headerDimensions} from './dimensions';

export function serializeHeader(attrs: {height?: unknown; width?: unknown}) {
    const {height, width} = headerDimensions(attrs);
    return `:::header{height="${height}" width="${width}"}\n:::`;
}
