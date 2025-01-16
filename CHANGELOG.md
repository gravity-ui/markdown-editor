# Changelog

## [14.10.3](https://github.com/gravity-ui/markdown-editor/compare/v14.10.2...v14.10.3) (2025-01-14)


### Bug Fixes

* fixed serialization of empty nodes ([#545](https://github.com/gravity-ui/markdown-editor/issues/545)) ([26a4b6b](https://github.com/gravity-ui/markdown-editor/commit/26a4b6b37139ba76aa98ca48183ff227f9ba8419))
* **toolbars:** added math to ListName ([#547](https://github.com/gravity-ui/markdown-editor/issues/547)) ([c8bfa70](https://github.com/gravity-ui/markdown-editor/commit/c8bfa702aebe53bdf87d6c6fb6fb1a7634c5d83a))

## [14.10.2](https://github.com/gravity-ui/markdown-editor/compare/v14.10.1...v14.10.2) (2024-12-25)


### Bug Fixes

* fixed imports with relative paths ([#540](https://github.com/gravity-ui/markdown-editor/issues/540)) ([98ea54f](https://github.com/gravity-ui/markdown-editor/commit/98ea54fc053b8fa2eadf138182d83984f8a84d75))

## [14.10.1](https://github.com/gravity-ui/markdown-editor/compare/v14.10.0...v14.10.1) (2024-12-25)


### Bug Fixes

* **bundle:** fixed imports with relative paths ([#538](https://github.com/gravity-ui/markdown-editor/issues/538)) ([747a3fd](https://github.com/gravity-ui/markdown-editor/commit/747a3fdc1b76c8eed3ad975d06d852fdf5bc2a6b))

## [14.10.0](https://github.com/gravity-ui/markdown-editor/compare/v14.9.0...v14.10.0) (2024-12-24)


### Features

* added support for an empty string ([#505](https://github.com/gravity-ui/markdown-editor/issues/505)) ([a3f8b50](https://github.com/gravity-ui/markdown-editor/commit/a3f8b50c7fd973c3db6bfa7e92f981db8d6a11c6))
* **Selection:** made all top-level nodes selectable ([#533](https://github.com/gravity-ui/markdown-editor/issues/533)) ([09e8e55](https://github.com/gravity-ui/markdown-editor/commit/09e8e5537d86bdfe991ed42addcbda70882c6537))
* **toolbars:** updated flattenPreset ([#531](https://github.com/gravity-ui/markdown-editor/issues/531)) ([deafe20](https://github.com/gravity-ui/markdown-editor/commit/deafe20cc364474580d993801e32fee227cc8832))


### Bug Fixes

* disable escaping when serializing content for code_block ([#537](https://github.com/gravity-ui/markdown-editor/issues/537)) ([617a1cc](https://github.com/gravity-ui/markdown-editor/commit/617a1ccf50c83e4deddc495162c86023f9be4760))
* **toolbars:** add reexport /modules/toolbars/types ([#534](https://github.com/gravity-ui/markdown-editor/issues/534)) ([cc026a3](https://github.com/gravity-ui/markdown-editor/commit/cc026a3923dd87c0d519df2d7c53bfae910887b6))

## [14.9.0](https://github.com/gravity-ui/markdown-editor/compare/v14.8.0...v14.9.0) (2024-12-20)


### Features

* **markup:** smart re-indent on paste ([#530](https://github.com/gravity-ui/markdown-editor/issues/530)) ([15767d7](https://github.com/gravity-ui/markdown-editor/commit/15767d7d3b0334126e34149d811ce6b6d62909d2))
* **toolbars:** restructured toolbar configuration and presets ([#509](https://github.com/gravity-ui/markdown-editor/issues/509)) ([3ebf14f](https://github.com/gravity-ui/markdown-editor/commit/3ebf14fd580ce29dc0133715cd2cb6bb6ea4ca8a))


### Bug Fixes

* **Link:** fixed pasting link to empty selection ([#528](https://github.com/gravity-ui/markdown-editor/issues/528)) ([bd52bee](https://github.com/gravity-ui/markdown-editor/commit/bd52bee93aceaf0af5bd9b8da284e93338b89a32))

## [14.8.0](https://github.com/gravity-ui/markdown-editor/compare/v14.7.0...v14.8.0) (2024-12-17)


### Features

* **build:** added a sideEffects property for tree shaking package ([#522](https://github.com/gravity-ui/markdown-editor/issues/522)) ([03b3962](https://github.com/gravity-ui/markdown-editor/commit/03b39624c32adde84adae74c4e320ce389d0eddb))

## [14.7.0](https://github.com/gravity-ui/markdown-editor/compare/v14.6.0...v14.7.0) (2024-12-17)


### Features

* **bundle:** added empty row placeholder ([#506](https://github.com/gravity-ui/markdown-editor/issues/506)) ([dc049af](https://github.com/gravity-ui/markdown-editor/commit/dc049af1c5d3a1016406afec3237b85bad2211c0))


### Bug Fixes

* **Checkbox:** added parse dom rules and fixed pasting of checkboxes ([#523](https://github.com/gravity-ui/markdown-editor/issues/523)) ([a7c23b5](https://github.com/gravity-ui/markdown-editor/commit/a7c23b59af7f2d7a8fd52e3cdb927468854f6c09))

## [14.6.0](https://github.com/gravity-ui/markdown-editor/compare/v14.5.1...v14.6.0) (2024-12-10)


### Features

* **bundle:** update view of text color action item in toolbar ([#514](https://github.com/gravity-ui/markdown-editor/issues/514)) ([54ac0d3](https://github.com/gravity-ui/markdown-editor/commit/54ac0d36499e572844e42cfff8f7781387731b00))


### Bug Fixes

* **Cursor:** input-rules does not work when cursor in virtual selection (GapCursorSelection) ([#515](https://github.com/gravity-ui/markdown-editor/issues/515)) ([9126756](https://github.com/gravity-ui/markdown-editor/commit/9126756fe5e241c6ab2badec4689b1df8f0009c3))
* **deps:** bumped @lezer/markdown to fix large text hang ([#512](https://github.com/gravity-ui/markdown-editor/issues/512)) ([8a8fce8](https://github.com/gravity-ui/markdown-editor/commit/8a8fce8ff5f9603f6e755264fc474c03a36d6bb7))
* Gpt extension render ([#519](https://github.com/gravity-ui/markdown-editor/issues/519)) ([89c9881](https://github.com/gravity-ui/markdown-editor/commit/89c9881331df2b0fae5968258a29b9c9eed179ef))

## [14.5.1](https://github.com/gravity-ui/markdown-editor/compare/v14.5.0...v14.5.1) (2024-12-02)


### Bug Fixes

* **Checkbox:** correct handling of checkbox click ([#510](https://github.com/gravity-ui/markdown-editor/issues/510)) ([c214076](https://github.com/gravity-ui/markdown-editor/commit/c2140766a32f9820498345d4eab907fcb803c9fc))

## [14.5.0](https://github.com/gravity-ui/markdown-editor/compare/v14.4.0...v14.5.0) (2024-11-28)


### Features

* **core:** autoconvert html to md when pasting in markdown mode ([#476](https://github.com/gravity-ui/markdown-editor/issues/476)) ([e3f6fbc](https://github.com/gravity-ui/markdown-editor/commit/e3f6fbc4b033cc109d503a1ca1ce21bcc915ccf0))
* **deps:** update diplodoc packages ([#504](https://github.com/gravity-ui/markdown-editor/issues/504)) ([5186fab](https://github.com/gravity-ui/markdown-editor/commit/5186fab62ca28a76ff5bc7db879c8517de34e86a))
* **EditorView:** add sticky toolbar border variable ([#499](https://github.com/gravity-ui/markdown-editor/issues/499)) ([3e1d2e2](https://github.com/gravity-ui/markdown-editor/commit/3e1d2e25d5d37fc4b21a1ba1ab6626639255cf69))
* **YfmFile:** support directive syntax ([#503](https://github.com/gravity-ui/markdown-editor/issues/503)) ([0340dce](https://github.com/gravity-ui/markdown-editor/commit/0340dce6ec00e8ab28cdf666e55bea9f46bfaccc))

## [14.4.0](https://github.com/gravity-ui/markdown-editor/compare/v14.3.1...v14.4.0) (2024-11-22)


### Features

* add directiveSyntax experiment ([ed85f71](https://github.com/gravity-ui/markdown-editor/commit/ed85f7116e419451bb7bad19ac4c96d88d0ee7cc))
* **YfmCut:** support directiveSyntax experiment ([da8fef7](https://github.com/gravity-ui/markdown-editor/commit/da8fef765e3eb35e4e19d92491d089c583099a6f))
* **YfmFile:** import plugin and consts from file-extension ([#488](https://github.com/gravity-ui/markdown-editor/issues/488)) ([3d68c53](https://github.com/gravity-ui/markdown-editor/commit/3d68c5353b25e91fcb5088a33d66b3a05a516b43))

## [14.3.1](https://github.com/gravity-ui/markdown-editor/compare/v14.3.0...v14.3.1) (2024-11-21)


### Bug Fixes

* **base:** disabled smart quotes ([#491](https://github.com/gravity-ui/markdown-editor/issues/491)) ([fbc977c](https://github.com/gravity-ui/markdown-editor/commit/fbc977c6d60d15205594ddb6f5d5eb23b08d0041))

## [14.3.0](https://github.com/gravity-ui/markdown-editor/compare/v14.2.3...v14.3.0) (2024-11-20)


### Features

* **EditorView:** add padding variables ([#477](https://github.com/gravity-ui/markdown-editor/issues/477)) ([ef7851f](https://github.com/gravity-ui/markdown-editor/commit/ef7851f0dae70834b57d3d95f1fc479b824b9e47))


### Bug Fixes

* **bundle:** added emoji to toolbar actions for full preset in markup mode ([#483](https://github.com/gravity-ui/markdown-editor/issues/483)) ([3c8fe45](https://github.com/gravity-ui/markdown-editor/commit/3c8fe453d42ebadf65bef99586b0743e5c59eb84))

## [14.2.3](https://github.com/gravity-ui/markdown-editor/compare/v14.2.2...v14.2.3) (2024-11-15)


### Bug Fixes

* **Video:** backward compability between diferent versions of `@diplodoc/transform` ([#478](https://github.com/gravity-ui/markdown-editor/issues/478)) ([602e2c0](https://github.com/gravity-ui/markdown-editor/commit/602e2c0a92d895b7a263a032768415be4f8dc63e))

## [14.2.2](https://github.com/gravity-ui/markdown-editor/compare/v14.2.1...v14.2.2) (2024-11-14)


### Bug Fixes

* **markup:** fix image paste by link with title from popup ([#474](https://github.com/gravity-ui/markdown-editor/issues/474)) ([a291ae9](https://github.com/gravity-ui/markdown-editor/commit/a291ae9786fc952a04eff831466833ac053df5de))

## [14.2.1](https://github.com/gravity-ui/markdown-editor/compare/v14.2.0...v14.2.1) (2024-11-13)


### Bug Fixes

* **deps:** removed @storybook/react from dependencies ([#472](https://github.com/gravity-ui/markdown-editor/issues/472)) ([d8e30bd](https://github.com/gravity-ui/markdown-editor/commit/d8e30bd33c3e94d4168c3ec82c1bd9eee669cab6))

## [14.2.0](https://github.com/gravity-ui/markdown-editor/compare/v14.1.0...v14.2.0) (2024-11-13)


### Features

* **CodeBlock:** removed automatic language identification for performance optimization ([#468](https://github.com/gravity-ui/markdown-editor/issues/468)) ([031504b](https://github.com/gravity-ui/markdown-editor/commit/031504baa06f108657fae7a0098c6ecf19e758c1))
* **ImgSize, markup:** rework image styling to get more control  ([#451](https://github.com/gravity-ui/markdown-editor/issues/451)) ([526074d](https://github.com/gravity-ui/markdown-editor/commit/526074dc9f0cc38c067a8b38925c830e675d9701))
* **markup:** convert pasted urls to images ([#469](https://github.com/gravity-ui/markdown-editor/issues/469)) ([720215b](https://github.com/gravity-ui/markdown-editor/commit/720215b11f52d7005428c469caead3db05eac230))
* **Image**: convert pasted image urls to images ([#464](https://github.com/gravity-ui/markdown-editor/pull/464)) ([64d389e](https://github.com/gravity-ui/markdown-editor/commit/64d389e592109db642daeabee5a086566ee320ca))

## [14.1.0](https://github.com/gravity-ui/markdown-editor/compare/v14.0.3...v14.1.0) (2024-11-11)


### Features

* **emoji:** updated emoji suggest popup logic ([#462](https://github.com/gravity-ui/markdown-editor/issues/462)) ([844667d](https://github.com/gravity-ui/markdown-editor/commit/844667d5f1365f4c2df5318d0a621ef0e18db88c))
* **lists:** added input rule for ordered lists with parenthesis ([#461](https://github.com/gravity-ui/markdown-editor/issues/461)) ([05ba62d](https://github.com/gravity-ui/markdown-editor/commit/05ba62deb68d1a0fb558c2672e48d26db617b6bc))


### Bug Fixes

* **Mermaid:** fix MermaidView edit buttons texts ([#465](https://github.com/gravity-ui/markdown-editor/issues/465)) ([0a16c61](https://github.com/gravity-ui/markdown-editor/commit/0a16c612e822e70e4bcc39e27bfd4fdcd3318c91))

## [14.0.3](https://github.com/gravity-ui/markdown-editor/compare/v14.0.2...v14.0.3) (2024-11-05)


### Bug Fixes

* **core:** added escaping the underscore character via serializing ([#452](https://github.com/gravity-ui/markdown-editor/issues/452)) ([d9d7279](https://github.com/gravity-ui/markdown-editor/commit/d9d72791a309a8ef68560f4472ac19717eadacf7))

## [14.0.2](https://github.com/gravity-ui/markdown-editor/compare/v14.0.1...v14.0.2) (2024-11-02)


### Bug Fixes

* **bundle:** file upload handler is not passed in wysiwyg mode ([#453](https://github.com/gravity-ui/markdown-editor/issues/453)) ([46fbe46](https://github.com/gravity-ui/markdown-editor/commit/46fbe46c0c0a7eeb85305d1a8fe8f33ef1257df0))
* **deps:** sync version of markdown-it-attrs with @diplodoc/transform ([#457](https://github.com/gravity-ui/markdown-editor/issues/457)) ([3f7e260](https://github.com/gravity-ui/markdown-editor/commit/3f7e2603761be8ed184c57aa14138fb45e8d0202))
* **markup:** correct key formatting for codemirror keymap ([#456](https://github.com/gravity-ui/markdown-editor/issues/456)) ([2f8f91d](https://github.com/gravity-ui/markdown-editor/commit/2f8f91df2a6c19b060667a495b496ed713fefa00))
* **markup:** fix hotkey Esc not working in markup mode ([#455](https://github.com/gravity-ui/markdown-editor/issues/455)) ([28bc59f](https://github.com/gravity-ui/markdown-editor/commit/28bc59f77356464b7aa81f9c89fa8d96bacf3ed1))

## [14.0.1](https://github.com/gravity-ui/markdown-editor/compare/v14.0.0...v14.0.1) (2024-10-25)


### Bug Fixes

* **note:** deleted unused import (_note.scss was used before for scss variables) ([#441](https://github.com/gravity-ui/markdown-editor/issues/441)) ([3615444](https://github.com/gravity-ui/markdown-editor/commit/3615444c17fe3cc0ffff1a0f2f656e4b87888a8c))

## [14.0.0](https://github.com/gravity-ui/markdown-editor/compare/v13.25.1...v14.0.0) (2024-10-23)


### ⚠ BREAKING CHANGES

* **bundle:** remove default deps for useMemo inside useMarkdownEditor ([#438](https://github.com/gravity-ui/markdown-editor/issues/438))
* import yfmTabs plugin from separate tabs-extension package
* import yfmCut plugin from separate cut-extension package
* bump diplodoc/transform to v4.33.0 and update import of runtime styles and scripts
* **deps:** updated transform version 4.32.2 ([#417](https://github.com/gravity-ui/markdown-editor/issues/417))
* **extensions:** move YfmHtmlBlock extension from yfm to additional folder
* **extensions:** move FoldingHeading extension from yfm to additional folder
* **extensions:** move Math extension from yfm to additional folder
* **extensions:** move Mermaid extension from yfm to additional folder

### refactor

* **extensions:** move FoldingHeading extension from yfm to additional folder ([e5f34d5](https://github.com/gravity-ui/markdown-editor/commit/e5f34d503aa81eee12d408394e03125a05c06a8f))
* **extensions:** move Math extension from yfm to additional folder ([f6531ac](https://github.com/gravity-ui/markdown-editor/commit/f6531ace38928ccf84303b1e66c61f7bc2c00601))
* **extensions:** move Mermaid extension from yfm to additional folder ([79eb06b](https://github.com/gravity-ui/markdown-editor/commit/79eb06bfb1312f4af9537876d963bc4540f4691a))
* **extensions:** move YfmHtmlBlock extension from yfm to additional folder ([8499538](https://github.com/gravity-ui/markdown-editor/commit/849953829d13e4e2fc4003fe34e228c7d5e81c33))


### Features

* bump diplodoc/transform to v4.33.0 and update import of runtime styles and scripts ([6dbbc52](https://github.com/gravity-ui/markdown-editor/commit/6dbbc52e7e3e187a0ad980182881edc747d6462d))
* **bundle:** group editor settings by scope ([#433](https://github.com/gravity-ui/markdown-editor/issues/433)) ([d4097c2](https://github.com/gravity-ui/markdown-editor/commit/d4097c2253e1d815c4547db3eb3195c5d0e2762c))
* **bundle:** pass md options to renderPreview callback ([#435](https://github.com/gravity-ui/markdown-editor/issues/435)) ([2676b45](https://github.com/gravity-ui/markdown-editor/commit/2676b45dce71cb1083757f876564f99949454c2b))
* **bundle:** remove default deps for useMemo inside useMarkdownEditor ([#438](https://github.com/gravity-ui/markdown-editor/issues/438)) ([573c82e](https://github.com/gravity-ui/markdown-editor/commit/573c82e0236508354bfc6ad6b961b6d794eab5cd))
* **deps:** updated transform version 4.32.2 ([#417](https://github.com/gravity-ui/markdown-editor/issues/417)) ([56e53fb](https://github.com/gravity-ui/markdown-editor/commit/56e53fb291e23d1681fc7ad7f7fc3906179920fc))
* import yfmCut plugin from separate cut-extension package ([fd43a36](https://github.com/gravity-ui/markdown-editor/commit/fd43a36ebecc3012e61d16021a1dc5ed326aabb5))
* import yfmTabs plugin from separate tabs-extension package ([6f229f1](https://github.com/gravity-ui/markdown-editor/commit/6f229f1f8b16b00076a5bdcb2e37a38b2896e9f1))
* update codemirror deps ([#430](https://github.com/gravity-ui/markdown-editor/issues/430)) ([40d4a98](https://github.com/gravity-ui/markdown-editor/commit/40d4a98d57a74d01b948b1dd84c076a69bf44fa8))
* update prosemirror deps ([#429](https://github.com/gravity-ui/markdown-editor/issues/429)) ([27ce483](https://github.com/gravity-ui/markdown-editor/commit/27ce48340ed266a7f6e93296cdabb5c6ae53ebf7))


### Bug Fixes

* **YfmTabs:** fixed switching between tabs in wysiwyg mode ([736fc0a](https://github.com/gravity-ui/markdown-editor/commit/736fc0a3285ad500a89a311699ba8b6abeab8467))

## [13.25.1](https://github.com/gravity-ui/markdown-editor/compare/v13.25.0...v13.25.1) (2024-10-18)


### Bug Fixes

* generics in GPT ([#425](https://github.com/gravity-ui/markdown-editor/issues/425)) ([e24aa27](https://github.com/gravity-ui/markdown-editor/commit/e24aa274c15edfb8a0d6ee3e10282ceeb098bbad))
* **yfmCut:** reverted details, summary tags ([#431](https://github.com/gravity-ui/markdown-editor/issues/431)) ([8be5211](https://github.com/gravity-ui/markdown-editor/commit/8be5211001bd3023bd9fb9472239466b9a8199d0))

## [13.25.0](https://github.com/gravity-ui/markdown-editor/compare/v13.24.0...v13.25.0) (2024-10-15)


### Features

* add GPT in markup mode ([#404](https://github.com/gravity-ui/markdown-editor/issues/404)) ([c2e06b3](https://github.com/gravity-ui/markdown-editor/commit/c2e06b36f86b4af1f466faf2019c121d2d3428ea))
* Update editor settings ([#416](https://github.com/gravity-ui/markdown-editor/issues/416)) ([e4b3ac0](https://github.com/gravity-ui/markdown-editor/commit/e4b3ac024581a802a8c62ecaf9b70225d8efcc43))


### Bug Fixes

* hotKey cmd + a shows the tooltip ([#422](https://github.com/gravity-ui/markdown-editor/issues/422)) ([7dd24ef](https://github.com/gravity-ui/markdown-editor/commit/7dd24ef95176bc2ac724189aaf93c4748763413a))
* **MarkdownEditorView:** prevent the default preview shortcut behaviour ([#421](https://github.com/gravity-ui/markdown-editor/issues/421)) ([1fa5c90](https://github.com/gravity-ui/markdown-editor/commit/1fa5c905ab09204ab3c066e091e7707a61a3da8d))

## [13.24.0](https://github.com/gravity-ui/markdown-editor/compare/v13.23.0...v13.24.0) (2024-10-11)


### Features

* **yfmCut:** updated yfmCut ([#408](https://github.com/gravity-ui/markdown-editor/issues/408)) ([3be1e41](https://github.com/gravity-ui/markdown-editor/commit/3be1e41c4540b14a6ed068a14954fa6af1b2e846))


### Bug Fixes

* **bundle:** submit in preview mode: remove outline and return edit mode on submit ([#418](https://github.com/gravity-ui/markdown-editor/issues/418)) ([e8ed1ba](https://github.com/gravity-ui/markdown-editor/commit/e8ed1bae5955b6562db9fcb4cac2ce3b9e4f46ea))
* **math:** fixed right direction ([#406](https://github.com/gravity-ui/markdown-editor/issues/406)) ([f01277f](https://github.com/gravity-ui/markdown-editor/commit/f01277f7ab33757d7a47a988341c88450ff4e6da))

## [13.23.0](https://github.com/gravity-ui/markdown-editor/compare/v13.22.0...v13.23.0) (2024-10-09)


### Features

* **bundle:** add submit in preview mode ([#411](https://github.com/gravity-ui/markdown-editor/issues/411)) ([019084a](https://github.com/gravity-ui/markdown-editor/commit/019084a4f117660cfdbeef0eadde27bbd3674942))


### Bug Fixes

* **Lists:** check that list items are being serialized with correct markup ([#412](https://github.com/gravity-ui/markdown-editor/issues/412)) ([9bf88d0](https://github.com/gravity-ui/markdown-editor/commit/9bf88d03ba967636b961b85c35352c1a20b5bdc2))

## [13.22.0](https://github.com/gravity-ui/markdown-editor/compare/v13.21.4...v13.22.0) (2024-10-08)


### Features

* **yfmHTMLBlock:** updated html-extension ([#407](https://github.com/gravity-ui/markdown-editor/issues/407)) ([54dfd2d](https://github.com/gravity-ui/markdown-editor/commit/54dfd2d947f17be19f2e756d23891b0855df6733))


### Bug Fixes

* updated README.md read more links ([#400](https://github.com/gravity-ui/markdown-editor/issues/400)) ([ae80119](https://github.com/gravity-ui/markdown-editor/commit/ae80119e578567222fde05a851e0e2b1948c05ac))

## [13.21.4](https://github.com/gravity-ui/markdown-editor/compare/v13.21.3...v13.21.4) (2024-10-02)


### Bug Fixes

* **bundle:** scroll to top of screen after calling moveCursorToLine method in wysiwyg mode ([#397](https://github.com/gravity-ui/markdown-editor/issues/397)) ([bf570b6](https://github.com/gravity-ui/markdown-editor/commit/bf570b646d141fdbfbfa84251268e7560de9f0b0))

## [13.21.3](https://github.com/gravity-ui/markdown-editor/compare/v13.21.2...v13.21.3) (2024-10-02)


### Bug Fixes

* **SelectionContext:** save editor state when start to select content with mouse ([#395](https://github.com/gravity-ui/markdown-editor/issues/395)) ([74d3b80](https://github.com/gravity-ui/markdown-editor/commit/74d3b80a2beb96cb04fb74f9d956e78ee7158d68))

## [13.21.2](https://github.com/gravity-ui/markdown-editor/compare/v13.21.1...v13.21.2) (2024-09-30)


### Bug Fixes

* command menu config ([#392](https://github.com/gravity-ui/markdown-editor/issues/392)) ([909ab9c](https://github.com/gravity-ui/markdown-editor/commit/909ab9c26a71565cc44a879019ae0006fe121b4f))

## [13.21.1](https://github.com/gravity-ui/markdown-editor/compare/v13.21.0...v13.21.1) (2024-09-30)


### Bug Fixes

* **YfmTable:** fixed styles of table ([#389](https://github.com/gravity-ui/markdown-editor/issues/389)) ([81cbe57](https://github.com/gravity-ui/markdown-editor/commit/81cbe57864143e109903b80a1cf2ae7ddfaa81ca))

## [13.21.0](https://github.com/gravity-ui/markdown-editor/compare/v13.20.0...v13.21.0) (2024-09-26)


### Features

* **CodeBlock:** unification of code block creation logic ([#384](https://github.com/gravity-ui/markdown-editor/issues/384)) ([d139318](https://github.com/gravity-ui/markdown-editor/commit/d139318500baa4b60c633191daf73204035dcfac))
* **markup:** update codemirror and add correct enter hotkeys ([#382](https://github.com/gravity-ui/markdown-editor/issues/382)) ([eef229a](https://github.com/gravity-ui/markdown-editor/commit/eef229a1befb8b2d57d81d2ca561cdaf231b18a4))

## [13.20.0](https://github.com/gravity-ui/markdown-editor/compare/v13.19.0...v13.20.0) (2024-09-26)


### Features

* **YfmTabs:** support vertical (radio) tabs ([#357](https://github.com/gravity-ui/markdown-editor/issues/357)) ([4baff56](https://github.com/gravity-ui/markdown-editor/commit/4baff5661f9dfdd83825545d3ce868d7a8e0110d))

## [13.19.0](https://github.com/gravity-ui/markdown-editor/compare/v13.18.2...v13.19.0) (2024-09-25)


### Features

* **markup:** added ability to override default placeholder in markup mode ([#376](https://github.com/gravity-ui/markdown-editor/issues/376)) ([b6b61f8](https://github.com/gravity-ui/markdown-editor/commit/b6b61f8137f9b8ac1f4ea0ba0cb390fe07876e88))


### Bug Fixes

* remove marks from breaks that are first node inside that mark ([#378](https://github.com/gravity-ui/markdown-editor/issues/378)) ([6b148fd](https://github.com/gravity-ui/markdown-editor/commit/6b148fd8adc023d2cf31d0cf982aa428f4d28c74))
* **YfmTable:** revert serialization logic for yfm-table row and cell ([#380](https://github.com/gravity-ui/markdown-editor/issues/380)) ([5d0e931](https://github.com/gravity-ui/markdown-editor/commit/5d0e9316d774b3d41ddbbd63b2dfc50ef04d2d98))

## [13.18.2](https://github.com/gravity-ui/markdown-editor/compare/v13.18.1...v13.18.2) (2024-09-23)


### Bug Fixes

* **lists:** fixed merge list ([#373](https://github.com/gravity-ui/markdown-editor/issues/373)) ([94917ee](https://github.com/gravity-ui/markdown-editor/commit/94917ee7b0ce240150ac58d736dbf2b4ded61901))

## [13.18.1](https://github.com/gravity-ui/markdown-editor/compare/v13.18.0...v13.18.1) (2024-09-19)


### Bug Fixes

* **code:** fixed paste in code and block code ([#370](https://github.com/gravity-ui/markdown-editor/issues/370)) ([f1f0068](https://github.com/gravity-ui/markdown-editor/commit/f1f00684ea37813ba41620c0a036bd357721ca92))
* **react-utils:** fixed useNodeResizing ([#372](https://github.com/gravity-ui/markdown-editor/issues/372)) ([4f8977a](https://github.com/gravity-ui/markdown-editor/commit/4f8977adeb60a823ca8530555da62abaa6f57823))
* **yfm:** correction of the gpt popup ([#367](https://github.com/gravity-ui/markdown-editor/issues/367)) ([2adfe7f](https://github.com/gravity-ui/markdown-editor/commit/2adfe7fbe94d1c31626d9695b9e2b623dedf5d51))

## [13.18.0](https://github.com/gravity-ui/markdown-editor/compare/v13.17.1...v13.18.0) (2024-09-13)


### Features

* support colspan and rowspan in table actions ([#356](https://github.com/gravity-ui/markdown-editor/issues/356)) ([65e4327](https://github.com/gravity-ui/markdown-editor/commit/65e43271ea524f58fbab55e39b62c762fda188cf))
* **yfm:** add GPT extensions ([#361](https://github.com/gravity-ui/markdown-editor/issues/361)) ([74d6e67](https://github.com/gravity-ui/markdown-editor/commit/74d6e67c3bcbcb980818a7445b6fd3eee9d52b73))

## [13.17.1](https://github.com/gravity-ui/markdown-editor/compare/v13.17.0...v13.17.1) (2024-09-12)


### Bug Fixes

* **ImgSize:** added ResizableImage ([#338](https://github.com/gravity-ui/markdown-editor/issues/338)) ([66ca04d](https://github.com/gravity-ui/markdown-editor/commit/66ca04d82f0b75752613edf5abee37fb4d9c9cd6))
* **packages:** fixed @diplodoc/transform version ([#364](https://github.com/gravity-ui/markdown-editor/issues/364)) ([054611a](https://github.com/gravity-ui/markdown-editor/commit/054611aad77f97cfbf3bc6192bbfcb5fd492d46a))

## [13.17.0](https://github.com/gravity-ui/markdown-editor/compare/v13.16.0...v13.17.0) (2024-09-05)


### Features

* **yfmHtmlBlock:** updated yfm-html-block ([#354](https://github.com/gravity-ui/markdown-editor/issues/354)) ([c63eadb](https://github.com/gravity-ui/markdown-editor/commit/c63eadbd2104a419a1a941ce510f2799e43765b0))

## [13.16.0](https://github.com/gravity-ui/markdown-editor/compare/v13.15.0...v13.16.0) (2024-08-29)


### Features

* **bundle:** scroll to top of screen when scrolling to line in markup mode ([#350](https://github.com/gravity-ui/markdown-editor/issues/350)) ([bd85a1c](https://github.com/gravity-ui/markdown-editor/commit/bd85a1c4c073c665c7fa9b8c7277a8441c6f378b))
* **yfmHtmlBlock:** updated css white list ([#349](https://github.com/gravity-ui/markdown-editor/issues/349)) ([049dc29](https://github.com/gravity-ui/markdown-editor/commit/049dc293b9831e022206c3399a2d942da108054b))

## [13.15.0](https://github.com/gravity-ui/markdown-editor/compare/v13.14.0...v13.15.0) (2024-08-29)


### Features

* add autocompletionConfig to markupConfig ([#325](https://github.com/gravity-ui/markdown-editor/issues/325)) ([ad9ce27](https://github.com/gravity-ui/markdown-editor/commit/ad9ce271620bf5fcf4d47e164eed944bfa9d334e))


### Bug Fixes

* **YfmHeading:** ignore anchor links inside headings when parse dom ([#348](https://github.com/gravity-ui/markdown-editor/issues/348)) ([a50d8a7](https://github.com/gravity-ui/markdown-editor/commit/a50d8a7a18c4c6375324f45a54fd58c274034ea5))
* **yfmHtmlBlock:** fixed types ([#344](https://github.com/gravity-ui/markdown-editor/issues/344)) ([a762690](https://github.com/gravity-ui/markdown-editor/commit/a762690bf3c76dd2dae8be373ffac31ff2607e1d))

## [13.14.0](https://github.com/gravity-ui/markdown-editor/compare/v13.13.0...v13.14.0) (2024-08-21)


### Features

* beforeEditorModeChange (experimental) ([#341](https://github.com/gravity-ui/markdown-editor/issues/341)) ([7a0bdcb](https://github.com/gravity-ui/markdown-editor/commit/7a0bdcb7ce69f7d72af4d82345a6ebf8b351558c))
* **yfmHtmlBlock:** updated @diplodoc/html-extension ([#343](https://github.com/gravity-ui/markdown-editor/issues/343)) ([4a6df56](https://github.com/gravity-ui/markdown-editor/commit/4a6df5662aa19b759653eef2e095a6e46874604c))


### Bug Fixes

* move escape config story to experiment ([#340](https://github.com/gravity-ui/markdown-editor/issues/340)) ([14d4d3e](https://github.com/gravity-ui/markdown-editor/commit/14d4d3e9357c1d1a0b7310fcae184b3b1f08dc4a))

## [13.13.0](https://github.com/gravity-ui/markdown-editor/compare/v13.12.1...v13.13.0) (2024-08-20)


### Features

* support custom escape regexp ([#337](https://github.com/gravity-ui/markdown-editor/issues/337)) ([a6dd38e](https://github.com/gravity-ui/markdown-editor/commit/a6dd38ed78f90984a3054e6fc0470fb715cf82ec))

## [13.12.1](https://github.com/gravity-ui/markdown-editor/compare/v13.12.0...v13.12.1) (2024-08-15)


### Bug Fixes

* **YfmHtmlBlock:** added YfmHtmlBlockOptions, added getSanitizeYfmHtmlBlock ([#332](https://github.com/gravity-ui/markdown-editor/issues/332)) ([999ba68](https://github.com/gravity-ui/markdown-editor/commit/999ba68ee6004fe732f380428b4188f081b5ba3e))

## [13.12.0](https://github.com/gravity-ui/markdown-editor/compare/v13.11.0...v13.12.0) (2024-08-15)


### Features

* emit flag for setEditorMode ([#334](https://github.com/gravity-ui/markdown-editor/issues/334)) ([e633ab4](https://github.com/gravity-ui/markdown-editor/commit/e633ab413b57ba1aef6a002fb5f5a1b0c38c8b99))

## [13.11.0](https://github.com/gravity-ui/markdown-editor/compare/v13.10.0...v13.11.0) (2024-08-15)


### Features

* support overriding codemirror history extension ([#331](https://github.com/gravity-ui/markdown-editor/issues/331)) ([333a816](https://github.com/gravity-ui/markdown-editor/commit/333a8163cb33ef01399916396c664ae663e55111))

## [13.10.0](https://github.com/gravity-ui/markdown-editor/compare/v13.9.0...v13.10.0) (2024-08-09)


### Features

* **yfHtmlBlock:** updated YfmHtmlBlock options ([#327](https://github.com/gravity-ui/markdown-editor/issues/327)) ([1b6b9e0](https://github.com/gravity-ui/markdown-editor/commit/1b6b9e028f57f182aa73223efb8e6dfbf94a2a86))

## [13.9.0](https://github.com/gravity-ui/markdown-editor/compare/v13.8.0...v13.9.0) (2024-08-05)


### Features

* **YfmTable:** added support of colspan, rowspan and cell-align in yfm-tables ([#324](https://github.com/gravity-ui/markdown-editor/issues/324)) ([14dd054](https://github.com/gravity-ui/markdown-editor/commit/14dd0544ed445629b3802e0f1ce00e9ea9b044b8))

## [13.8.0](https://github.com/gravity-ui/markdown-editor/compare/v13.7.0...v13.8.0) (2024-08-01)


### Features

* **bundle:** improve drilling of codemirror config ([#323](https://github.com/gravity-ui/markdown-editor/issues/323)) ([9bf6d5d](https://github.com/gravity-ui/markdown-editor/commit/9bf6d5d6fb05b20a3091cfba30562dc08f7b9eea))
* support YfmLangOptions drilling to markup editor ([#303](https://github.com/gravity-ui/markdown-editor/issues/303)) ([4564256](https://github.com/gravity-ui/markdown-editor/commit/4564256e34183f0081afedb841de0f1fe8349535))


### Bug Fixes

* **FoldingHeading:** correct position of separator on bottom edge of section ([#322](https://github.com/gravity-ui/markdown-editor/issues/322)) ([5fff3ca](https://github.com/gravity-ui/markdown-editor/commit/5fff3caa3e94ca19f6a7177bb1c1f2b4e8fad5cd))
* **view:** add support for opening folding-headings in useYfmShowElemWithId() hook ([#320](https://github.com/gravity-ui/markdown-editor/issues/320)) ([05c363b](https://github.com/gravity-ui/markdown-editor/commit/05c363b2b6e8a35fbe20dcd33ece8918c64ba441))

## [13.7.0](https://github.com/gravity-ui/markdown-editor/compare/v13.6.1...v13.7.0) (2024-08-01)


### Features

* **markup:** added yfmLang autocomplete options ([#315](https://github.com/gravity-ui/markdown-editor/issues/315)) ([31e2a79](https://github.com/gravity-ui/markdown-editor/commit/31e2a79a9d6b35dfd93f4088525514d5fc283ec8))

## [13.6.1](https://github.com/gravity-ui/markdown-editor/compare/v13.6.0...v13.6.1) (2024-08-01)


### Bug Fixes

* **build:** fixed build of styles ([#317](https://github.com/gravity-ui/markdown-editor/issues/317)) ([0349c71](https://github.com/gravity-ui/markdown-editor/commit/0349c71b597cab9ce72679d1854bb7e0357daaec))

## [13.6.0](https://github.com/gravity-ui/markdown-editor/compare/v13.5.3...v13.6.0) (2024-08-01)


### Features

* add FoldingHeading extension ([#314](https://github.com/gravity-ui/markdown-editor/issues/314)) ([b904704](https://github.com/gravity-ui/markdown-editor/commit/b9047045c77656e4721eb1852f8d2ec018d9f5db))


### Bug Fixes

* **bundle:** scroll to current line after moving cursor in markup mode ([#313](https://github.com/gravity-ui/markdown-editor/issues/313)) ([dd56733](https://github.com/gravity-ui/markdown-editor/commit/dd567333865914d7be1de734cb4413737e2a9b62))

## [13.5.3](https://github.com/gravity-ui/markdown-editor/compare/v13.5.2...v13.5.3) (2024-07-29)


### Bug Fixes

* **toolbar:** show hint in ToolbarButton tooltip ([#311](https://github.com/gravity-ui/markdown-editor/issues/311)) ([0b9000b](https://github.com/gravity-ui/markdown-editor/commit/0b9000bf8afb0e55fc9bd7d43a7bb97c42805adc))

## [13.5.2](https://github.com/gravity-ui/markdown-editor/compare/v13.5.1...v13.5.2) (2024-07-29)


### Bug Fixes

* **forms:** added utils re-export ([#310](https://github.com/gravity-ui/markdown-editor/issues/310)) ([13733ed](https://github.com/gravity-ui/markdown-editor/commit/13733ed2d53c8561305b2e2475f77f95751488c8))
* **yfmHtmlBlock:** added sanitize prop to YfmHtmlBlockView ([#307](https://github.com/gravity-ui/markdown-editor/issues/307)) ([a4ad5cd](https://github.com/gravity-ui/markdown-editor/commit/a4ad5cdc3bf6a4641882870a45b3bf4d00b3bbb9))

## [13.5.1](https://github.com/gravity-ui/markdown-editor/compare/v13.5.0...v13.5.1) (2024-07-26)


### Bug Fixes

* **yfmHtmlBlock:** added sanitize prop to YfmHtmlBlock wysiwyg extension ([#304](https://github.com/gravity-ui/markdown-editor/issues/304)) ([d620fe7](https://github.com/gravity-ui/markdown-editor/commit/d620fe7c8f4d7aba37883b11bcfbfa235870dec6))
* **yfmHtmlBlock:** added sanitize prop to YfmHtmlBlock wysiwyg extension ([#306](https://github.com/gravity-ui/markdown-editor/issues/306)) ([f3a480e](https://github.com/gravity-ui/markdown-editor/commit/f3a480e84b0a16146257f8d31f6d7826dbdca925))

## [13.5.0](https://github.com/gravity-ui/markdown-editor/compare/v13.4.2...v13.5.0) (2024-07-26)


### Features

* **markup:** added markup search ([#295](https://github.com/gravity-ui/markdown-editor/issues/295)) ([48372a6](https://github.com/gravity-ui/markdown-editor/commit/48372a62db3da4ec92bd09e89ff5aee688cacdd7))

## [13.4.2](https://github.com/gravity-ui/markdown-editor/compare/v13.4.1...v13.4.2) (2024-07-25)


### Bug Fixes

* **main:** fix en yfm syntax documentation link ([#300](https://github.com/gravity-ui/markdown-editor/issues/300)) ([9b80812](https://github.com/gravity-ui/markdown-editor/commit/9b808128a2042a91cfeead70a2d1113c4fe55961))
* **table:** fixed scroll for wide table inside the cut ([#296](https://github.com/gravity-ui/markdown-editor/issues/296)) ([33970cd](https://github.com/gravity-ui/markdown-editor/commit/33970cd23fd1230c5a43a32a2fe37fb3340dbcf5))

## [13.4.1](https://github.com/gravity-ui/markdown-editor/compare/v13.4.0...v13.4.1) (2024-07-19)


### Bug Fixes

* **presets:** fixed yfm and full presets ([#294](https://github.com/gravity-ui/markdown-editor/issues/294)) ([1cc1881](https://github.com/gravity-ui/markdown-editor/commit/1cc1881c048c0634db42728104c3fd01e0b76d79))
* **table-utils:** fixed remove first column ([#291](https://github.com/gravity-ui/markdown-editor/issues/291)) ([a27d454](https://github.com/gravity-ui/markdown-editor/commit/a27d454f3a29671f5707805fc23bd1c0746ac192))

## [13.4.0](https://github.com/gravity-ui/markdown-editor/compare/v13.3.0...v13.4.0) (2024-07-15)


### Features

* **YfmHtmlBlock:** added YfmHtmlBlock extension ([#281](https://github.com/gravity-ui/markdown-editor/issues/281)) ([1eb4d11](https://github.com/gravity-ui/markdown-editor/commit/1eb4d11f1f51668252d04da4f16900620a634894))

## [13.3.0](https://github.com/gravity-ui/markdown-editor/compare/v13.2.0...v13.3.0) (2024-07-15)


### Features

* **bundle:** prevent loss of focus after pressing tab or shift+tab ([#287](https://github.com/gravity-ui/markdown-editor/issues/287)) ([63feec2](https://github.com/gravity-ui/markdown-editor/commit/63feec2ffbe46d540f9003698be887511f84f725))
* pass extra codemirror extensions ([#289](https://github.com/gravity-ui/markdown-editor/issues/289)) ([4996b12](https://github.com/gravity-ui/markdown-editor/commit/4996b122da55a9505af591353d33484af30b66d9))


### Bug Fixes

* **markup:** insert tab when selection is empty ([#286](https://github.com/gravity-ui/markdown-editor/issues/286)) ([cba9f28](https://github.com/gravity-ui/markdown-editor/commit/cba9f286ba7def9211a3038b263c6c7c779541d3))

## [13.2.0](https://github.com/gravity-ui/markdown-editor/compare/v13.1.2...v13.2.0) (2024-07-10)


### Features

* **SelectionContext:** support for hiding menu items when action in selection menu is disabled ([#283](https://github.com/gravity-ui/markdown-editor/issues/283)) ([6948cc4](https://github.com/gravity-ui/markdown-editor/commit/6948cc49d4f3208382572d95157b67612a8d9255))
* **YfmHeading:** support folding attribute ([#285](https://github.com/gravity-ui/markdown-editor/issues/285)) ([100a548](https://github.com/gravity-ui/markdown-editor/commit/100a5488b3a8fde8489677d60cf36c049cf8515a))


### Bug Fixes

* **markup:** add gravity theme to autocomplete snippet ([#279](https://github.com/gravity-ui/markdown-editor/issues/279)) ([0836bce](https://github.com/gravity-ui/markdown-editor/commit/0836bcefdfcb86cf97ea6bb86cbed6a1e4d14262))

## [13.1.2](https://github.com/gravity-ui/markdown-editor/compare/v13.1.1...v13.1.2) (2024-06-25)


### Bug Fixes

* **Lists:** fixed merging of nested lists ([#276](https://github.com/gravity-ui/markdown-editor/issues/276)) ([2c435bd](https://github.com/gravity-ui/markdown-editor/commit/2c435bd42d603e97c6849e67538c5d7790660fe8))
* **Lists:** preserve markup of list items ([#278](https://github.com/gravity-ui/markdown-editor/issues/278)) ([70ee410](https://github.com/gravity-ui/markdown-editor/commit/70ee410f8eb52c93a601253fec8f68e233672899))

## [13.1.1](https://github.com/gravity-ui/markdown-editor/compare/v13.1.0...v13.1.1) (2024-06-21)


### Bug Fixes

* **YfmTable:** fix runtime error in table cell nodeView ([#274](https://github.com/gravity-ui/markdown-editor/issues/274)) ([15e0cd4](https://github.com/gravity-ui/markdown-editor/commit/15e0cd4fbbfe3bd75a0138daf5b98e949f602a2a))

## [13.1.0](https://github.com/gravity-ui/markdown-editor/compare/v13.0.0...v13.1.0) (2024-06-10)


### Features

* add i18n submodule ([#270](https://github.com/gravity-ui/markdown-editor/issues/270)) ([23f71f1](https://github.com/gravity-ui/markdown-editor/commit/23f71f1374cad86ed30c6961d8188b38a67dd887))
* **deps:** update prosemirror dependencies ([#272](https://github.com/gravity-ui/markdown-editor/issues/272)) ([c1ae1e2](https://github.com/gravity-ui/markdown-editor/commit/c1ae1e272a51779258b818bdd2fcdfcf173d4338))

## [13.0.0](https://github.com/gravity-ui/markdown-editor/compare/v12.4.0...v13.0.0) (2024-06-07)


### ⚠ BREAKING CHANGES

* transfer connection of markdown-it-attrs plugin to YfmConfigs extension ([#263](https://github.com/gravity-ui/markdown-editor/issues/263))
* **bundle:** rename editorType ––> editorMode ([#260](https://github.com/gravity-ui/markdown-editor/issues/260))
* **bundle:** rename yfm ––> markdown in variable and file names ([#259](https://github.com/gravity-ui/markdown-editor/issues/259))
* **bundle:** remove deprecated YfmEditor component ([#258](https://github.com/gravity-ui/markdown-editor/issues/258))
* change package name ([#254](https://github.com/gravity-ui/markdown-editor/issues/254))
* rename yfm -> md in core and dependent modules ([#249](https://github.com/gravity-ui/markdown-editor/issues/249))
* update markup mode to codemirror6 ([#234](https://github.com/gravity-ui/markdown-editor/issues/234))

### Features

* add editor presets ([#265](https://github.com/gravity-ui/markdown-editor/issues/265)) ([a2d8153](https://github.com/gravity-ui/markdown-editor/commit/a2d815346b230ae1d593fe499dd76f7e7b4f14d3))
* add g-md-editor classname to editor dom elem, change default prefix for internal classnames ([#257](https://github.com/gravity-ui/markdown-editor/issues/257)) ([82b42ce](https://github.com/gravity-ui/markdown-editor/commit/82b42ceb1d8e450b3697c98c9b8b4a2210beb085))
* add re-export from bundle to root export ([#267](https://github.com/gravity-ui/markdown-editor/issues/267)) ([86fcb00](https://github.com/gravity-ui/markdown-editor/commit/86fcb00f776edaf022e620b21c03bdb6285e9f34))
* add re-export of codemirror core modules ([#266](https://github.com/gravity-ui/markdown-editor/issues/266)) ([9ccf3b1](https://github.com/gravity-ui/markdown-editor/commit/9ccf3b1a6d0207c0587ffda58f84318670993e3b))
* **bundle:** remove deprecated YfmEditor component ([#258](https://github.com/gravity-ui/markdown-editor/issues/258)) ([db3749a](https://github.com/gravity-ui/markdown-editor/commit/db3749ae150686a33ee1b07ce8b5129535dca292))
* **bundle:** rename editorType ––&gt; editorMode ([#260](https://github.com/gravity-ui/markdown-editor/issues/260)) ([bd0afe8](https://github.com/gravity-ui/markdown-editor/commit/bd0afe8093120d27857d553d149f81676dc55634))
* **bundle:** rename yfm ––&gt; markdown in variable and file names ([#259](https://github.com/gravity-ui/markdown-editor/issues/259)) ([c63381f](https://github.com/gravity-ui/markdown-editor/commit/c63381f6990a1f1bd6b708f09f31ae38e46c9c83))
* change package name ([#254](https://github.com/gravity-ui/markdown-editor/issues/254)) ([85cc2af](https://github.com/gravity-ui/markdown-editor/commit/85cc2affc4b52a3dacfd02995e5d8e02221fe260))
* **Lists:** add auto merging of adjacent list of same type ([#241](https://github.com/gravity-ui/markdown-editor/issues/241)) ([c02de80](https://github.com/gravity-ui/markdown-editor/commit/c02de80168cdc492106efc34c6485a0002feb165))
* **note, tabs:** added leave block logic for second enter ([#248](https://github.com/gravity-ui/markdown-editor/issues/248)) ([ed8ba66](https://github.com/gravity-ui/markdown-editor/commit/ed8ba6617d20ed7e7a31034a1e94697a4f4dc55d))
* rename yfm -&gt; md in core and dependent modules ([#249](https://github.com/gravity-ui/markdown-editor/issues/249)) ([e12abda](https://github.com/gravity-ui/markdown-editor/commit/e12abdaef26a1c5624183cdfae40c61bdf5e5e91))
* transfer connection of markdown-it-attrs plugin to YfmConfigs extension ([#263](https://github.com/gravity-ui/markdown-editor/issues/263)) ([2816c18](https://github.com/gravity-ui/markdown-editor/commit/2816c18f2176edccb9e3523ecbf1dad76105da5a))
* update markup mode to codemirror6 ([#234](https://github.com/gravity-ui/markdown-editor/issues/234)) ([5b416b2](https://github.com/gravity-ui/markdown-editor/commit/5b416b295396ff3791192ecbd45f842f6294cfd7))


### Bug Fixes

* **CodeBlock:** Fixed code insert ([#251](https://github.com/gravity-ui/markdown-editor/issues/251)) ([df9848e](https://github.com/gravity-ui/markdown-editor/commit/df9848eb23c045f87803444db2bbb1b7a645022c))
* don't split code_block in lists when pressing enter key ([#243](https://github.com/gravity-ui/markdown-editor/issues/243)) ([c494301](https://github.com/gravity-ui/markdown-editor/commit/c4943018be617bdfc8eaf7024e792937a8e56411))
* **forms:** deleted unused iframe_ keysets ([#242](https://github.com/gravity-ui/markdown-editor/issues/242)) ([e6d6ba4](https://github.com/gravity-ui/markdown-editor/commit/e6d6ba443db4856036d0d637a0cf50cd4894e7e8))
* **ImageForm:** updated autofocus logic, added useAutoFocus ([#245](https://github.com/gravity-ui/markdown-editor/issues/245)) ([c4da6bd](https://github.com/gravity-ui/markdown-editor/commit/c4da6bd98a6279dc9a2326f304d0a3a99cc39480))
* **Link:** ascape parentheses in link url ([#244](https://github.com/gravity-ui/markdown-editor/issues/244)) ([046dd2e](https://github.com/gravity-ui/markdown-editor/commit/046dd2e21265958e56b594e897f475a47e8f39ee))
* **react-utils:** fix for useNodeEditing and useNodeHover hooks ([#239](https://github.com/gravity-ui/markdown-editor/issues/239)) ([48d018d](https://github.com/gravity-ui/markdown-editor/commit/48d018d05de01ab30b75cc0cc03b36a99c5f5e83))

## [12.4.0](https://github.com/yandex-cloud/yfm-editor/compare/v12.3.0...v12.4.0) (2024-04-19)


### Features

* **BaseKeymap:** remove keymap for joinUp and joinDown commands ([#233](https://github.com/yandex-cloud/yfm-editor/issues/233)) ([c34ef8a](https://github.com/yandex-cloud/yfm-editor/commit/c34ef8ab7b02cb02feee3c8896844c896a744271))
* **toolbar, bundle:** add ToolbarButtonPopup type and use it for link, image and file actions in murkup mode ([#228](https://github.com/yandex-cloud/yfm-editor/issues/228)) ([0040e2a](https://github.com/yandex-cloud/yfm-editor/commit/0040e2a0d1c91b39cf5c50a270abdc37d435d3af))


### Bug Fixes

* fixed position of HelpPopover ([#230](https://github.com/yandex-cloud/yfm-editor/issues/230)) ([bb9c9b6](https://github.com/yandex-cloud/yfm-editor/commit/bb9c9b6ddf7056bb612124b460a6331bc632c281))
* **table-utils:** fix deleting columns in tables with nested tables ([#231](https://github.com/yandex-cloud/yfm-editor/issues/231)) ([64d81a6](https://github.com/yandex-cloud/yfm-editor/commit/64d81a65dc5ff245f543d68294328419dac9a01a))
* **YfmTableAdditions:** fix positioning of floating buttons of yfm-table ([#232](https://github.com/yandex-cloud/yfm-editor/issues/232)) ([52ef503](https://github.com/yandex-cloud/yfm-editor/commit/52ef503862c0ee1e59da4eccada71761bca247ec))

## [12.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v12.2.1...v12.3.0) (2024-04-17)


### Features

* support button changes in uikit 6.11.0 ([#227](https://github.com/yandex-cloud/yfm-editor/issues/227)) ([cdbc022](https://github.com/yandex-cloud/yfm-editor/commit/cdbc022b9bb2275ffa5a96d46bdb206af88b618b))
* support uploading files dragged and dropped from device in markup mode ([#226](https://github.com/yandex-cloud/yfm-editor/issues/226)) ([c60f72e](https://github.com/yandex-cloud/yfm-editor/commit/c60f72e2d0a5b1285b10b5cee585b90a79177d04))


### Bug Fixes

* do not apply input rule to text with code mark ([#224](https://github.com/yandex-cloud/yfm-editor/issues/224)) ([237c77c](https://github.com/yandex-cloud/yfm-editor/commit/237c77c3a096f80eb30b5be32672ed5944475409))

## [12.2.1](https://github.com/yandex-cloud/yfm-editor/compare/v12.2.0...v12.2.1) (2024-04-09)


### Bug Fixes

* added more exports to package.json ([#222](https://github.com/yandex-cloud/yfm-editor/issues/222)) ([87817ae](https://github.com/yandex-cloud/yfm-editor/commit/87817ae81291f284a9f2bde77df593216930ad59))

## [12.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v12.1.0...v12.2.0) (2024-04-08)


### Features

* **Checkbox:** improve checkbox insertion ([#220](https://github.com/yandex-cloud/yfm-editor/issues/220)) ([cbcebf3](https://github.com/yandex-cloud/yfm-editor/commit/cbcebf3f60c8a8583422499b146b61dcb7cb07de))
* **HorizontalRule:** improve horizontal line insertion ([#218](https://github.com/yandex-cloud/yfm-editor/issues/218)) ([71813a2](https://github.com/yandex-cloud/yfm-editor/commit/71813a294e97fd1e5262da043a4d20dfccf9a8dc))


### Bug Fixes

* fixed `typesVersions` field in package.json ([#221](https://github.com/yandex-cloud/yfm-editor/issues/221)) ([66dbcc5](https://github.com/yandex-cloud/yfm-editor/commit/66dbcc5fbc0fc0193b478f708c6676a4d91d0594))

## [12.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v12.0.1...v12.1.0) (2024-04-05)


### Features

* added colors from uikit, added nore exports ([#216](https://github.com/yandex-cloud/yfm-editor/issues/216)) ([feefd82](https://github.com/yandex-cloud/yfm-editor/commit/feefd820a8051c45f08ce9e6cd337f4844a864dc))
* support uploading files dragged and dropped from device ([#214](https://github.com/yandex-cloud/yfm-editor/issues/214)) ([3367f4b](https://github.com/yandex-cloud/yfm-editor/commit/3367f4b83143d6b370e08d931cfdbabf393788d5))

## [12.0.1](https://github.com/yandex-cloud/yfm-editor/compare/v12.0.0...v12.0.1) (2024-04-04)


### Bug Fixes

* fixed style, exports and typings after adding more functionality ([#213](https://github.com/yandex-cloud/yfm-editor/issues/213)) ([ad320a7](https://github.com/yandex-cloud/yfm-editor/commit/ad320a7dfed28d94c578a39296208cfabdd9e668))
* **LinkEnhance:** show creation widget when create link with whitespaces at end of selected text ([#211](https://github.com/yandex-cloud/yfm-editor/issues/211)) ([978a828](https://github.com/yandex-cloud/yfm-editor/commit/978a828784ed829689a3266f14bbf4b325530bba))
* **Placeholder:** fixed issue with displaying a fake cursor in Safari ([#212](https://github.com/yandex-cloud/yfm-editor/issues/212)) ([c9c6fb5](https://github.com/yandex-cloud/yfm-editor/commit/c9c6fb581ac00198504c9d8425b3656c924e3fdd))
* **SelectionContext:** dont show selection menu until mouse is pressed ([#209](https://github.com/yandex-cloud/yfm-editor/issues/209)) ([cde768c](https://github.com/yandex-cloud/yfm-editor/commit/cde768c66c291970b4b7104b38fce1be3b3fb613))

## [12.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v11.0.0...v12.0.0) (2024-03-26)


### ⚠ BREAKING CHANGES

* added more functionality ([#207](https://github.com/yandex-cloud/yfm-editor/issues/207))

### Features

* added more functionality ([#207](https://github.com/yandex-cloud/yfm-editor/issues/207)) ([de54991](https://github.com/yandex-cloud/yfm-editor/commit/de549914279be23f6b45dda50aec5ba7fdb7c439))

## [11.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v10.2.3...v11.0.0) (2024-03-04)


### ⚠ BREAKING CHANGES

* update @gravity-ui/uikit to verison 6 ([#205](https://github.com/yandex-cloud/yfm-editor/issues/205))

### Features

* update @gravity-ui/uikit to verison 6 ([#205](https://github.com/yandex-cloud/yfm-editor/issues/205)) ([7cf7347](https://github.com/yandex-cloud/yfm-editor/commit/7cf7347740392e53520d9940d753c6a9cf356421))

## [10.2.3](https://github.com/yandex-cloud/yfm-editor/compare/v10.2.2...v10.2.3) (2024-03-01)


### Bug Fixes

* **Clipboard:** copy only text content from codeblock ([#204](https://github.com/yandex-cloud/yfm-editor/issues/204)) ([67e55fc](https://github.com/yandex-cloud/yfm-editor/commit/67e55fc1bbe1b52cf407a340efbd43534c0957c8))
* **CodeBlock:** fixed parsing of language from token.info and added support for different code_block markup ([#202](https://github.com/yandex-cloud/yfm-editor/issues/202)) ([85509ff](https://github.com/yandex-cloud/yfm-editor/commit/85509ff30bf91b3ec9afa6b0f987f45f3f6ebf7f))

## [10.2.2](https://github.com/yandex-cloud/yfm-editor/compare/v10.2.1...v10.2.2) (2024-02-22)


### Bug Fixes

* **Table:** correct serialization of the table inside blockquote ([#199](https://github.com/yandex-cloud/yfm-editor/issues/199)) ([9d27a3f](https://github.com/yandex-cloud/yfm-editor/commit/9d27a3fcf381894c009b676916911d3fc232eb95))
* **YfmTabs:** correct serialization of yfm-tabs inside blockqoute ([#201](https://github.com/yandex-cloud/yfm-editor/issues/201)) ([e2f5d27](https://github.com/yandex-cloud/yfm-editor/commit/e2f5d2792f1646eae48252bca3bb26e7831bd27b))

## [10.2.1](https://github.com/yandex-cloud/yfm-editor/compare/v10.2.0...v10.2.1) (2024-02-20)


### Bug Fixes

* **Math:** allow to modify dom-attributes of math nodes ([#197](https://github.com/yandex-cloud/yfm-editor/issues/197)) ([c7fd967](https://github.com/yandex-cloud/yfm-editor/commit/c7fd96764e61f4d086b431c87901f0ed2331c8ba))

## [10.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v10.1.0...v10.2.0) (2024-02-20)


### Features

* adding a link to image when pasting a link on selected image node ([#194](https://github.com/yandex-cloud/yfm-editor/issues/194)) ([c64dd68](https://github.com/yandex-cloud/yfm-editor/commit/c64dd68e4b46551903894d73fdae9a13e99b2d89))
* option to not highlighting active list button and toParagraph action improvement ([#196](https://github.com/yandex-cloud/yfm-editor/issues/196)) ([35d0219](https://github.com/yandex-cloud/yfm-editor/commit/35d0219b8414ec210c5442497f24ba982c512991))

## [10.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v10.0.0...v10.1.0) (2024-02-16)


### Features

* heading button that resets heading back to paragraph ([#190](https://github.com/yandex-cloud/yfm-editor/issues/190)) ([475c879](https://github.com/yandex-cloud/yfm-editor/commit/475c87942897e775f6a8dd922373aa0f746879f7))
* **toolbar:** add property to show custom hint when action is disabled ([#193](https://github.com/yandex-cloud/yfm-editor/issues/193)) ([f08366a](https://github.com/yandex-cloud/yfm-editor/commit/f08366a2efcd1564ad01fcd6add3af80a411e8b1))
* **YfmCut:** add border to editable yfm-cut nodes ([#189](https://github.com/yandex-cloud/yfm-editor/issues/189)) ([03a1ad2](https://github.com/yandex-cloud/yfm-editor/commit/03a1ad257b4439ec2b30339ff7d13bc45feb8839))
* **YfmCut:** improve the behavior when creating yfm-cut ([#191](https://github.com/yandex-cloud/yfm-editor/issues/191)) ([67c2300](https://github.com/yandex-cloud/yfm-editor/commit/67c230025cea5c763d7754e7805c1b4783c23db7))
* **YfmTabs:** change text color of yfm-tabs tab placeholder ([#192](https://github.com/yandex-cloud/yfm-editor/issues/192)) ([42be1aa](https://github.com/yandex-cloud/yfm-editor/commit/42be1aa7bc89a3a194da82e3f31efd57030487be))


### Bug Fixes

* **deps:** add markdown-it-attrs to deps ([#187](https://github.com/yandex-cloud/yfm-editor/issues/187)) ([21fdd74](https://github.com/yandex-cloud/yfm-editor/commit/21fdd74e3cdc2566e5cb49543014392da3afb07d))

## [10.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v9.3.1...v10.0.0) (2024-02-06)

### ⚠ BREAKING CHANGES

* feat!: use diplodoc/latex-extension instead of markdown-it-katex ([#184](https://github.com/yandex-cloud/yfm-editor/issues/184))
  > - added packages to peerDependencies: `@diplodoc/latex-extension`, `katex`, `markdown-it`
  > - editor's Math extension now use `@diplodoc/latex-extension` instead of `markdown-it-katex`
  > - Math extension removed from YfmPreset/YfmSpecsPreset and package root export
  > - added options to Math extension
  >
  > Example of using a Math extension:
  >
  > ```js
  > import {Math} from '@doc-tools/yfm-editor/_/extensions/yfm/Math';
  >
  > // ...
  >
  > builder.use(Math, {
  > // required
  > loadRuntimeScript: async () => {
  >     await Promise.all([
  >     import('@diplodoc/latex-extension/runtime'),
  >     import('@diplodoc/latex-extension/runtime/styles'),
  >     ]);
  > },
  > // optional; if you need custom sanitizing
  > sanitize: (html) => /* sanitize html */ html,
  > // optional; options to be passed to katex
  > katexOptions: {},
  > });
  > ```

### Features

* feat!: use diplodoc/latex-extension instead of markdown-it-katex ([#184](https://github.com/yandex-cloud/yfm-editor/issues/184)) ([80ad40f](https://github.com/yandex-cloud/yfm-editor/commit/80ad40f822a92eebc7215a6adb21f1f1007f32c8))

### Bug Fixes

* **YfmCut:** reduce code duplication ([#185](https://github.com/yandex-cloud/yfm-editor/issues/185)) ([76974ce](https://github.com/yandex-cloud/yfm-editor/commit/76974ceede9d2345980b7d11dcd6dc3deccf3b49))

## [9.3.1](https://github.com/yandex-cloud/yfm-editor/compare/v9.3.0...v9.3.1) (2024-02-01)


### Bug Fixes

* increased priority of list keymap ([#182](https://github.com/yandex-cloud/yfm-editor/issues/182)) ([96fed08](https://github.com/yandex-cloud/yfm-editor/commit/96fed08bdb1841ea81979bcff6d805ee9323bf15))

## [9.3.0](https://github.com/yandex-cloud/yfm-editor/compare/v9.2.0...v9.3.0) (2024-01-26)


### Features

* **core:** allow to parse blocks with noCloseToken=true with content from children tokens ([#180](https://github.com/yandex-cloud/yfm-editor/issues/180)) ([d362717](https://github.com/yandex-cloud/yfm-editor/commit/d36271755e96a0807bcf64d75014a4fc6f599f78))

## [9.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v9.1.1...v9.2.0) (2024-01-25)


### Features

* add re-export of markdown-it plugins ([#179](https://github.com/yandex-cloud/yfm-editor/issues/179)) ([affd462](https://github.com/yandex-cloud/yfm-editor/commit/affd462578a1a4158fd209fbddcdc3d1c6806dc3))
* added ability to pass marks to updateAttributes method of ReactNodeView ([#177](https://github.com/yandex-cloud/yfm-editor/issues/177)) ([93e63de](https://github.com/yandex-cloud/yfm-editor/commit/93e63de452f1743a99e5e60ab3364cc84bccb9e0))

## [9.1.1](https://github.com/yandex-cloud/yfm-editor/compare/v9.1.0...v9.1.1) (2023-12-26)


### Bug Fixes

* update lint rules and remove import of lodash global object ([#175](https://github.com/yandex-cloud/yfm-editor/issues/175)) ([64c83fb](https://github.com/yandex-cloud/yfm-editor/commit/64c83fb163906c7b3e390367023ee58f5f3da5ea))

## [9.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v9.0.0...v9.1.0) (2023-12-21)


### Features

* add core submodule to package exports ([#171](https://github.com/yandex-cloud/yfm-editor/issues/171)) ([2c967b5](https://github.com/yandex-cloud/yfm-editor/commit/2c967b5e5340766fbf0f0b642e3a106d9fba5d62))
* add re-export of prosemirror-test-builder ([#174](https://github.com/yandex-cloud/yfm-editor/issues/174)) ([6eaf21b](https://github.com/yandex-cloud/yfm-editor/commit/6eaf21b26980d5348c385087c8f8f79bac2c575b))
* update prosemirror packages ([#173](https://github.com/yandex-cloud/yfm-editor/issues/173)) ([bee420d](https://github.com/yandex-cloud/yfm-editor/commit/bee420d7af377a21146b8106eecacc156efcb83b))

## [9.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v8.2.1...v9.0.0) (2023-12-20)


### ⚠ BREAKING CHANGES

* add package exports ([#169](https://github.com/yandex-cloud/yfm-editor/issues/169))

### Features

* add package exports ([#169](https://github.com/yandex-cloud/yfm-editor/issues/169)) ([b312dc7](https://github.com/yandex-cloud/yfm-editor/commit/b312dc7934890c8304815d0f6e461d8f280812b3))

## [8.2.1](https://github.com/yandex-cloud/yfm-editor/compare/v8.2.0...v8.2.1) (2023-12-18)


### Bug Fixes

* wrong position when adding new row ([#167](https://github.com/yandex-cloud/yfm-editor/issues/167)) ([a40557a](https://github.com/yandex-cloud/yfm-editor/commit/a40557ac3873b7a7de538d796adc43d4a1260c15))

## [8.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v8.1.0...v8.2.0) (2023-12-11)


### Features

* support image loading attribute ([#165](https://github.com/yandex-cloud/yfm-editor/issues/165)) ([6750a3f](https://github.com/yandex-cloud/yfm-editor/commit/6750a3f654775b6244846b28d171202832970ae1))

## [8.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v8.0.0...v8.1.0) (2023-12-07)


### Features

* added a node view for rendering react block ([#163](https://github.com/yandex-cloud/yfm-editor/issues/163)) ([67a325a](https://github.com/yandex-cloud/yfm-editor/commit/67a325a048694dd44ce1e5da8b408e4c79ce70eb))

## [8.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v7.2.0...v8.0.0) (2023-12-01)


### ⚠ BREAKING CHANGES

* content node for yfm note ([#161](https://github.com/yandex-cloud/yfm-editor/issues/161))

### Features

* content node for yfm note ([#161](https://github.com/yandex-cloud/yfm-editor/issues/161)) ([6566d78](https://github.com/yandex-cloud/yfm-editor/commit/6566d78460f93dea8b0378d044fff56250ed64ba))

## [7.2.0](https://github.com/yandex-cloud/yfm-editor/compare/v7.1.0...v7.2.0) (2023-11-20)


### Features

* **YfmTabs:** auto-switching tabs in yfm-tabs when dragging over it ([#157](https://github.com/yandex-cloud/yfm-editor/issues/157)) ([c4fdcbc](https://github.com/yandex-cloud/yfm-editor/commit/c4fdcbc65e0d3a4cde44fa6f748411feff32da4a))


### Bug Fixes

* improvements for toolbar hidden actions ([#155](https://github.com/yandex-cloud/yfm-editor/issues/155)) ([d15839b](https://github.com/yandex-cloud/yfm-editor/commit/d15839b3dd04b5ea917f4ae86a03cad25a2f1fd4))

## [7.1.0](https://github.com/yandex-cloud/yfm-editor/compare/v7.0.0...v7.1.0) (2023-11-17)


### Features

* **YfmCut:** auto-opening yfm-cut when dragging over it ([#152](https://github.com/yandex-cloud/yfm-editor/issues/152)) ([a7612c3](https://github.com/yandex-cloud/yfm-editor/commit/a7612c3118866709a225db391ac999118c2a7ec9))
* Add data-line attrs support for heading and paragraph ([#152](https://github.com/yandex-cloud/yfm-editor/issues/158))

## [7.0.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.7.0...v7.0.0) (2023-11-09)


### ⚠ BREAKING CHANGES

* replace @doc-tools/transform@3.10.2 with @diplodoc/transform@4.2.1 ([#151](https://github.com/yandex-cloud/yfm-editor/issues/151))

### Features

* replace @doc-tools/transform@3.10.2 with @diplodoc/transform@4.2.1 ([#151](https://github.com/yandex-cloud/yfm-editor/issues/151)) ([b6c0c73](https://github.com/yandex-cloud/yfm-editor/commit/b6c0c73b5747a1f1424bb172d14bd510579a61d3))

## [6.7.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.6.0...v6.7.0) (2023-10-31)


### Features

* **Breaks:** parse &lt;br/&gt; to preffered break ([#147](https://github.com/yandex-cloud/yfm-editor/issues/147)) ([8253496](https://github.com/yandex-cloud/yfm-editor/commit/82534968f743b37449ef38f411bc6cbfe054a692))
* **Breaks:** replace double breaks with new paragraph ([#149](https://github.com/yandex-cloud/yfm-editor/issues/149)) ([2189de1](https://github.com/yandex-cloud/yfm-editor/commit/2189de1579be45656a1237663f08f86254746a21))


### Bug Fixes

* **toolbar:** correct calc of actions to show in presence of hiddenActions ([#150](https://github.com/yandex-cloud/yfm-editor/issues/150)) ([f91113d](https://github.com/yandex-cloud/yfm-editor/commit/f91113dcc2a204109997b43c040eee412adbe829))

## [6.6.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.5.0...v6.6.0) (2023-10-27)


### Features

* add options for placeholders ([#141](https://github.com/yandex-cloud/yfm-editor/issues/141)) ([875d025](https://github.com/yandex-cloud/yfm-editor/commit/875d0256f23565c3f81714d29fff25ba23a7d950))

## [6.5.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.4.0...v6.5.0) (2023-10-26)


### Features

* ability to add hidden action to toolbar ([#144](https://github.com/yandex-cloud/yfm-editor/issues/144)) ([d100d9b](https://github.com/yandex-cloud/yfm-editor/commit/d100d9bd8ef95a350b3d169c4cd288c92f0a768e))

## [6.4.0](https://github.com/yandex-cloud/yfm-editor/compare/v6.3.0...v6.4.0) (2023-10-25)


### Features

* **CodeBlock:** add custom tab key press handling in the codeblock ([fb3284c](https://github.com/yandex-cloud/yfm-editor/commit/fb3284c45bb980b9b86be73caa3a0179fad78203))
* **CodeBlock:** do not select codeblock node when clicking on it ([67bad99](https://github.com/yandex-cloud/yfm-editor/commit/67bad99b18e6216e6e066810dc6700fc9d9f5a0c))

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
