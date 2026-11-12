# UIkit 8 migration

The editor requires `@gravity-ui/uikit` 8, `@gravity-ui/components` 5, and React and React DOM 18 or 19. Update these dependencies together. UIkit 7, components 4, and React 16/17 are no longer supported.

```sh
npm install @gravity-ui/uikit@^8 @gravity-ui/components@^5
```

The updated extension packages require editor 16. Their previous peer range, `^15.38.1`, excludes this major. Keep the previous extension releases when using editor 15.

## Integration changes

- Replace the application-level `ThemeProvider` with `Provider` from `@gravity-ui/uikit` when configuring language, layout, mobile settings, or component defaults. `ThemeProvider` now configures only the theme and direction.
- Replace the UIkit option types `SelectOption` and `SelectOptionGroup` with `SelectOptionProps` and `SelectOptionGroupProps`. The deprecated editor tooltip selector and toolbar select types now reference these new types.
- Supply option labels through `content` or `getOptionText`. The removed `text` option field no longer supplies a label.
- Update custom CSS for editor menus and suggestion lists to `g-menu-legacy`, `g-dropdown-menu-legacy`, and `g-list-legacy`. The former class names no longer match these components.
- Recheck snapshots around tabs, selects, popups, checkboxes, and search/settings panels. UIkit 8 changes component geometry, spacing, and theme tokens.

The editor installs the dependencies required by the UIkit legacy entry point and the code language selector's virtualizer. Existing menus and suggestion lists retain their APIs through the legacy entry point.

See the [UIkit migration guide](https://github.com/gravity-ui/uikit/blob/main/docs/migration-to-v8.md) for application-level migration details.

## Page Constructor integration

Page Constructor support is retained with Page Constructor 9 and the Diplodoc Page Constructor extension 0.14. These compatible releases must be published before the dependency locks can be refreshed for this migration.

The Page Constructor extension requires Node.js 24 or later. Its previous Diplodoc dependency supported Node.js 18; Node.js 18 through 23 are no longer supported for this integration.

Update the dependencies together with UIKit 8. Previous Page Constructor releases require UIKit 7 and components 4, which imports the removed legacy Popover. Existing page content, contrast button themes, WYSIWYG editing, and split preview remain supported.
