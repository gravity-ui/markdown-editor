import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {HeadingAnchors} from '@gravity-ui/markdown-viewer/extensions';

import * as DefaultViewerStories from '../../src/stories/viewer/MarkdownViewer.stories';

import {composeStories} from './utils/compose-stories';

export const ViewerStories = composeStories(DefaultViewerStories);

export function HeadingAliasViewer({attribute}: {attribute: 'id' | 'name'}) {
    const alias =
        attribute === 'id'
            ? '<button id="legacy-alias" class="yfm-clipboard-anchor" data-href="#heading" aria-label="Copy link to this section">#</button>'
            : '<a name="legacy-alias" class="yfm-anchor yfm-clipboard-anchor" href="#heading">#</a>';

    return (
        <div>
            <a href="#heading">Go to heading</a>
            <a href="#legacy-alias">Go to alias</a>
            <div style={{height: 1200}} />
            <MarkdownViewer className={cnYFM()} html={`<h2 id="heading">${alias}Heading</h2>`}>
                <HeadingAnchors getHref={({id}) => `#${id}`} />
            </MarkdownViewer>
            <div style={{height: 1200}} />
        </div>
    );
}
