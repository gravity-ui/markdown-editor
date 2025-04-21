import {ExtensionsManager} from '../../core';
import {SchemaDynamicModifier} from '../../core/SchemaDynamicModifier';
import {MarkdownParserDynamicModifier} from '../../core/markdown/MarkdownParser';
import {MarkdownSerializerDynamicModifier} from '../../core/markdown/MarkdownSerializerDynamicModifier';
import {convertDynamicModifiersConfigs} from '../../core/utils/dynamicModifiers';
import {Logger2} from '../../logger';
import {FullSpecsPreset} from '../../presets/full-specs';
import {MarkupManager} from '../MarkupManager';

import {createDynamicModifiers} from './dynamicModifiers';

const markupManager = new MarkupManager(
    new Logger2().nested({env: 'test', module: 'markup-manager'}),
);

const dynamicModifiersConfig = convertDynamicModifiersConfigs(
    createDynamicModifiers(markupManager, ['yfm_table', 'hidden_comment']),
);

const dynamicModifiers = {
    schema: new SchemaDynamicModifier(dynamicModifiersConfig.schema),
    parser: new MarkdownParserDynamicModifier(dynamicModifiersConfig.parser),
    serializer: new MarkdownSerializerDynamicModifier(dynamicModifiersConfig.serializer),
};

const {markupParser: parser, serializer} = ExtensionsManager.process(
    (builder) =>
        builder.use(FullSpecsPreset, {
            color: {},
        }),
    {
        dynamicModifiers,
    },
);

describe('dynamicModifiers', () => {
    it('should correctly process YFM tables in different contexts', () => {
        const initialMarkup = `[//]: # (TODO: link to GSYM)

## YFM Table
### Simple table
#|
|| **Header1** | **Header2** ||
|| Text        | Text        ||
|#
### Multiline content
#|
|| Text
on two lines |
- Potatoes
- Carrot
- Onion
- Cucumber
||
|#

### Nested tables
#|
|| 1  | Text before other table

#|
|| 5  | 6 ||
|| 7  | 8 ||
|#

Text after other table
||
|| 3 | 4 ||

|#

### Table inside quote
> #|
> || **Header1** | **Header2** ||
> || Text        | Text        ||
> |#

### Table inside tabs

{% list tabs %}

- tab1

  #|
    || **Header1** | **Header2** ||
    || Text        | Text        ||
    |#

- tab2

  #|
    || Text
    on two lines |
    - Potatoes
    - Carrot
    - Onion
    - Cucumber
    ||
    |#


{% endlist %}
`;

        const expectedMarkup = `[//]: # (TODO: link to GSYM)
## YFM Table

### Simple table

#|
|| **Header1** | **Header2** ||
|| Text        | Text        ||
|#
### Multiline content

#|
|| Text
on two lines |
- Potatoes
- Carrot
- Onion
- Cucumber
||
|#

### Nested tables

#|
|| 1  | Text before other table

#|
|| 5  | 6 ||
|| 7  | 8 ||
|#

Text after other table
||
|| 3 | 4 ||

|#

### Table inside quote

>${` `}
> #|
> ||
>${` `}
> **Header1**
>
> |
>${` `}
> **Header2**
>
> ||
> ||
>${` `}
> Text
>
> |
>${` `}
> Text
>
> ||
> |#
>${` `}

### Table inside tabs

{% list tabs %}

- tab1

${`  `}
  #|
  || **Header1** | **Header2** ||
  || Text        | Text        ||
  |#
${`  `}

- tab2

${`  `}
  #|
  || Text
  on two lines |
  - Potatoes
  - Carrot
  - Onion
  - Cucumber
  ||
  |#
${`  `}

{% endlist %}`;

        const doc = parser.parse(initialMarkup);
        const serialized = serializer.serialize(doc);

        expect(serialized).toBe(expectedMarkup);
    });
});
