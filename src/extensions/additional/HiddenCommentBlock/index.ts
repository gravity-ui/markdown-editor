import type {ExtensionAuto} from '../../../core';

export const HiddenCommentBlock: ExtensionAuto = (builder) => {
    builder.configureMd((md) =>
        md.use((md) => {
            md.core.ruler.before('normalize', 'capture_hidden_comments', (state) => {
                const {src, tokens} = state;
                let pos = 0;

                while (pos < src.length) {
                    const match = src.slice(pos).match(/^\[\/\/\]:\s*#\s*\((.*?)\)\s*(\n|$)/m);
                    if (!match) break;

                    const startPos = pos + (match.index || 0);
                    const endPos = startPos + match[0].length;

                    const token = new state.Token('hidden_comment', '', 0);
                    token.content = match[1];
                    token.map = [startPos, endPos];

                    tokens.push(token);

                    pos = endPos;
                }
            });

            return true;
        }),
    );

    builder.addNode('hidden_comment', () => ({
        spec: {
            group: 'block',
            inline: false,
            toDOM: (node) => {
                const nodeId = node.attrs['data-node-id'] as string;
                const elem = document.createElement('div');
                elem.className = 'empty';
                elem.setAttribute('data-node-id', nodeId);
                elem.contentEditable = 'false';
                return elem;
            },
            parseDOM: [{tag: 'div.empty'}],
            commandMenu: false,
        },
        fromMd: {
            tokenSpec: {
                name: 'hidden_comment',
                type: 'node',
                ignore: false,
                getAttrs: (tok) => ({
                    'data-node-id': tok.attrGet('data-node-id'),
                    'data-token-id': tok.attrGet('data-token-id') || null,
                }),
            },
        },
        toMd: () => {},
    }));
};
