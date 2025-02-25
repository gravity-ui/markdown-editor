import type {NodeType} from 'prosemirror-model';

import type {UploadSuccessItem} from '../../../utils/upload';

export const createFileNode =
    (fileType: NodeType) =>
    ({result, file}: UploadSuccessItem) =>
        fileType.create({
            href: result.url,
            download: result.name ?? file.name,
            type: result.type ?? file.type,
        });
