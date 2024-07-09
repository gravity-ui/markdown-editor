import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

export default {
    title: 'Markdown Editor / YFM examples',
} as Meta;

const markup = {
    textMarks: `
## YFM text marks

##Monospaced text##
`.trim(),

    yfmNotes: `
## YFM Notes

{% note info %}

This is info.

{% endnote %}

{% note tip %}

This is a tip.

{% endnote %}

{% note warning %}

This is a warning.

{% endnote %}

{% note alert %}

This is an alert.

{% endnote %}


`.trim(),

    yfmCut: `
## YFM Cut

{% cut "Cut header" %}

Content displayed when clicked.

{% endcut %}
`.trim(),

    yfmTabs: `
## YFM Tabs

{% list tabs %}

- The name of tab1

  The text of tab1.

  * You can use lists.
  * And **other** markup.

- The name of tab2

  The text of tab2.

{% endlist %}
`.trim(),

    yfmHtml: `
Обычный текст

## Далее идет YFM HTML

::: html

<h1>Туристический санитарный и ветеринарный контроль в XXI веке</h1>
<p>Как следует из рассмотренного выше частного случая, наводнение известно. На завтрак англичане предпочитают овсяную кашу и кукурузные хлопья, тем не менее начальное условие движения совершает интеграл от переменной величины. Бамбук, при том, что королевские полномочия находятся в руках исполнительной власти - кабинета министров, однородно переворачивает вулканизм. Независимое государство, особенно в верхах разреза, совершает пегматитовый кварцит.</p>
<p>Большая часть территории участвует в погрешности определения курса меньше, чем силл. Штопор вразнобой поступает в цокольный музей под открытым небом, что имеет простой и очевидный физический смысл. Маховик, согласно третьему закону Ньютона, локально слагает распространенный систематический уход, а к мясу подают подливку, запеченные овощи и пикули.</p>
<p>Комбинированный тур смещает подземный сток. Деградация мерзлоты горизонтально просветляет четвертичный крен. Побережье, с учетом региональных факторов, вразнобой смещает объект. Угол крена точно переворачивает пингвин.</p>

:::

Снова обычный текст

## Далее идет YFM HTML

::: html

<style>
/***************/
/*** cat ***/
/***************/
/*-- CAT - расхлоп --*/
.rashlop { display:block; }
.wiki-cut { margin: 0; }
.wiki-cut__summary { color: inherit; }

/*-- CAT - стрелка --*/
.arrow { vertical-align: middle; width:16px; }

/*-- CAT - стрелка на кнопке вниз-- */
.woof-icon_type_awesome-angle-down { height: 32px; width: 16px; }
/*-- CAT - стрелка на кнопке вверх--*/
.woof-icon_type_awesome-angle-up { height:32px; width:16px; }

/*-- CAT - текст на кнопке --*/
.summary_title { opacity:0.70; font-size: 20px; font-weight: 700;
line-height: 120%; padding:24px 0 }

/*-- CAT - дизайн кнопки--*/
.summary { padding:0; box-sizing: border-box; border-bottom: 1px solid rgba(152, 163, 174, 0.48); margin-bottom:0 }

/*-- CAT - текст внутри блока --*/
.summary_text { opacity:0.7; font-size:18px; line-height:140%; padding-top:14px; border-bottom: 1px solid rgba(152, 163, 174, 0.48); padding-bottom:24px; }
/***************/
/*** cat ***/
/***************/


/*****************/
/***  шапка    ***/
/*****************/
.header {
background: url(https://jing.yandex-team.ru/files/novagara/dogovor_header.png) 100% 100%/cover no-repeat #F4F5F6;
border-radius: 16px;
font-size: 40px;
line-height: 40px;
padding:16px;
box-sizing: border-box;
color: #363E45;
height:335px;
}
.fon_gray {
background: #F4F5F6;
border-radius: 16px;
font-size: 16px;
line-height: 140%;
padding: 16px;
box-sizing: border-box;
}
.text_header { font-size:16px; line-height:120%; font-weight:500; }
.text_width { max-width:880px; }

.f_24 { font-size:24px; font-weight:700; line-height:120%; opacity:0.7; }
.f_18 { font-size:18px; line-height:140%; opacity:0.7; }
.title_header_18 { color:#000; font-size:18px; line-height:140%; opacity:0.7; }
.a_color { color:#000; opacity:0.64; font-size:16px; line-height:140%; text-decoration-line:underline; }
.a_bottom { padding-bottom:10px; }
/*****************/
/***   шапка   ***/
/*****************/

.fon_blue { border-radius:16px; background:#E2EFFC; padding:16px; color:#363E45 }

.space {padding-bottom:6px }
.space_2 {padding-bottom:32px }
ul { list-style:disc; margin:0 0 0 20px }

.a_link_blue { color:rgba(53, 143, 233, 0.90); font-size:18px; line-height:140%; text-decoration:underline; }
.a_link_black { color:rgba(0, 0, 0, 0.70); text-decoration:underline; }

/*****************/
/***  шрифты   ***/
/*****************/
.f_table_title { color:#363E45; font-size:20px; font-weight:700; line-height:140%; padding-bottom:16px; }
.f_table_text_16 { color: rgba(54, 62, 69, 0.64); font-size: 16px; line-height: 140%; }
.f_table_text_18 { color: rgba(54, 62, 69, 0.64); font-size: 18px; line-height: 140%; }
.f_16 { opacity:0.7; font-size:16px; line-height:normal; }

.opacity_70 { opacity:0.7 }
/*****************/
/***  шрифты   ***/
/*****************/

.button_yellow { border-radius: 10px;
background: #FD3; color:#363E45; text-align:center; font-size:16px; font-style:normal; font-weight:700; line-height:48px; width:215px; height:48px}

</style>


<!----------------->
<!--   шапка    --->
<!----------------->
<table width="100%">
<tr>
<td width="74%" class="header">
<div style="width:720px">

**Заключение договора ГПХ с&nbsp;физическими лицами**

<div style="padding-bottom:185px"></div>

<div class="text_header" style="width:520px">
На&nbsp;данной странице вы&nbsp;найдете описание процесса согласования и&nbsp;заключения договоров возмездного оказания услуг.
</div>

</div>
</td>
<td width="1%" style="padding-left:6px"></td>
<td width="25%" class="fon_gray opacity_70 " style="min-width:300px">

<div class="title_header_18 ">

**Оглавление**
</div>

<div style="padding-bottom:16px"></div>

<div class="a_bottom ">
<a class="a_color" href="#pochemuvazhnoprojjtijetotprocess">Почему важно пройти этот процесс?</a></div>

<div class="a_bottom ">
<a class="a_color"  href="#chtobyzakljuchitdogovorgpxnuzhno">Чтобы заключить договор ГПХ, нужно</a></div>

<div class="a_bottom ">
<a class="a_color" href="#srednijjsrokorganizaciiprocessa">Средний срок организации процесса</a></div>

<div class="a_bottom ">
<a class="a_color"
href="#izmenenijapodogovoramgpxs2023goda">Изменения по договорам ГПХ с 2023 года</a></div>

</td></tr></table>
<!----------------->
<!--  /шапка    --->
<!----------------->

<div style="padding-top:66px"></div>

<div class="f_24 text_width">На&nbsp;данной странице вы&nbsp;найдете описание процесса согласования
и&nbsp;заключения договоров возмездного оказания услуг (далее&nbsp;&mdash; &laquo;ГПХ договоры&raquo;) с&nbsp;физическими лицами. Процесс применим также
к&nbsp;физическим лицам, обладающим статусом самозанятых.</div>

<div style="padding-bottom:24px"></div>

<div class="f_18 text_width">Договоры возмездного оказания услуг&nbsp;&mdash; это договоры, по&nbsp;которым Яндекс, как заказчик, заказывает определенные услуги (наименование, количество, стоимость и&nbsp;результат которых описан в&nbsp;договоре), исполнитель по&nbsp;договору оказывает такие услуги с&nbsp;учетом описанных критериев, передает результат Яндексу по&nbsp;Акту приема-передачи и&nbsp;получает вознаграждение. Примеры заказываемых услуг: консультации, иллюстрации, дизайн-проект, организация мероприятий, тренинги, семинары и&nbsp;т.д.

<div class="space"></div>
При намерении заключить ГПХ договор с&nbsp;физическим лицом (независимо от&nbsp;того, обладает&nbsp;ли статусом самозанятого или нет), необходимо проверить, действительно&nbsp;ли такой договор подразумевает оказание услуг, а&nbsp;не&nbsp;выполнение трудовой функции.</div>


<!------------------------>
<!--   Почему важно... --->
<!------------------------>
<div style="padding-top:64px; padding-bottom:32px">

=== <span style="font-size:32px; font-weight:700; line-height:120%;">Почему важно пройти этот процесс?</span>

</div>

<table width="100%" >
<tr>
<td width="73%" class="f_18">

Заключение ГПХ договоров, которые фактически прикрывают трудовые отношения, запрещено. Такой запрет содержится в&nbsp;ст.&nbsp;15&nbsp;Трудового кодекса РФ: &laquo;Заключение гражданско-правовых договоров, фактически регулирующих трудовые отношения между работником и&nbsp;работодателем, не&nbsp;допускается&raquo;.

<div class="space"></div>
И&nbsp;за&nbsp;нарушение такого запрета предусмотрена ответственность в&nbsp;Кодексе об&nbsp;административных правонарушениях&nbsp;РФ (ч.&nbsp;4&nbsp;и&nbsp;ч.&nbsp;5):

<div class="space"></div>
<ul>
<li>
за&nbsp;первый случай: на&nbsp;должностное лицо (Генеральный директор) накладывается административный штраф в&nbsp;размере от&nbsp;десяти тысяч до&nbsp;двадцати тысяч рублей; на&nbsp;юридическое лицо&nbsp;&mdash; от&nbsp;пятидесяти тысяч до&nbsp;ста тысяч рублей;</li>
<li>за&nbsp;повторное привлечение: в&nbsp;отношении должностного лица (Генеральный директор) применяется дисквалификация (запрет находиться на&nbsp;руководящих должностях) на&nbsp;срок от&nbsp;одного года до&nbsp;трех лет; на&nbsp;юридическое лицо накладывается административный штраф от&nbsp;ста тысяч до&nbsp;двухсот тысяч рублей.</li>
</ul>

<div style="padding-bottom:32px"></div>
<div class="f_24">А&nbsp;что с&nbsp;самозанятыми?</div>

<div class="space"></div>
Статус самозанятого означает специальный налоговый режим, который определяет размер уплачиваемого физическим лицом налога. Наличие статуса самозанятого никак не&nbsp;снижает риски прикрытия трудовых отношений. Поэтому при решении вопроса о&nbsp;заключении ГПХ договора с&nbsp;самозанятым, также важно удостовериться, что прикрытие трудовых отношений отсутствует.



</td>
<td width="2%" style="padding-left:6px"></td>
<td width="25%">

<div class="fon_blue">
<div class="f_table_title">Как отличить договор ГПХ от трудового договора?</div>

<div class="f_table_text_18 ">Подробное описание критериев отличия читай тут на <a target="_blank" style="color: rgba(53, 143, 233, 0.90); text-decoration-line: underline;" href="https://wiki.yandex-team.ru/hr/oformlenie-na-dogovor-gpx/trudovojj-dogovor-protiv-gpx/">Вики</div>
</div>

</td></tr></table>
<!------------------------>
<!--  /Почему важно... --->
<!------------------------>


<!------------------------->
<!--  Чтобы заключить... -->
<!------------------------->
<div style="padding-top:56px; padding-bottom:24px">

=== <span style="font-size:32px; font-weight:700; line-height:120%;">Чтобы заключить договор ГПХ, нужно:</span>

</div>



<!------------>
<!--  Cat-1 -->
<!------------>
<details class="rashlop wiki-cut">
<summary class="summary wiki-cut__summary">
<table width="100%" height="100%">
<tr>
<td class="summary_title">
1. Получить согласование в тикете в очереди CONTRACTCHECK

</td><td class="arrow"><div class="woof-icon_type_awesome-angle-up"></div><div class="woof-icon_type_awesome-angle-down"></div></td></tr>
</table></summary>
<div class="summary_text">
Для этого заполни <a class="a_link_blue" href="https://forms.yandex-team.ru/surveys/143932/">формочку</a>.

**Важно:** обязательно заполнять форму честно, а&nbsp;не&nbsp;стараться заполнить &laquo;правильно&raquo; только для того, чтобы получить &laquo;одобрено&raquo; для заключения ГПХ!Любая такая попытка влечет риски привлечения к&nbsp;ответственности и&nbsp;юридического лица, с&nbsp;которым заключается такой ГПХ и&nbsp;Генерального директора лично!

</div></details>
<!------------>
<!-- /Cat-1 -->
<!------------>

<!------------>
<!--  Cat-2 -->
<!------------>
<details class="rashlop wiki-cut">
<summary class="summary wiki-cut__summary">
<table width="100%" height="100%">
<tr>
<td class="summary_title">
2. При получении согласованного тикета следуй шагам из п. 3 ниже

</td><td class="arrow"><div class="woof-icon_type_awesome-angle-up"></div><div class="woof-icon_type_awesome-angle-down"></div></td></tr>
</table></summary>
<div class="summary_text">

2.1. При получении согласованного тикета следуй шагам из п. 3 ниже.
2.2. При получении отказа в тикете, заключать ГПХ договор нельзя. Следуй обозначенным в тикете указаниям: вам будут предложены альтернативные варианты.

</div></details>
<!------------>
<!-- /Cat-2 -->
<!------------>

<!------------>
<!--  Cat-3 -->
<!------------>
<details class="rashlop wiki-cut">
<summary class="summary wiki-cut__summary">
<table width="100%" height="100%">
<tr>
<td class="summary_title">
3. После получения согласования в тикете CONTRACTCHECK вам нужно:

</td><td class="arrow"><div class="woof-icon_type_awesome-angle-up"></div><div class="woof-icon_type_awesome-angle-down"></div></td></tr>
</table></summary>
<div class="summary_text">

1. Убедиться, что затраты на этот договор согласованы с держателем бюджета. Если есть вопросы по бюджету, пожалуйста, обратись к вашему бюджетному контролеру. Контакты бюджетных контролёров всех направлений Яндекса можно найти → <a style="color:inherit; text-decoration:underline;" href="https://wiki.yandex-team.ru/finances/fpahq/contact-list-fpa---gaap---hr/">здесь</a>, аналитики для расходов Маркета подскажет <a style="color:inherit; text-decoration:underline;" href="https://wiki.yandex-team.ru/gruppa-bjudzhetnogo-kontrolja-marketa/">группа финансового контроля Маркета</a>.
2. Подготовить текст ГПХ договора, воспользовавшись следующими шаблонами:

<ul style="margin-left:35px">
<li><a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/legal/templates/servicerussia/">https://wiki.yandex-team.ru/legal/templates/servicerussia/ </a>(или <a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/gruppa-bjudzhetnogo-kontrolja-marketa/">https://wiki.yandex-team.ru/legal/businessandintracorporate/services/mezhdunarodnye-pochti-ljubye-uslugi-i-raboty/</a> для исполнителей нерезидентов РФ).</li>

<li><a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/legal/templates/outsourcing/">https://wiki.yandex-team.ru/legal/templates/outsourcing/</a> (что такое РИД и каковы особенности можно прочитать тут <a style="color:inherit; text-decoration:underline;" href="https://wiki.yandex-team.ru/legal/ip-faq/">https://wiki.yandex-team.ru/legal/ip-faq/</a>).</li>

</ul>
<div style="padding-bottom:24px"></div>
Проверить у себя наличие роли <a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/service-of-contract-support/create-a-task/">Я.Инициатор</a> и создайте заявку в делопроизводство на согласование заказа на приобретение (ЗП) в OEBS (он же Oracle или Оракл) (<a target="_blank" class="a_link_blue" href="https://forms.yandex-team.ru/surveys/1888/">Яндекс</a>, <a target="_blank" class="a_link_blue" href="https://forms.yandex-team.ru/surveys/15467/">Такси</a>, <a target="_blank" class="a_link_blue" href="https://st.yandex-team.ru/createTicket?queue=DOCSDC&_form=89807">Беспилотные Технологии</a> или <a target="_blank" class="a_link_blue" href="https://wto.oebs.yandex-team.ru/iproc/standard">Я.Покупка</a> — для всех компаний).;
Подробнее читай тут про <a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/service-of-contract-support/">Яндекс</a> и <a target="_blank" class="a_link_blue" href="https://wiki.yandex-team.ru/BSS-ru/">Такси.</a>

Согласованный тикет CONTRACTCHECK обязательно связать с заявкой в делопроизводство на согласование заказа на приобретение (ЗП).

</div></details>
<!------------>
<!-- /Cat-3 -->
<!------------>

<!------------------------->
<!-- /Чтобы заключить... -->
<!------------------------->


<!------------------------->
<!--   Средний срок...   -->
<!------------------------->
<div style="padding-top:44px; padding-bottom:24px">


=== <span style="font-size:32px; font-weight:700; line-height:120%;">Средний срок организации процесса</span>

</div>

<table width="100%">
<tr>
<td width="49%">

<div class="fon_blue">
<div class="f_table_title">CONTRACTCHECK</div>

<div class="f_table_text_18 ">
<ul>
<li>«Согласовано» — день в день</li>
<li>«Отказ» — день в день</li>
</ul>
</div>
</div>

</td>
<td width="2%" style="padding-left:6px"></td>
<td width="49%">

<div class="fon_blue">
<div class="f_table_title">SCS (делопроизводство)</div>

<div class="f_table_text_18">
<ul>
<li>Существующий поставщик — неделя</li>
<li>Новый поставщик — две недели</li>
</ul>
</div>
</div>

</td></tr></table>

<div class="f_16" style="padding-top:24px; padding-bottom:29px; max-width:830px">

**Важно:** тикет SCS на утверждение ГПХ договора коллеги из Службы сопровождения сделок возьмут в работу только при наличии положительной резолюции в тикете CONTRACTCHECK (получение статуса «Одобрен»).
</div>

<div style="max-width:980px">

<div class="f_24 space">А&nbsp;как быть с&nbsp;продлением уже существующего ГПХ договора?</div>

<div class="f_18 space_2">Для продления уже заключенного ГПХ договора, вам необходимо пройти ту&nbsp;же процедуру, что и&nbsp;в&nbsp;пп. 1-3, т.к. важно убедиться, что за&nbsp;время сотрудничества отношения с&nbsp;контрагентом не&nbsp;приобрели признаки трудовых. Важно заново заполнить форму и&nbsp;обязательно связать новый тикет с&nbsp;тем тикетом из&nbsp;очереди CONTRACTCHECK, где ранее было получено одобрение на&nbsp;заключение договора ГПХ.
</div>

<div class="f_24 space">Не&nbsp;требуют согласования в&nbsp;тикете CONTRACTCHECK:</div>
<ul class="f_18 space_2">
<li>Договор с&nbsp;иностранным&nbsp;ЮЛ группы</li>
<li>Программа рекомендаций</li>
<li>Премия Алисы</li>
<li>Премия Сегаловича</li>
</ul>

<div class="f_24 space">Лицензионный договор</div>

<div class="f_18 space_2">Нужен предварительный&nbsp;ОК на&nbsp;его заключение в&nbsp;тикете LEGAL.</div>

<div class="f_24 space">Договоры типа РИД</div>

<div class="f_18 space_2">Если смысл заключения ГПХ договора в&nbsp;создании результатов интеллектуальной деятельности (РИД&nbsp;&mdash; программ, дизайна, текстов, видео, фото и&nbsp;т.п.), можно воспользоваться <a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://wiki.yandex-team.ru/legal/templates/outsourcing/">договором о&nbsp;создании РИД</a>.
<div class="space"></div>
Это договоры не&nbsp;подходят для обычных услуг (например, консультационных, маркетинговых, поддержки сервисов и&nbsp;т.д.) и&nbsp;их&nbsp;нельзя использовать для иных целей, кроме создания РИД.</div>

<div class="f_24 space">Лекторские договоры</div>

<div class="f_18">Можно воспользоваться <a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://wiki.yandex-team.ru/legal/businessandintracorporate/services/legal/businessandintracorporate/services/lektorskie-uslugi/">шаблоном</a></div>

</div>
<!------------------------->
<!--  /Средний срок...   -->
<!------------------------->

<!-------------------------------->
<!--  Изменения по договорам... -->
<!-------------------------------->
<div style="padding-top:64px; padding-bottom:16px">

=== <span style="font-size:32px; font-weight:700; line-height:120%;">Изменения по договорам ГПХ с 2023 года</span>

</div>

<div class="f_table_title" style="padding-bottom:24px; color:inherit; opacity:0.7">
Изменения касаются только ГПХ с физическими лицами и НЕ касаются ГПХ с самозанятыми
</div>


<table width="100%">
<tr>
<td width="32.5%" class="fon_gray f_table_title">

C 1 января 2023 года произошли изменения в учете договоров ГПХ

</td>
<td width="1.25%" style="padding-left:6px"></td>
<td width="32.5%" class="fon_gray">

<div class="f_table_title" style="padding-bottom:11px">Было:</div>

<div class="f_table_text_16">
предоставление отчетности о договорах ГПХ в СФР (Социальный фонд России) в конце каждого месяца.
</div>

</td>
<td width="1.25%" style="padding-left:6px"></td>
<td width="32.5%" class="fon_gray">

<div class="f_table_title" style="padding-bottom:11px">
Стало:
</div>

<div class="f_table_text_16">
предоставление отчетности о договорах ГПХ в СФР ежедневно.
</div>

</td></tr></table>

<div style="padding-top:29px; max-width:980px">
<div class="f_24">Вместе с этим появляются риски штрафных санкций за несвоевременное предоставление данных, а именно:</div>

<ul class="f_18 space_2" style="padding-top:10px;"><li>за несвоевременную передачу данных штраф 500 рублей за каждое событие, штраф накладывается на должностное лицо – генерального директора;</li>
<li>за регулярное нарушение сроков сдачи отчетности – проверка ГИТ (Государственная инспекция труда) по всей компании.</li>
</ul>

</div>

<div class="fon_gray f_table_title">
<table width="100%">
<tr>
<td style="vertical-align: middle; max-width:980px">

Просим учесть данную информацию и&nbsp;своевременно отражать информацию по&nbsp;договорам ГПХ

</td>
<td style="vertical-align: middle;">

<a target="_blank" href="https://st.yandex-team.ru/PRJ-780">
<div class="button_yellow">
Проектный тикет
</div></a>

</td></tr></table>
</div>

<div class="space_2"></div>

<div style="max-width:980px">

<div class="f_24 space">Изменения по&nbsp;новым заключаемым договорам ГПХ:</div>

<ul class="f_18 space_2"><li>«Дата подписания (заключения) договора» по&nbsp;процессу теперь не&nbsp;может быть в&nbsp;прошлом; в&nbsp;связи с&nbsp;этим просьба использовать для новых сделок новые шаблоны договоров, а&nbsp;не&nbsp;переиспользовать старые.</li>

<li>«Дата подписания (заключения) договора должна быть всегда РАНЬШЕ или РАВНА, чем «Дата действия договора по»</li>

<li>Яндекс будет подписывать договор только после физ. лица;</li>

<li>Счета-оферты запрещаются к&nbsp;использованию с&nbsp;физ. лицами ГПХ;</li>

<li>При формировании договора ГПХ появились новые обязательные поля&nbsp;&mdash; подробности ниже.</li>
</ul>


<div class="f_24 space">Изменения по&nbsp;новым доп. соглашениям ГПХ:</div>

<div class="f_18 space_2">
Заключение ДС&nbsp;на&nbsp;пролонгацию или расторжение основного договора ГПХ должно начинаться не&nbsp;позднее чем за&nbsp;10&nbsp;дней до&nbsp;даты окончания основного договора (&laquo;Дата действия&nbsp;по&raquo;).
<div class="space"></div>
<ul><li>ДС&nbsp;о&nbsp;пролонгации должен быть согласован, подписан и&nbsp;утвержден до&nbsp;окончания срока действия основного договора.</li>

<li>В&nbsp;случае, если&nbsp;ДС о&nbsp;пролонгации не&nbsp;был подписан вовремя&nbsp;&mdash; заключается новый договор.</li>

<li>В&nbsp;случае, если&nbsp;ДС о&nbsp;расторжении не&nbsp;был подписан вовремя&nbsp;&mdash; ДС&nbsp;будет подписан текущей датой.</li>
</ul>
</div>

<div class="f_24 space">
*Началом отражения информации по&nbsp;договору ГПХ считается день формирования тикета SCS, который может быть сформирован одним из&nbsp;следующих способов:</div>
<div class="f_18 space_2" style="margin-left:-15px">

1. <a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://iproc.mba.yandex-team.ru/standard">Формирование договора через Я.Покупку (WTO)</a>. При формировании&nbsp;ДС на&nbsp;пролонгацию или расторжение, необходимо выбирать соответствующий тип доп. соглашения.
2. Формирование договора в&nbsp;конструкторе (CDOC)
3. Отправка заявки в&nbsp;Делопроизводство (<a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://forms.yandex-team.ru/surveys/1888/">Яндекс</a>/<a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://forms.yandex-team.ru/surveys/15467/">Такси</a>/<a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://st.yandex-team.ru/createTicket?queue=DOCSDC&_form=54256">Беспилотные Технологии</a>)

</div>

<div class="f_24 space">
Также хотим проинформировать о&nbsp;появлении двух обязательных для заполнения полей при формировании договора ГПХ:</div>

<div class="f_18" style="margin-left:-15px">

1. &laquo;Вид (тип) договора ГПХ&raquo;&nbsp;&mdash; ниже схема-подсказка по&nbsp;выбору корректного значения из&nbsp;справочника <a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://wiki.yandex-team.ru/users/pavlova15/contract-codes/">Подробное описание схемы</a>. При возникновении трудностей с&nbsp;выбором, можно обратиться к&nbsp;юристам через через тикет в&nbsp;LEGAL&nbsp;/ LEGALTAXI&nbsp;/ LEGALMARKET&nbsp;/ LEGALFINTECH.
2. &laquo;Код выполняемой функции по&nbsp;ОКЗ&raquo;&nbsp;&mdash; заполняется на&nbsp;основании вида деятельности, который оказывает сотрудник ГПХ (примеры популярных кодов: 2431.1 специалисты по&nbsp;рекламе и&nbsp;маркетингу, 2522.4 системные администраторы, 2513.5 Разработчики Web и&nbsp;мультимедийных приложений и&nbsp;др.). Все коды можно <a target="_blank" style="color:rgba(53, 143, 233, 0.90); text-decoration:underline;" href="https://normativ.kontur.ru/document?moduleId=1&documentId=393365">почитать здесь</a> или выбрать по&nbsp;ключевым словам на&nbsp;форме создания тикета в&nbsp;очередь делопроизводителей.

</div>
<!-------------------------------->
<!--  Изменения по договорам... -->
<!-------------------------------->
<div style="padding-bottom:60px"></div>

<style type="text/css">
.title {
    font-family: YS Text;
    font-size: 24px;
    font-weight: 700;
    line-height: 29px;
    text-align: left;
    margin-bottom: 30px;
}
table {
    width: 100%;
    height: 1px;
    border-collapse: separate;
    border-spacing: 0;
}
.green table, .grey table {
    height: 100%;
}
.green {
    width: 23.5%;
    background-color: #00B377;
    background-repeat: no-repeat;
    background-size: 27px auto;
    background-position: 97% 87%;
    border-radius: 16px;
    padding-bottom: 12px;
}
.grey {
    width: 23.5%;
    background-color: #F4F5F6;
    background-repeat: no-repeat;
    background-size: 27px auto;
    background-position: 97% 87%;
    border-radius: 16px;
    padding-bottom: 12px;
}
.green-title {
    color: #FFF;
    font-size: 18px;
    font-family: YS Text;
    font-weight: 700;
    line-height: 120%;
    padding: 12px 12px 36px 12px;
}
.grey-title {
    color: #363E45;
    font-size: 18px;
    font-family: YS Text;
    font-weight: 700;
    line-height: 120%;
    padding: 12px 12px 36px 12px;
}
.green-text {
    color: #FFF;
    font-size: 14px;
    font-family: YS Text;
    width: 74%;
    margin: 0 0 0 12px;
}
.grey-text {
    color: rgba(54, 62, 69, 0.64);
    font-size: 14px;
    font-family: YS Text;
    width: 78%;
    margin: 0 0 0 12px;
}
.logo-ya {
    margin: 30px 0;
}
</style>

<style>
  .c-text {
    color: #363e45;
  }
    .mt24 {
    margin-top: 24px !important;
  }
    .h100p {
    height: 100% !important;
  }
    .mt32 {
    margin-top: 32px !important;
  }
    .mt16 {
    margin-top: 16px !important;
  }

  .h40 {
    height: 40px !important;
  }
  .w24px {
    width: 24px;
    max-width: 24px;
    min-width: 24px;
  }
    .bg-gray {
    background-color: #f4f5f6;
  }
    .c-text-64 {
    color: rgba(54, 62, 69, 0.64);
  }
    .w25 {
    width: 25%;
  }
    .pad16 {
    padding: 16px;
  }
    .radius16 {
    border-radius: 16px;
  }
    .inherit {
    color: inherit !important;
  }
    .underline-none {
    text-decoration: none !important;
  }
    .d-block {
    display: block !important;
  }
    .va-top {
    vertical-align: top;
  }
    .va-bottom {
    vertical-align: bottom;
  }
    .fleft {
    float: left;
  }
    .p2 {
    font-size: 16px;
    line-height: 22px;
    font-weight: 400;
  }
    .fright {
    float: right;
  }
    .h4 {
    font-size: 20px;
    line-height: 120%;
    font-weight: 700;
  }
  .w100 {
width: 100%;
}
  .h2 {
    font-size: 32px;
    line-height: 120%;
    font-weight: 700;
  }
</style>

  <h2 class="c-text mt24 h2">С любыми вопросами обращайтесь в Helpy</h2>
  <table cellspacing="0" cellpadding="0" class="h100p mt32">
    <tr>
      <td class="w25 pad16 radius16 bg-gray h100p">
        <a target="_blank" href="https://t.me/YandexHelpDeskbot" class="inherit underline-none d-block h100p">
          <table class="h100p w100">
            <tr>
              <td colspan="h100p">
                <table class="h100p">
                  <tr class="va-top">
                    <td >
                      <h4 class="c-text h4">Чат в тг</h4>
                    </td>
                  </tr>
                  <tr>
                    <td class="va-bottom">
                      <p class="fleft p2 mt16 c-text-64">@YandexHelpDeskbot</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="va-bottom">
                <img class="h40 fright"
                     src="https://jing.yandex-team.ru/files/irina-tsekh/tg-icon.png"
                     alt="">
              </td>
            </tr>
          </table>
        </a>
      </td>
      <td class="w24px"></td>
      <td class="w25 pad16 radius16 bg-gray h100p">
        <a target="_blank" href="mailto:helpy@yandex-team.ru" class="inherit underline-none d-block h100p">
          <table class="h100p w100">
            <tr >
              <td colspan="h100p">
                <table class="h80 h100p">
                  <tr class="va-top">
                    <td >
                      <h4 class="c-text h4">Почта</h4>
                    </td>
                  </tr>
                  <tr>
                    <td class="va-bottom">
                      <p class="c-text-64 p2 mt16">helpy@yandex-team.ru</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="va-bottom">
                <img class="h40 fright"
                     src="https://jing.yandex-team.ru/files/irina-tsekh/mail-icon.png"
                     alt="">
              </td>
            </tr>
          </table>
        </a>
      </td>
      <td class="w24px"></td>
      <td class="w25 pad16 radius16 bg-gray h100p">
        <a target="_blank" href="tel:88002509639" class="inherit underline-none d-block h100p">
          <table class="h100p w100">
            <tr >
              <td colspan="h100p">
                <table class="h80 h100p">
                  <tr class="va-top">
                    <td >
                      <h4 class="c-text h4">Телефон</h4>
                    </td>
                  </tr>
                  <tr>
                    <td class="va-bottom">
                      <p class="c-text-64 p2 mt16">8 (800) 250-96-39, доб. 444</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="va-bottom">
                <img class="h40 fright"
                     src="https://jing.yandex-team.ru/files/irina-tsekh/phone-icon.png"
                     alt="">
              </td>
            </tr>
          </table>
        </a>
      </td>
      <td class="w24px"></td>
      <td class="w25 pad16 radius16 bg-gray h100p">
        <a target="_blank" href="https://helpy.yandex-team.ru/" class="inherit underline-none d-block h100p">
          <table class="h100p w100">
            <tr >
              <td colspan="h100p">
                <table class="h80 h100p">
                  <tr class="va-top">
                    <td >
                      <h4 class="c-text h4">Портал</h4>
                    </td>
                  </tr>
                  <tr>
                    <td class="va-bottom">
                      <p class="c-text-64 p2 mt16">helpy.yandex-team.ru</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td class="va-bottom">
                <img class="h40 fright"
                     src="https://jing.yandex-team.ru/files/irina-tsekh/portal-icon.png"
                     alt="">
              </td>
            </tr>
          </table>
        </a>
      </td>
    </tr>
  </table>


<div class="logo-ya">
<img src="https://jing.yandex-team.ru/files/godofbloch/YaTeam%20%284%29-1.svg">
</div>

:::

`.trim(),

    yfmFile: `
## YFM File

File: {% file src="data:text/plain;base64,Cg==" name="empty.txt" %}
`.trim(),

    yfmTable: `
## YFM Table

### Simple table

#|
|| **Header1** | **Header2** ||
|| Text | Text ||
|#

### Multiline content

#|
||Text
on two lines
|
- Potatoes
- Carrot
- Onion
- Cucumber||
|#

### Nested tables

#|
|| 1
|

Text before other table

#|
|| 5
| 6||
|| 7
| 8||
|#

Text after other table||
|| 3
| 4||
|#
`.trim(),

    tasklist: `
## Task lists (additional feature)

- [x] ~~Write the press release~~
- [ ] Update the website
- [ ] Contact the media
`.trim(),

    latexFormulas: `
## LaTeX Formulas (optional feature)

Inline formula: $\\sqrt{3x-1}+(1+x)^2$

Block formula:

$$
f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$
`.trim(),

    mermaidDiagram: `
## Mermaid diagram (optional feature)

\`\`\`mermaid
sequenceDiagram
	Alice->>Bob: Hi Bob
	Bob->>Alice: Hi Alice
\`\`\`
`.trim(),
};

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
>;

const args: Partial<PlaygroundStoryProps> = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
};

export const TextMarks: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.textMarks} />
);

export const Tasklist: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.tasklist} />
);

export const YfmNote: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmNotes} />
);

export const YfmCut: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmCut} />
);

export const YfmTabs: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmTabs} />
);

export const YfmHtml: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmHtml} sanitizeHtml={false} />
);

export const YfmFile: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmFile} />
);

export const YfmTable: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmTable} />
);

export const LaTeXFormulas: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.latexFormulas} />
);

export const MermaidDiagram: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.mermaidDiagram} />
);

TextMarks.storyName = 'Text';
TextMarks.args = args;
YfmNote.storyName = 'YFM Note';
YfmNote.args = args;
YfmCut.storyName = 'YFM Cut';
YfmCut.args = args;
YfmTabs.storyName = 'YFM Tabs';
YfmTabs.args = args;
YfmHtml.storyName = 'YFM HTML';
YfmHtml.args = args;
YfmFile.storyName = 'YFM File';
YfmFile.args = args;
YfmTable.storyName = 'YFM Table';
YfmTable.args = args;
Tasklist.storyName = 'Task list';
Tasklist.args = args;
LaTeXFormulas.storyName = 'LaTeX Formulas';
LaTeXFormulas.args = args;
MermaidDiagram.storyName = 'Mermaid diagram';
MermaidDiagram.args = args;
