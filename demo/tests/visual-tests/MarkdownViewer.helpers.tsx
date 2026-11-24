import transform from '@diplodoc/transform';
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {HeadingAnchors} from '@gravity-ui/markdown-viewer/extensions';

import * as DefaultViewerStories from '../../src/stories/viewer/MarkdownViewer.stories';

import {composeStories} from './utils/compose-stories';

export const ViewerStories = composeStories(DefaultViewerStories);

const headingMarkdown = '## Heading {#heading} {#legacy-alias}';
const legacyHeadings = {
    'button-id': transform(headingMarkdown, {useCommonAnchorButtons: true}).result.html,
    'link-name':
        '<h2 id="heading"><a name="legacy-alias" class="yfm-anchor yfm-clipboard-anchor" href="#heading">#</a>Heading</h2>',
    'link-id': transform(headingMarkdown).result.html,
};

export function HeadingAliasViewer({variant}: {variant: keyof typeof legacyHeadings}) {
    return (
        <div>
            <a href="#heading">Go to heading</a>
            <a href="#legacy-alias">Go to alias</a>
            <div style={{height: 1200}} />
            <MarkdownViewer className={cnYFM()} html={legacyHeadings[variant]}>
                <HeadingAnchors getHref={({id}) => `#${id}`} />
            </MarkdownViewer>
            <div style={{height: 1200}} />
        </div>
    );
}
