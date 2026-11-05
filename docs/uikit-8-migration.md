# UIkit 8 migration

The editor requires `@gravity-ui/uikit` 8, `@gravity-ui/components` 5, and React and React DOM 18 or 19. Update these dependencies together.

```sh
npm install @gravity-ui/uikit@^8 @gravity-ui/components@^5
```

For application setup, replace the former application-level `ThemeProvider` with `Provider` from `@gravity-ui/uikit`. `ThemeProvider` now configures only the theme and direction. See the [UIkit migration guide](https://github.com/gravity-ui/uikit/blob/main/docs/migration-to-v8.md).

The editor installs the dependencies required by the UIkit legacy entry point and the code language selector's virtualizer. Existing menus and suggestion lists retain their APIs through the legacy entry point. Custom CSS targeting them must use `g-menu-legacy`, `g-dropdown-menu-legacy`, and `g-list-legacy` instead of their previous class names.

## Page Constructor integration

The current `@gravity-ui/page-constructor` 7 dependency and its UI components require UIkit 7. The Page Constructor extension and demo cannot be released with this migration until those dependencies support UIkit 8. Do not bypass their peer dependency requirements.
