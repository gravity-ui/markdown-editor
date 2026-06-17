import {openInlineImageSrcEditor, openInlineTextEditor} from './textEditing';

const keydown = (target: HTMLElement, key: string) => {
    target.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true}));
};

describe('GridBlockTemplates inline editing', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('commits text changes on Enter', () => {
        const root = document.createElement('div');
        root.innerHTML = '<p>Hello</p>';
        document.body.append(root);

        const textNode = root.querySelector('p')?.firstChild as Text;
        const onCommit = jest.fn();

        expect(openInlineTextEditor({root, textNode, onCommit})).toBe(true);

        const editor = root.querySelector('textarea') as HTMLTextAreaElement;
        editor.value = 'Updated';
        keydown(editor, 'Enter');

        expect(root.innerHTML).toBe('<p>Updated</p>');
        expect(onCommit).toHaveBeenCalledWith('<p>Updated</p>');
    });

    it('cancels text changes on Escape', () => {
        const root = document.createElement('div');
        root.innerHTML = '<p>Hello</p>';
        document.body.append(root);

        const textNode = root.querySelector('p')?.firstChild as Text;
        const onCommit = jest.fn();

        openInlineTextEditor({root, textNode, onCommit});

        const editor = root.querySelector('textarea') as HTMLTextAreaElement;
        editor.value = 'Updated';
        keydown(editor, 'Escape');

        expect(root.innerHTML).toBe('<p>Hello</p>');
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('commits image src changes and preserves other attributes', () => {
        const root = document.createElement('div');
        root.innerHTML = '<img src="before.png" alt="Preview" class="hero">';
        document.body.append(root);

        const image = root.querySelector('img') as HTMLImageElement;
        const onCommit = jest.fn();

        expect(openInlineImageSrcEditor({root, image, onCommit})).toBe(true);

        const editor = root.querySelector('input') as HTMLInputElement;
        editor.value = 'after.png';
        keydown(editor, 'Enter');

        expect(root.innerHTML).toBe('<img src="after.png" alt="Preview" class="hero">');
        expect(onCommit).toHaveBeenCalledWith('<img src="after.png" alt="Preview" class="hero">');
    });

    it('cancels image src changes on Escape', () => {
        const root = document.createElement('div');
        root.innerHTML = '<img src="before.png" alt="Preview">';
        document.body.append(root);

        const image = root.querySelector('img') as HTMLImageElement;
        const onCommit = jest.fn();

        openInlineImageSrcEditor({root, image, onCommit});

        const editor = root.querySelector('input') as HTMLInputElement;
        editor.value = 'after.png';
        keydown(editor, 'Escape');

        expect(root.innerHTML).toBe('<img src="before.png" alt="Preview">');
        expect(onCommit).not.toHaveBeenCalled();
    });
});
