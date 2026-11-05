import {FileForm} from '@gravity-ui/markdown-editor/_/forms/FileForm.js';
import {ImageForm} from '@gravity-ui/markdown-editor/_/forms/ImageForm.js';

const noop = () => {};

export function AttachmentForm({kind}: {kind: 'file' | 'image'}) {
    const Component = kind === 'file' ? FileForm : ImageForm;
    return <Component onSubmit={noop} onCancel={noop} onAttach={noop} />;
}
