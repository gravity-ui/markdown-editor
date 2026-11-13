import {PluginKey} from '@gravity-ui/markdown-editor/pm/state';

export type Uploads = ReadonlyMap<symbol, number>;
/** An id starts or finishes a request; a position without an id cancels its pending upload. */
export type UploadMeta = {id?: symbol; pos?: number};

export const uploadsKey = new PluginKey<Uploads>('header-upload');
