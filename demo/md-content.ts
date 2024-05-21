export const initialMdContent = `
# Это заголовок  {#якорь}

{% cut "Заголовки" %}

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

{% endcut %}

{% cut "Это заголовок ката" %}

**А** *здесь* ~~его~~ ++крутой++ ^к^~о~^н^~т~^е^~н~^т^

![картинка](https://avatars.mds.yandex.net/i?id=38357cac15300bdd8c220a8a68ed2928-5297283-images-thumbs&n=13)

> Сделал дело - дело сделано \`(цитата)\`

{% endcut %}

{% cut "Формулы" %}

Это формула: $\\sqrt{3x-1}+(1+x)^2$

А это блочная формула:

$$
f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$

_Кликни в формулу, чтобы отредактировать её_

{% endcut %}

---

#|
||

Отличная

|

табличкА

|

а сюда вложили картинку и текст отформатировали

||
||

С

|

==полезной==

|

![картинка](https://avatars.mds.yandex.net/i?id=38357cac15300bdd8c220a8a68ed2928-5297283-images-thumbs&n=13 =260x)

||
||

информацией

|

!!!!!!!!!!!!!!!!!!!!!!!!

|

***~~++ТеКсТ ОтФоРмАтИрОвАн++~~***

||
|#

---

{% note info "Минуточку внимания!" %}

* спасибо

  1. за

  2. внимание

     1. вам

  3. от нас

* (списки вложенные)

> > > Цитаты
> >
> > Вложенные
>
> Тоже

А ещё ##monospace## можно **##ком##**##биниро*вать*##

{% endnote %}

---

## code_block example

\`\`\`js
(function(window) {
  window.alert('Hello world!');
})(window);
\`\`\`

---

## Это заголовок 2 уровня

[ссылка](https://ya.ru)

Colored text: {black}(black) {gray}(gray) {yellow}(yellow) {orange}(orange) {red}(red) {green}(green) {blue}(blue) {violet}(violet)

This *paragraph <span style="color: red;"> has* </span> inline html

<div style="color: green;">This text inside custom html.</div> This is text after custom html, but inside html_block too
<main>This is main</main>

<div>This is another html_block</div>

`.trim();
