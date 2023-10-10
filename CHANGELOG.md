# Changelog

## [6.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.2.0...v6.3.0) (2023-10-10)


### Features

* **Color:** add parseDOM rules to specs ([#137](https://github.com/yandex-cloud/yfm-editor/issues/137)) ([198f805](https://github.com/yandex-cloud/yfm-editor/commit/198f8059878d2970d2eee62918868232d4195e46))


### Bug Fixes

* correct parsing of `\n` in inline code ([#135](https://github.com/yandex-cloud/yfm-editor/issues/135)) ([ebf37d7](https://github.com/yandex-cloud/yfm-editor/commit/ebf37d71488afa554031af349fa5d835f92ee08c))
* selected node styles appear only if ProseMirror is focused ([#138](https://github.com/yandex-cloud/yfm-editor/issues/138)) ([dd873de](https://github.com/yandex-cloud/yfm-editor/commit/dd873deae5f87cc80045067bd2a50934f2589ee5))
* trying to add a row or column to an outer table caused it to be added into inner one ([#139](https://github.com/yandex-cloud/yfm-editor/issues/139)) ([41d4a46](https://github.com/yandex-cloud/yfm-editor/commit/41d4a46fad15e77368d08eeee231f5486faf2f9a))

## [6.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.1.4...v6.2.0) (2023-09-29)


### Features

* add esbuild compatability tests ([#125](https://github.com/yandex-cloud/yfm-editor/issues/125)) ([58e1135](https://github.com/yandex-cloud/yfm-editor/commit/58e113597e34cf9c779eb0a241023945b469e3c7))


### Bug Fixes

* remove ambiguous export ([#134](https://github.com/yandex-cloud/yfm-editor/issues/134)) ([3a276e8](https://github.com/yandex-cloud/yfm-editor/commit/3a276e84202ad01b847f609526166e5ec498739f))

## [6.1.4](https://github.com/yandex-cloud/yfm-editor/compare/v6.1.3...v6.1.4) (2023-09-25)


### Bug Fixes

* **YfmTabs:** fix tab-panel content spec ([#131](https://github.com/yandex-cloud/yfm-editor/issues/131)) ([4e61d57](https://github.com/yandex-cloud/yfm-editor/commit/4e61d574346e488a02cb671585c17fdb3cf0efb8))

## [6.1.3](https://github.com/yandex-cloud/yfm-editor/compare/v6.1.2...v6.1.3) (2023-09-23)


### Bug Fixes

* replace require() with esm import ([#129](https://github.com/yandex-cloud/yfm-editor/issues/129)) ([fcb3422](https://github.com/yandex-cloud/yfm-editor/commit/fcb3422e58367f0cf638551773fc5ad49b1f7937))

## [6.1.2](https://github.com/yandex-cloud/yfm-editor/compare/v6.1.1...v6.1.2) (2023-09-20)


### Bug Fixes

* import lodash methods directly ([#126](https://github.com/yandex-cloud/yfm-editor/issues/126)) ([16c423b](https://github.com/yandex-cloud/yfm-editor/commit/16c423ba01c244ee892fd6b5799b79343dbe235c))

## [6.1.1](https://github.com/yandex-cloud/yfm-editor/compare/v6.1.0...v6.1.1) (2023-09-04)


### Bug Fixes

* new attributes when creating tabs ([#123](https://github.com/yandex-cloud/yfm-editor/issues/123)) ([592fcdf](https://github.com/yandex-cloud/yfm-editor/commit/592fcdfc82da7b60563e63f0d2879a3e64686754))

## [6.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.0.0...v6.1.0) (2023-09-04)


### Features

* upd @doc-tools/transform ([#121](https://github.com/yandex-cloud/yfm-editor/issues/121)) ([96c6c9b](https://github.com/yandex-cloud/yfm-editor/commit/96c6c9b8bcd61a66c816abe4aba055fd8f6a32ec))

## [6.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.6.0...v6.0.0) (2023-07-28)


### ⚠ BREAKING CHANGES

* update to uikit@5, node@18, storybook@7; remove assets ([#116](https://github.com/yandex-cloud/yfm-editor/issues/116))

### Features

* update to uikit@5, node@18, storybook@7; remove assets ([#116](https://github.com/yandex-cloud/yfm-editor/issues/116)) ([01e021f](https://github.com/yandex-cloud/yfm-editor/commit/01e021fcce856b6f47cb40442473dcc90b78cce8))

## [5.6.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.5.1...v5.6.0) (2023-07-04)


### Features

* tabs action ([#114](https://github.com/yandex-cloud/yfm-editor/issues/114)) ([ae45a72](https://github.com/yandex-cloud/yfm-editor/commit/ae45a729651eff01b31cab1a6ecdd03ccee9c215))

## [5.5.1](https://github.com/yandex-cloud/yfm-editor/compare/v5.5.0...v5.5.1) (2023-06-29)


### Bug Fixes

* **Deflist:** use internal isNodeSelection helper ([#112](https://github.com/yandex-cloud/yfm-editor/issues/112)) ([1eeb0c0](https://github.com/yandex-cloud/yfm-editor/commit/1eeb0c0752e5c6df59c89af7c0b0f1aa20abf116))

## [5.5.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.4.0...v5.5.0) (2023-06-29)


### Features

* **deps:** support @doc-tools/transform@3 ([#110](https://github.com/yandex-cloud/yfm-editor/issues/110)) ([495ecf1](https://github.com/yandex-cloud/yfm-editor/commit/495ecf173d7098c553d621b2e426673d6cd66018))

## [5.4.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.3.0...v5.4.0) (2023-06-26)


### Features

* add re-export serializeForClipboard function from prosemirror-view ([#107](https://github.com/yandex-cloud/yfm-editor/issues/107)) ([3574ea2](https://github.com/yandex-cloud/yfm-editor/commit/3574ea2cbaa5f97c08440946523ccfcfbe207a14))
* allow selection for list-item, heading and checkbox ([#109](https://github.com/yandex-cloud/yfm-editor/issues/109)) ([e0ade05](https://github.com/yandex-cloud/yfm-editor/commit/e0ade05fed9fc9d4caabd6cf4f1f3d7e727c10c4))

## [5.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.2.0...v5.3.0) (2023-06-16)


### Features

* add logging keymap actions ([#106](https://github.com/yandex-cloud/yfm-editor/issues/106)) ([20a2657](https://github.com/yandex-cloud/yfm-editor/commit/20a2657cab3ac1ff5199a0a4c8335bf19b22de8b))


### Bug Fixes

* escape whitespaces within superscript and subscript ([#104](https://github.com/yandex-cloud/yfm-editor/issues/104)) ([db35e5b](https://github.com/yandex-cloud/yfm-editor/commit/db35e5b13a6c7f9281927be1953a9e08b102969c))

## [5.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.1.0...v5.2.0) (2023-05-22)


### Features

* **Math:** add background on hover ([#103](https://github.com/yandex-cloud/yfm-editor/issues/103)) ([ab869cd](https://github.com/yandex-cloud/yfm-editor/commit/ab869cd1deaf0315d9fc654bfec2414af97d397b))
* **Selecion:** support backspace action for fake paragraph ([#100](https://github.com/yandex-cloud/yfm-editor/issues/100)) ([efaa359](https://github.com/yandex-cloud/yfm-editor/commit/efaa359842228b06f510f48033b1b0a20a115832))
* **YfmCut:** add a border when hovering ([#102](https://github.com/yandex-cloud/yfm-editor/issues/102)) ([b316f08](https://github.com/yandex-cloud/yfm-editor/commit/b316f085f9d9cf8d68a4636ed5cd0fde0f13d0b4))
* **YfmCut:** allow inline nodes in cut title ([1408cee](https://github.com/yandex-cloud/yfm-editor/commit/1408cee299e3cb910d4bad9311f958f90e363b85))
* **YfmNote:** allow inline nodes in note title ([8b40679](https://github.com/yandex-cloud/yfm-editor/commit/8b40679b2a8e679cbdfaa90b3cd65b53bcaec6da))


### Bug Fixes

* remove marks from breaks that are the last node inside that mark ([#101](https://github.com/yandex-cloud/yfm-editor/issues/101)) ([88c3d1a](https://github.com/yandex-cloud/yfm-editor/commit/88c3d1a9f3a26e8e401553fdd776c3ba6a272683))

## [5.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v5.0.0...v5.1.0) (2023-04-12)


### Features

* improvements for tabs UX ([#93](https://github.com/yandex-cloud/yfm-editor/issues/93)) ([7d618c2](https://github.com/yandex-cloud/yfm-editor/commit/7d618c24f54f60196bd5e218c275a4957d03d000))


### Bug Fixes

* **CodeBlock:** fix parsing and serialization of code and fence blocks ([#96](https://github.com/yandex-cloud/yfm-editor/issues/96)) ([4824813](https://github.com/yandex-cloud/yfm-editor/commit/4824813f15886e45797003cbb96893c4e5ef1141))

## [5.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.5.0...v5.0.0) (2023-04-11)


### ⚠ BREAKING CHANGES

* **Math:** add math hints

### Features

* add i18n ([4e2c49c](https://github.com/yandex-cloud/yfm-editor/commit/4e2c49c5f4a562738724f0739b7de359e697c56e))
* add ReactRenderer extension ([d73eb8e](https://github.com/yandex-cloud/yfm-editor/commit/d73eb8e1afcf2dee3cc7c70f26ce99d9490dd681))
* **Blockquote:** support for joining the previous blockquote ([#90](https://github.com/yandex-cloud/yfm-editor/issues/90)) ([9d055c4](https://github.com/yandex-cloud/yfm-editor/commit/9d055c41ef5df17a505399968f7e5e186f09ed2c))
* **Lists:** support for joining the previous list ([#92](https://github.com/yandex-cloud/yfm-editor/issues/92)) ([3e38618](https://github.com/yandex-cloud/yfm-editor/commit/3e38618445165267979ab7489e1b0b5a338dad55))
* **Math:** add math hints ([9d7293d](https://github.com/yandex-cloud/yfm-editor/commit/9d7293d928a2604322489b8fede5d2b826a44153))

## [4.5.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.4.1...v4.5.0) (2023-03-21)


### Features

* **Lists:** return true from toList command when selection is in list with current list type ([#88](https://github.com/yandex-cloud/yfm-editor/issues/88)) ([74dd90c](https://github.com/yandex-cloud/yfm-editor/commit/74dd90c99e62413172830728d37ce52eee610e33))


### Bug Fixes

* improvements for checkbox behavior ([#87](https://github.com/yandex-cloud/yfm-editor/issues/87)) ([12d0702](https://github.com/yandex-cloud/yfm-editor/commit/12d070219f741f43c307fe8453ceef51cb9ad945))

## [4.4.1](https://github.com/yandex-cloud/yfm-editor/compare/v4.4.0...v4.4.1) (2023-03-16)


### Bug Fixes

* support react18 strict mode ([#85](https://github.com/yandex-cloud/yfm-editor/issues/85)) ([03832d6](https://github.com/yandex-cloud/yfm-editor/commit/03832d6a9fd5b89c43cca4f2ff093e828950beaa))

## [4.4.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.3.0...v4.4.0) (2023-03-13)


### Features

* **deps:** support uikit@4 ([#82](https://github.com/yandex-cloud/yfm-editor/issues/82)) ([1964b59](https://github.com/yandex-cloud/yfm-editor/commit/1964b59602efca99aa1c86b948dd7fc8589c2171))
* **deps:** support react@18 ([#83](https://github.com/yandex-cloud/yfm-editor/issues/83)) ([f77b68b](https://github.com/yandex-cloud/yfm-editor/commit/f77b68b758e669709f185315dca5b5b7ba77d396))

## [4.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.2.0...v4.3.0) (2023-02-27)


### Features

* move schema, parser and serializer specs to separate extensions ([#80](https://github.com/yandex-cloud/yfm-editor/issues/80)) ([38064ac](https://github.com/yandex-cloud/yfm-editor/commit/38064ac7f156cc8bf1d283b0b522818db4d73f71))


### Bug Fixes

* optimisation for large tables ([#79](https://github.com/yandex-cloud/yfm-editor/issues/79)) ([bf8d961](https://github.com/yandex-cloud/yfm-editor/commit/bf8d96122187369e58098c2821ece146013ce4f6))

## [4.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.1.0...v4.2.0) (2023-02-15)


### Features

* apllying codemark when typing text between backticks ([#75](https://github.com/yandex-cloud/yfm-editor/issues/75)) ([50560f2](https://github.com/yandex-cloud/yfm-editor/commit/50560f2c06d827f5069ad074631431e16b215521))
* **Clipboard:** get markup from html that has only text ([#78](https://github.com/yandex-cloud/yfm-editor/issues/78)) ([6a4628f](https://github.com/yandex-cloud/yfm-editor/commit/6a4628f6d06d14a445d507d8b2049d04c676a3ee))
* **HorizontalRule:** add input rules for horizontal line ([#77](https://github.com/yandex-cloud/yfm-editor/issues/77)) ([d11e9e0](https://github.com/yandex-cloud/yfm-editor/commit/d11e9e037b712fc8530956978674dc4afb3e2f4b))

## [4.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v4.0.1...v4.1.0) (2023-02-09)


### Features

* add more items from Cursor and Selection extensions to root export ([#73](https://github.com/yandex-cloud/yfm-editor/issues/73)) ([8499232](https://github.com/yandex-cloud/yfm-editor/commit/8499232569e06dbd7257efa6a7ba1c58f3d16230))
* **Placeholder:** don't render placeholder when content is null ([#72](https://github.com/yandex-cloud/yfm-editor/issues/72)) ([a91d1cd](https://github.com/yandex-cloud/yfm-editor/commit/a91d1cd9bb35611c96b157179592f02e10e1aeee))

## [4.0.1](https://github.com/yandex-cloud/yfm-editor/compare/v4.0.0...v4.0.1) (2023-02-07)


### Bug Fixes

* **Selection:** fix creation of fake cursor on edges of blocks with flag gapcursor:false ([#71](https://github.com/yandex-cloud/yfm-editor/issues/71)) ([63dcdf2](https://github.com/yandex-cloud/yfm-editor/commit/63dcdf23142b31191da27117984d834864cf0ee0))
* **YfmCut:** allow editing of yfm-cut title ([#69](https://github.com/yandex-cloud/yfm-editor/issues/69)) ([b440844](https://github.com/yandex-cloud/yfm-editor/commit/b4408442386078be8356c3e577a51bb18771963a))

## [4.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.7.0...v4.0.0) (2023-02-01)


### ⚠ BREAKING CHANGES

* **toolbar:** update @gravity-ui/uikit@3.18 and use Hotkey and ActionTooltip components in Toolbar ([#66](https://github.com/yandex-cloud/yfm-editor/issues/66))
* **Selection, Cursor:** rewrite code for fake-paragraph behaviour ([#65](https://github.com/yandex-cloud/yfm-editor/issues/65))

### Features

* **Selection, Cursor:** rewrite code for fake-paragraph behaviour ([#65](https://github.com/yandex-cloud/yfm-editor/issues/65)) ([991107a](https://github.com/yandex-cloud/yfm-editor/commit/991107a749d9572a414d39c4ce4af1231ee52386))
* **toolbar:** update @gravity-ui/uikit@3.18 and use Hotkey and ActionTooltip components in Toolbar ([#66](https://github.com/yandex-cloud/yfm-editor/issues/66)) ([c67453f](https://github.com/yandex-cloud/yfm-editor/commit/c67453f2cbcafd1fced0130d1b86fa77e6613c35))

## [3.7.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.6.0...v3.7.0) (2023-02-01)


### Features

* parser and serializer props ([190384b](https://github.com/yandex-cloud/yfm-editor/commit/190384b7b9b3aa0a90975b98a8f7d60067d7d235))
* serialization of selection content when creating codeblock ([#67](https://github.com/yandex-cloud/yfm-editor/issues/67)) ([c170560](https://github.com/yandex-cloud/yfm-editor/commit/c170560df5f4669d9258726ca7ea273fda825dc7))


### Bug Fixes

* **Placeholder:** create new decorations on every EditorProps.decorations() call ([#62](https://github.com/yandex-cloud/yfm-editor/issues/62)) ([e6a8320](https://github.com/yandex-cloud/yfm-editor/commit/e6a83206988834565226a33ae8ef265967c8a791))

## [3.6.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.5.0...v3.6.0) (2023-01-25)


### Features

* improvements for tabs removement ([f21f6f5](https://github.com/yandex-cloud/yfm-editor/commit/f21f6f5d9818a1a8bd0faaa4f18a7c7a1008a5b6))

## [3.5.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.5...v3.5.0) (2023-01-24)


### Features

* **Placeholder:** pass the parent node to the placeholder's content callback ([#59](https://github.com/yandex-cloud/yfm-editor/issues/59)) ([96cf1d3](https://github.com/yandex-cloud/yfm-editor/commit/96cf1d3b741fdabe9a39de5a93c1644f33acf786))

## [3.4.5](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.4...v3.4.5) (2023-01-24)


### Bug Fixes

* **Clipboard:** replace require with es-import ([#57](https://github.com/yandex-cloud/yfm-editor/issues/57)) ([0347ed0](https://github.com/yandex-cloud/yfm-editor/commit/0347ed0556797670c25de9f207d8f8a68c381766))

## [3.4.4](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.3...v3.4.4) (2023-01-23)


### Bug Fixes

* replace asterisk exports with named exports ([#55](https://github.com/yandex-cloud/yfm-editor/issues/55)) ([e46c512](https://github.com/yandex-cloud/yfm-editor/commit/e46c5129547bbfb6de989d2237e14643f46cbdd0))

## [3.4.3](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.2...v3.4.3) (2023-01-23)


### Bug Fixes

* add missing exports from extensions ([#53](https://github.com/yandex-cloud/yfm-editor/issues/53)) ([25c3668](https://github.com/yandex-cloud/yfm-editor/commit/25c36684198d43af35156ad02cca662ff711e8da))

## [3.4.2](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.1...v3.4.2) (2022-12-16)


### Bug Fixes

* blockquote button breaks when selection has 0 depth ([2a38575](https://github.com/yandex-cloud/yfm-editor/commit/2a38575ea142ec652aa47705768661e41012b188))

## [3.4.1](https://github.com/yandex-cloud/yfm-editor/compare/v3.4.0...v3.4.1) (2022-12-13)


### Bug Fixes

* **YfmNote:** serialize placeholder content if node content is empty ([#48](https://github.com/yandex-cloud/yfm-editor/issues/48)) ([f999943](https://github.com/yandex-cloud/yfm-editor/commit/f9999434ed3cf37ee2690acf1b54315a79fba56a))

## [3.4.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.3.0...v3.4.0) (2022-12-09)


### Features

* **Math:** improve ux with inline math ([#43](https://github.com/yandex-cloud/yfm-editor/issues/43)) ([e09dca4](https://github.com/yandex-cloud/yfm-editor/commit/e09dca4603696ab0e10648347db86a42a32fe3e2))
* **YfmCut:** auto openning yfm-cut if selection is inside cut's content ([#46](https://github.com/yandex-cloud/yfm-editor/issues/46)) ([f3084f8](https://github.com/yandex-cloud/yfm-editor/commit/f3084f8fa953c2a7c79a7089f4236928d66630a6))
* **YfmCut:** don't open/close yfm-cut by clicking on the title ([#47](https://github.com/yandex-cloud/yfm-editor/issues/47)) ([1e13715](https://github.com/yandex-cloud/yfm-editor/commit/1e13715a6cc1fff5586d784df4c060a00c3fa0a8))


### Bug Fixes

* **Placeholder:** show placeholders immediately after initialization ([#45](https://github.com/yandex-cloud/yfm-editor/issues/45)) ([723a79d](https://github.com/yandex-cloud/yfm-editor/commit/723a79d55c486243fa8f47a68f30f7937d3dcaf9))

## [3.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.2.0...v3.3.0) (2022-11-23)


### Features

* parse html from the clipboard when pasting ([#40](https://github.com/yandex-cloud/yfm-editor/issues/40)) ([b27e9b8](https://github.com/yandex-cloud/yfm-editor/commit/b27e9b8d59f4d717258c9ebd88f777be861ff1fb))
* **YfmNote:** do not fill in the note title when creating a new note ([#41](https://github.com/yandex-cloud/yfm-editor/issues/41)) ([f65b342](https://github.com/yandex-cloud/yfm-editor/commit/f65b3424232629a1c5f56c1818fd62b26f5f4da8))
* **YfmTable:** clear selected table cells and delete empty rows or a table when the backspace button is pressed ([d4e1623](https://github.com/yandex-cloud/yfm-editor/commit/d4e1623e9f074523d595eb82729dad4a687e0bda))


### Bug Fixes

* **core:** escape the pipe symbol during serialization to markdown ([#36](https://github.com/yandex-cloud/yfm-editor/issues/36)) ([f766021](https://github.com/yandex-cloud/yfm-editor/commit/f76602119fffe0d83d1c17b15c438b59a180a327))
* re-export MathNode classes ([#38](https://github.com/yandex-cloud/yfm-editor/issues/38)) ([b4ee9b4](https://github.com/yandex-cloud/yfm-editor/commit/b4ee9b4361bddcbe8b6be7031d24d108ef30df60))

## [3.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.1.0...v3.2.0) (2022-11-10)


### Features

* add support to linkify urls with custom tlds ([#31](https://github.com/yandex-cloud/yfm-editor/issues/31)) ([1b0d44a](https://github.com/yandex-cloud/yfm-editor/commit/1b0d44a041f3a1854ce25ff54fb77acdd5e893f6))
* **Clipboard:** insert markup, html and text of the selected fragment into the clipboard ([#30](https://github.com/yandex-cloud/yfm-editor/issues/30)) ([f438588](https://github.com/yandex-cloud/yfm-editor/commit/f438588ff0394be405db07e73d170112b636f969))
* **Clipboard:** smarter copying ([#33](https://github.com/yandex-cloud/yfm-editor/issues/33)) ([a458d46](https://github.com/yandex-cloud/yfm-editor/commit/a458d469bfe7fc254e0954c5ecf244beecc363c1))
* **core:** added priority for marks in extension builder ([395f97b](https://github.com/yandex-cloud/yfm-editor/commit/395f97b2951e61524a1633ed79dbac020b958127))
* **Link:** when pasting, create a link with the pasted URL and selected text ([#28](https://github.com/yandex-cloud/yfm-editor/issues/28)) ([1230601](https://github.com/yandex-cloud/yfm-editor/commit/1230601a767ad0b0bb586003e9b6cee9ae87a3fa))


### Bug Fixes

* **Checkbox:** write placeholder content when label constains only whitespace characters ([#32](https://github.com/yandex-cloud/yfm-editor/issues/32)) ([3ded049](https://github.com/yandex-cloud/yfm-editor/commit/3ded049a01b2c042b482e40170b5d3b11a77c421))
* **Code:** set lowest priority for inline code mark ([b4f9ae0](https://github.com/yandex-cloud/yfm-editor/commit/b4f9ae0ac0e031c4cc3a53647ad255f8b3a2b43a))

## [3.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v3.0.0...v3.1.0) (2022-10-27)


### Features

* **core:** when appending replace last empty paragraph with new content and add empty paragraph after ([#25](https://github.com/yandex-cloud/yfm-editor/issues/25)) ([a7333ad](https://github.com/yandex-cloud/yfm-editor/commit/a7333ad52cdfdbee9e1b399a75bdb5504a078cf8))
* **Lists:** breaking the list when deleting a list item ([#26](https://github.com/yandex-cloud/yfm-editor/issues/26)) ([a5e5362](https://github.com/yandex-cloud/yfm-editor/commit/a5e5362be18056c7297019b390a8b82857cc652a))

## [3.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v2.1.0...v3.0.0) (2022-10-14)


### ⚠ BREAKING CHANGES

* **core:** use one builder for all plug-in extensions

### Features

* **core:** add context to extension builder ([#22](https://github.com/yandex-cloud/yfm-editor/issues/22)) ([dc66438](https://github.com/yandex-cloud/yfm-editor/commit/dc66438151542a436409253a1f3c8b7776ff693d))
* **core:** move plugins sorting to the extension builder ([fcc4d35](https://github.com/yandex-cloud/yfm-editor/commit/fcc4d35c3c9dec80abe5e6c45d21a3d2fce7006c))
* **core:** use one builder for all plug-in extensions ([66de15e](https://github.com/yandex-cloud/yfm-editor/commit/66de15edcd73b8c5a07375b31a02ddc875373cfc))
* table arrow controls ([3e00e6a](https://github.com/yandex-cloud/yfm-editor/commit/3e00e6aee7a6a1c93ee1ba42963d80605dfd57f6))

## [2.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v2.0.0...v2.1.0) (2022-10-05)


### Features

* added new field for selection interface ([4ccfdaa](https://github.com/yandex-cloud/yfm-editor/commit/4ccfdaa2f5c5f6e27c89d87181f1d6c615888c9c))
* **core:** escape corner brackets during serialization ([#17](https://github.com/yandex-cloud/yfm-editor/issues/17)) ([01ad8a8](https://github.com/yandex-cloud/yfm-editor/commit/01ad8a8717e902cbe74e2461b452ef1c94ff8e10))
* **toolbar:** add tooltip to list-buttons ([af158ff](https://github.com/yandex-cloud/yfm-editor/commit/af158ffdc75e68d1d993744a790892f09944a184))
* **tooltip:** add delay before open and close tooltip ([2c17593](https://github.com/yandex-cloud/yfm-editor/commit/2c17593dd31a3f5d7f5907ab63223216a73bdb85))

## [2.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v1.2.0...v2.0.0) (2022-10-04)


### ⚠ BREAKING CHANGES

* update to uikit@3

### Features

* **Html:** use html sanitizer from yfm-transform ([#14](https://github.com/yandex-cloud/yfm-editor/issues/14)) ([cf8ce23](https://github.com/yandex-cloud/yfm-editor/commit/cf8ce23513a2e3cddbc7321e6b890447c4f3085c))
* update to uikit@3 ([bd6c517](https://github.com/yandex-cloud/yfm-editor/commit/bd6c517cf43c12a9c1f6301901f48ad76e528232))

## [1.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v1.1.1...v1.2.0) (2022-09-28)


### Features

* **YfmCut:** move cursor to end of cut's title when press backspace in the beginning of its content ([007773a](https://github.com/yandex-cloud/yfm-editor/commit/007773a6e6577bcab4e85a8493c38d7a860a9432))
* **YfmCut:** remove cut on press backspace in the beginning of his title ([b715b38](https://github.com/yandex-cloud/yfm-editor/commit/b715b38ef3b2004b735f3d0f0fff898bc578923a))
* **YfmNote:** move cursor to end of note's title when press backspace in the beginning of its content ([a485fc9](https://github.com/yandex-cloud/yfm-editor/commit/a485fc9298c3a149281b1715d63444f05fd01e33))
* **YfmNote:** remove note on press backspace in the beginning of his title ([c1865ed](https://github.com/yandex-cloud/yfm-editor/commit/c1865edd488c70f7effb3c5418c9bf4cd19c4dc7))

## [1.1.1](https://github.com/yandex-cloud/yfm-editor/compare/v1.1.0...v1.1.1) (2022-09-26)


### Bug Fixes

* **Placeholder:** fix display of fake cursor before placeholder ([#8](https://github.com/yandex-cloud/yfm-editor/issues/8)) ([5ffdd35](https://github.com/yandex-cloud/yfm-editor/commit/5ffdd35b144dae2b9bdceb85a9386409e0a8ca9d))

## [1.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v1.0.0...v1.1.0) (2022-09-22)


### Features

* hints ([14360de](https://github.com/yandex-cloud/yfm-editor/commit/14360de3d7dc1b5838649eda3313759a77a36d8e))

## 1.0.0 (2022-09-21)


### Features

* **clipboard:** parse text without processing attributes ([65417b4](https://github.com/yandex-cloud/yfm-editor/commit/65417b4a5a684775ba611e1f8a1e05b4f00edff6))


### Bug Fixes

* instanceof issue ([cb079db](https://github.com/yandex-cloud/yfm-editor/commit/cb079db91bfe9863e7614df97b1ceff72bc3fe5a))
* lint ([3a53e7e](https://github.com/yandex-cloud/yfm-editor/commit/3a53e7eb4e486242112cd8dbd4e5bc5a9cb43d93))
