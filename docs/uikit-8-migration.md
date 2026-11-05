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

The current `@gravity-ui/page-constructor` 7 dependency and its UI components require UIkit 7. Its dependency `@gravity-ui/components` 4 imports `Popover` from `@gravity-ui/uikit/legacy`, where this component was removed in UIkit 8. The full visual suite stops at bundling before any tests run.

The Page Constructor extension cannot be released with this migration until its dependencies support UIkit 8. Installing a second UIkit also requires a separate theme provider and style isolation; changing peer ranges or skipping the affected tests does not establish compatibility.
