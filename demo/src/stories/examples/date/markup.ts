export const markup = `
## Date

Release date: :date[2026-10-21] is a text directive inside the line.

The leap day :date[2028-02-29] and the last day of a year :date[2026-12-31].

Next to a label: :label[Planned]{color=blue} :date[2027-01-15]

A day that does not exist stays plain text: :date[2026-02-30]

> Inside a quote: :date[2026-11-01]

{% cut "Inside a cut" %}

:date[2027-03-08]

{% endcut %}
`.trim();
