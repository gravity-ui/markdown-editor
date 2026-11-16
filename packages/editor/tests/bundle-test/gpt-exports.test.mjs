import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';

const {resolve} = createRequire(import.meta.url);

test('should expose GPT styles without exposing internal JavaScript modules', () => {
    assert.match(
        resolve(
            '@gravity-ui/markdown-editor-gpt-extension/styles/components/GptPopup/GptPopup.css',
        ),
        /GptPopup\.css$/,
    );
    assert.throws(
        () => resolve('@gravity-ui/markdown-editor-gpt-extension/styles/hooks/useGptSession.js'),
        {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'},
    );
});
