## Date

An inline date: a day of the calendar in a gray pill inside the text, which looks like a label.

### Markup

```md
:date[2026-10-21]
```

The `date` text (inline) directive. The content in square brackets is a day in the ISO 8601
`YYYY-MM-DD` format, without time and time zone. The day is written back unchanged.

A directive with any other content is not a date and stays plain text, so the source is not lost:
`:date[2026-02-30]`, `:date[21.10.2026]`, `:date[2026-10-21T10:00]`. The editor does not replace
such a value with another day. Attributes of the directive are dropped on parsing.

### Node

The `date` node is inline and atomic, with the `date` attribute that holds the ISO day. The node
does not accept an invalid day. The editor and the preview render the DOM of the UIKit `Label` on
the `time` element:

```html
<time
  class="g-label g-label_theme_unknown g-label_size_xs g-md-date"
  data-qa="date"
  datetime="2026-10-21"
  ><span class="g-label__text"><span class="g-label__content">Oct 21, 2026</span></span></time
>
```

### Appearance

The date has the size, the rounding and the vertical alignment of the label and the `unknown`
theme of the UIKit `Label`, the same as the gray label. It follows the light and the dark themes.

The day is displayed in the short format of the editor language: `Oct 21, 2026` in English,
`21 окт. 2026 г.` in Russian. The day is formatted in UTC, so the time zone of the user does not
shift it.

### Editor

Selecting a date opens a popover with the `Calendar` of `@gravity-ui/date-components` on the
stored day. Choosing a day updates the same date, closes the popover and puts the cursor after the
date.

- A click on a date and the insertion of a new one open the popover and move the focus to the
  calendar.
- A date selected by the keyboard opens the popover and keeps the focus in the editor. `Enter`
  moves the focus to the calendar.
- `Escape` or a click outside the popover closes it. `Escape` in the popover puts the cursor after
  the date.

The `addDate` action inserts the current day in the local time zone of the user and opens the
calendar to choose another day.

`ArrowLeft` and `ArrowRight` step through three positions around a date: the edge before it, the
date itself, the edge after it. At both edges the editor draws the fake cursor of the Code
extension, and typed text goes outside the date.

The calendar takes the names of months and weekdays from the global locale of
`@gravity-ui/date-utils`. When the popover opens, the extension loads the locale of the editor
language and sets it as the global one.

### Limitations

- A directive with an invalid day stays plain text. After a switch to the WYSIWYG mode and back,
  its syntax characters are escaped: `\:date\[2026-02-30\]`.
- The extension is part of the `full` preset; the toolbar button inserts a date in the WYSIWYG
  mode, in the markup mode the directive is written by hand.
