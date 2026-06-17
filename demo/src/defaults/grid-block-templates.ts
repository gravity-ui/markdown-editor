import {
    parseTemplates,
    type GridBlockTemplate,
} from '@gravity-ui/markdown-editor/extensions/additional/GridBlockTemplates/templates/index.js';

import backgroundPlaceholderImage from './grid-block-background-placeholder.svg';
import placeholderImage from './grid-block-placeholder.svg';

const templateMarkup = `<template id="product-landing-page" title="Product landing" type="container" group="Product landing">
  <style>
    .grid {
      display: grid;
      gap: 24px;
      max-width: 1120px;
      margin: 0 auto;
      padding: 32px 16px;
    }
  </style>
  <div class="grid">
    <div class="block-1">
      <h1>Launch faster with a focused product page</h1>
      <p>Describe the offer, show proof, and give readers one obvious next step.</p>
      <a class="landing-action" href="#">Start now</a>
    </div>
    <div class="block-2">
      <article><strong>Fast setup</strong><span>Reusable layout and copy blocks.</span></article>
      <article><strong>Clear proof</strong><span>Metrics, outcomes, and quotes.</span></article>
      <article><strong>Simple CTA</strong><span>One direct conversion path.</span></article>
    </div>
  </div>
</template>

<template id="product-landing-hero" title="Hero" type="block" group="Product landing">
  <style>
    & {
      padding: 48px;
      border-radius: 24px;
      background: #101828;
      color: #ffffff;
    }

    h1 {
      max-width: 760px;
      margin: 0 0 16px;
      font-size: 56px;
      line-height: 110%;
    }

    p {
      max-width: 560px;
      margin: 0 0 28px;
      color: #d0d5dd;
      font-size: 20px;
      line-height: 140%;
    }

    .landing-action {
      display: inline-flex;
      padding: 12px 18px;
      border-radius: 10px;
      background: #ffbe5c;
      color: #101828;
      font-weight: 600;
      text-decoration: none;
    }
  </style>
  <h1>Launch faster with a focused product page</h1>
  <p>Describe the offer, show proof, and give readers one obvious next step.</p>
  <a class="landing-action" href="#">Start now</a>
</template>

<template id="product-landing-features" title="Feature cards" type="block" group="Product landing">
  <style>
    & {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    article {
      display: grid;
      gap: 10px;
      padding: 22px;
      border: 1px solid #e4e7ec;
      border-radius: 16px;
      background: #ffffff;
    }

    strong {
      color: #101828;
      font-size: 22px;
      line-height: 120%;
    }

    span {
      color: #667085;
      font-size: 16px;
      line-height: 140%;
    }
  </style>
  <article><strong>Fast setup</strong><span>Reusable layout and copy blocks.</span></article>
  <article><strong>Clear proof</strong><span>Metrics, outcomes, and quotes.</span></article>
  <article><strong>Simple CTA</strong><span>One direct conversion path.</span></article>
</template>

<template id="internal-kb-page" title="Knowledge base page" type="container" group="Internal knowledge base">
  <style>
    .grid {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 24px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 16px;
    }
  </style>
  <div class="grid">
    <div class="block-1">
      <strong>On this page</strong>
      <a href="#overview">Overview</a>
      <a href="#process">Process</a>
      <a href="#owners">Owners</a>
    </div>
    <div class="block-2">
      <h1>Team knowledge base</h1>
      <p>Use this page to collect status, instructions, owners, and related links.</p>
      <section id="overview"><h2>Overview</h2><p>Short context for readers.</p></section>
      <section id="process"><h2>Process</h2><p>Steps, agreements, and deadlines.</p></section>
    </div>
  </div>
</template>

<template id="internal-kb-sidebar" title="Sidebar nav" type="block" group="Internal knowledge base">
  <style>
    & {
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 18px;
      border-radius: 16px;
      background: #f4f7fb;
    }

    strong {
      color: #1f2937;
      font-size: 18px;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
  <strong>On this page</strong>
  <a href="#overview">Overview</a>
  <a href="#process">Process</a>
  <a href="#owners">Owners</a>
</template>

<template id="internal-kb-content" title="Content body" type="block" group="Internal knowledge base">
  <style>
    & {
      display: grid;
      gap: 18px;
      padding: 28px;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      background: #ffffff;
      color: #1f2937;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: 40px;
      line-height: 115%;
    }

    h2 {
      font-size: 24px;
      line-height: 125%;
    }

    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 150%;
    }
  </style>
  <h1>Team knowledge base</h1>
  <p>Use this page to collect status, instructions, owners, and related links.</p>
  <section id="overview"><h2>Overview</h2><p>Short context for readers.</p></section>
  <section id="process"><h2>Process</h2><p>Steps, agreements, and deadlines.</p></section>
</template>

<template id="benefits-yandex-hr-page" title="Benefits page" type="container" group="Yandex HR benefits">
  <style>
    .grid {
      display: grid;
      gap: 48px;
      width: min(100%, 1280px);
      margin: 0 auto;
      padding: 0 16px 45px;
      box-sizing: border-box;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    img {
      display: block;
    }
  </style>
  <div class="grid">
      <div class="block-1">
        <div class="benefits-hero__content">
          <div class="benefits-hero__title">Бенефиты</div>
          <div class="benefits-hero__text">
            Здесь всё про ДМС, массаж,<br>
            жилищную программу, скидки<br>
            и другие преимущества
          </div>
        </div>
      </div>
      <div class="block-2">
        <a class="benefits-banner benefits-banner_dms" href="https://wiki.yandex-team.ru/hr/kompensacii/straxovanie/" aria-label="ДМС"></a>
        <a class="benefits-banner benefits-banner_food" href="https://wiki.yandex-team.ru/hr/kompensacii/novaja-stranica-po-pitaniju01092020/" aria-label="Питание"></a>
        <a class="benefits-banner benefits-banner_sport" href="https://wiki.yandex-team.ru/hr/kompensacii/sport/" aria-label="Спорт"></a>
        <a class="benefits-banner benefits-banner_family" href="https://wiki.yandex-team.ru/hr/kompensacii/benefity-dlja-semejj-s-detmi/" aria-label="Семья"></a>
        <a class="benefits-banner benefits-banner_finance" href="https://wiki.yandex-team.ru/hr/kompensacii/fin/" aria-label="Финансы"></a>
        <a class="benefits-banner benefits-banner_discounts" href="https://wiki.yandex-team.ru/hr/kompensacii/skidkinew/" aria-label="Скидки"></a>
      </div>
      <div class="block-3">
        <a class="benefits-link" href="https://wiki.yandex-team.ru/HR/LgotyBelarus/" target="_blank">
          <span>Бенефиты в Беларуси</span>
          <img src="${placeholderImage}" alt="">
        </a>
        <a class="benefits-link" href="https://wiki.yandex-team.ru/hr/kompensacii/vseolgotaxdljahrbp/" target="_blank">
          <span>Вики для HR-партнеров</span>
          <img src="${placeholderImage}" alt="">
        </a>
      </div>
      <div class="block-4">
        <div class="benefits-contact-card">
          <img src="${placeholderImage}" alt="">
          <div class="benefits-contact-card__title">Чат в Мессенджере</div>
          <a class="benefits-contact-card__link" href="https://ya.cc/helpy">robot-helpy</a>
        </div>
        <div class="benefits-contact-card">
          <img src="${placeholderImage}" alt="">
          <div class="benefits-contact-card__title">Почта</div>
          <a class="benefits-contact-card__link" href="mailto:helpy@yandex-team.ru" target="_blank">helpy@yandex-team.ru</a>
        </div>
        <div class="benefits-contact-card">
          <img src="${placeholderImage}" alt="">
          <div class="benefits-contact-card__title">Телефон</div>
          <div class="benefits-contact-card__text">8 (800) 250-96-39, доб. 444</div>
        </div>
        <div class="benefits-contact-card">
          <img src="${placeholderImage}" alt="">
          <div class="benefits-contact-card__title">Портал</div>
          <a class="benefits-contact-card__link" href="https://helpy.yandex-team.ru/" target="_blank">helpy.yandex-team.ru</a>
        </div>
      </div>
      <div class="block-5">
        <img class="benefits-footer-logo" src="${placeholderImage}" alt="YaTeam">
      </div>
  </div>
</template>

<template id="benefits-yandex-hr-hero" title="Hero" type="block" group="Yandex HR benefits">
  <style>
    & {
      display: flex;
      min-height: 337px;
      padding: 24px;
      align-items: center;
      border-radius: 24px;
      background: url("${backgroundPlaceholderImage}") no-repeat center / contain;
      box-sizing: border-box;
    }

    .benefits-hero__title {
      margin-bottom: 5px;
      color: #222a3a;
      font-size: 64px;
      font-weight: 600;
      line-height: 110%;
    }

    .benefits-hero__text {
      color: #222a3a;
      font-size: 20px;
      font-weight: 400;
      line-height: 140%;
    }
  </style>
  <div class="benefits-hero__content">
      <div class="benefits-hero__title">Бенефиты</div>
      <div class="benefits-hero__text">
        Здесь всё про ДМС, массаж,<br>
        жилищную программу, скидки<br>
        и другие преимущества
      </div>
  </div>
</template>

<template id="benefits-yandex-hr-banners" title="Banner grid" type="block" group="Yandex HR benefits">
  <style>
    & {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .benefits-banner {
      display: block;
      height: 310px;
      background-position: center;
      background-repeat: no-repeat;
      background-size: contain;
      box-sizing: border-box;
    }

    .benefits-banner_dms {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_dms:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_food {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_food:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_sport {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_sport:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_family {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_family:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_finance {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_finance:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_discounts {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .benefits-banner_discounts:hover {
      background-image: url("${backgroundPlaceholderImage}");
    }
  </style>
  <a class="benefits-banner benefits-banner_dms" href="https://wiki.yandex-team.ru/hr/kompensacii/straxovanie/" aria-label="ДМС"></a>
    <a class="benefits-banner benefits-banner_food" href="https://wiki.yandex-team.ru/hr/kompensacii/novaja-stranica-po-pitaniju01092020/" aria-label="Питание"></a>
    <a class="benefits-banner benefits-banner_sport" href="https://wiki.yandex-team.ru/hr/kompensacii/sport/" aria-label="Спорт"></a>
    <a class="benefits-banner benefits-banner_family" href="https://wiki.yandex-team.ru/hr/kompensacii/benefity-dlja-semejj-s-detmi/" aria-label="Семья"></a>
    <a class="benefits-banner benefits-banner_finance" href="https://wiki.yandex-team.ru/hr/kompensacii/fin/" aria-label="Финансы"></a>
  <a class="benefits-banner benefits-banner_discounts" href="https://wiki.yandex-team.ru/hr/kompensacii/skidkinew/" aria-label="Скидки"></a>
</template>

<template id="benefits-yandex-hr-links" title="Region and HR links" type="block" group="Yandex HR benefits">
  <style>
    & {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .benefits-link {
      display: flex;
      width: 100%;
      padding: 20px 24px;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #cfcddd;
      border-radius: 64px;
      box-sizing: border-box;
      color: #222a3a;
      font-size: 32px;
      font-weight: 500;
      line-height: 120%;
    }

    .benefits-link img {
      height: 40px;
    }
  </style>
  <a class="benefits-link" href="https://wiki.yandex-team.ru/HR/LgotyBelarus/" target="_blank">
      <span>Бенефиты в Беларуси</span>
      <img src="${placeholderImage}" alt="">
    </a>
    <a class="benefits-link" href="https://wiki.yandex-team.ru/hr/kompensacii/vseolgotaxdljahrbp/" target="_blank">
      <span>Вики для HR-партнеров</span>
      <img src="${placeholderImage}" alt="">
  </a>
</template>

<template id="benefits-yandex-hr-contacts" title="Contacts" type="block" group="Yandex HR benefits">
  <style>
    & {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .benefits-contact-card {
      display: flex;
      height: 185px;
      padding: 24px;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      border-radius: 24px;
      background-color: #f5f4fd;
      box-sizing: border-box;
    }

    .benefits-contact-card img {
      height: 32px;
    }

    .benefits-contact-card__title {
      color: #222a3a;
      font-size: 24px;
      font-weight: 500;
      line-height: 120%;
    }

    .benefits-contact-card__link,
    .benefits-contact-card__text {
      color: #575e6e;
      font-size: 20px;
      font-weight: 400;
      line-height: 140%;
    }
  </style>
  <div class="benefits-contact-card">
      <img src="${placeholderImage}" alt="">
      <div class="benefits-contact-card__title">Чат в Мессенджере</div>
      <a class="benefits-contact-card__link" href="https://ya.cc/helpy">robot-helpy</a>
    </div>
    <div class="benefits-contact-card">
      <img src="${placeholderImage}" alt="">
      <div class="benefits-contact-card__title">Почта</div>
      <a class="benefits-contact-card__link" href="mailto:helpy@yandex-team.ru" target="_blank">helpy@yandex-team.ru</a>
    </div>
    <div class="benefits-contact-card">
      <img src="${placeholderImage}" alt="">
      <div class="benefits-contact-card__title">Телефон</div>
      <div class="benefits-contact-card__text">8 (800) 250-96-39, доб. 444</div>
    </div>
    <div class="benefits-contact-card">
      <img src="${placeholderImage}" alt="">
      <div class="benefits-contact-card__title">Портал</div>
      <a class="benefits-contact-card__link" href="https://helpy.yandex-team.ru/" target="_blank">helpy.yandex-team.ru</a>
  </div>
</template>

<template id="gravity-ui-samples-landing-page" title="UI samples landing" type="container" group="Gravity UI samples">
  <style>
    .grid {
      display: grid;
      gap: 24px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 16px;
      box-sizing: border-box;
      color: #1d2633;
      font-family: var(--g-font-family-sans, "YS Text", Arial, sans-serif);
    }

    .grid * {
      box-sizing: border-box;
    }

    .grid a {
      color: inherit;
      text-decoration: none;
    }

    .grid button,
    .grid input {
      font: inherit;
    }

    .block-1 {
      display: grid;
      grid-template-columns: minmax(0, 0.82fr) minmax(420px, 1.18fr);
      gap: 24px;
      min-height: 520px;
      padding: 32px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #f7f9fc;
    }

    .block-1 .guis-hero__copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 20px;
      padding: 16px;
    }

    .block-1 .guis-kicker {
      width: fit-content;
      padding: 6px 10px;
      border: 1px solid #d8deea;
      border-radius: 999px;
      background: #ffffff;
      color: #4b596c;
      font-size: 13px;
      font-weight: 500;
      line-height: 16px;
    }

    .block-1 h1,
    .block-1 p {
      margin: 0;
    }

    .block-1 h1 {
      max-width: 520px;
      color: #111827;
      font-size: 54px;
      font-weight: 600;
      line-height: 1.05;
    }

    .block-1 p {
      max-width: 460px;
      color: #526071;
      font-size: 18px;
      line-height: 1.5;
    }

    .block-1 .guis-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 4px;
    }

    .block-1 .guis-button {
      display: inline-flex;
      min-height: 40px;
      padding: 0 16px;
      align-items: center;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #1d2633;
      font-size: 15px;
      font-weight: 500;
    }

    .block-1 .guis-button_primary {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .block-1 .guis-hero__panel {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .block-1 .guis-window {
      overflow: hidden;
      width: 100%;
      border: 1px solid #d8deea;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 50px rgba(34, 43, 60, 0.14);
    }

    .block-1 .guis-window__bar {
      display: flex;
      height: 40px;
      padding: 0 14px;
      align-items: center;
      gap: 7px;
      border-bottom: 1px solid #edf0f6;
      color: #657185;
      font-size: 13px;
    }

    .block-1 .guis-window__bar span {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #d8deea;
    }

    .block-1 .guis-window__bar strong {
      margin-left: 8px;
      font-weight: 500;
    }

    .block-1 .guis-app {
      display: grid;
      grid-template-columns: 160px minmax(0, 1fr);
      min-height: 360px;
      background: #ffffff;
    }

    .block-1 .guis-sidebar {
      display: grid;
      align-content: start;
      gap: 18px;
      padding: 18px;
      border-right: 1px solid #edf0f6;
      background: #f8fafd;
    }

    .block-1 .guis-logo {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      border-radius: 8px;
      background: #ffbe5c;
      color: #111827;
      font-weight: 700;
    }

    .block-1 nav {
      display: grid;
      gap: 8px;
    }

    .block-1 nav span {
      padding: 8px 10px;
      border-radius: 8px;
      color: #657185;
      font-size: 13px;
    }

    .block-1 nav .active {
      background: #111827;
      color: #ffffff;
    }

    .block-1 .guis-main {
      display: grid;
      gap: 16px;
      align-content: start;
      padding: 20px;
    }

    .block-1 .guis-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .block-1 .guis-toolbar strong {
      color: #111827;
      font-size: 18px;
    }

    .block-1 .guis-toolbar button {
      height: 32px;
      padding: 0 12px;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #1d2633;
    }

    .block-1 .guis-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .block-1 .guis-metrics article {
      display: grid;
      gap: 6px;
      padding: 14px;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      background: #ffffff;
    }

    .block-1 .guis-metrics span,
    .block-1 .guis-metrics em {
      color: #657185;
      font-size: 12px;
      font-style: normal;
    }

    .block-1 .guis-metrics strong {
      color: #111827;
      font-size: 22px;
      line-height: 1;
    }

    .block-1 .guis-chart {
      display: flex;
      height: 120px;
      padding: 18px;
      align-items: end;
      gap: 10px;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fafd);
    }

    .block-1 .guis-chart i {
      flex: 1;
      border-radius: 8px 8px 3px 3px;
      background: #6b8cff;
    }

    .block-1 .guis-chart i:nth-child(1) { height: 34%; }
    .block-1 .guis-chart i:nth-child(2) { height: 56%; }
    .block-1 .guis-chart i:nth-child(3) { height: 42%; }
    .block-1 .guis-chart i:nth-child(4) { height: 72%; }
    .block-1 .guis-chart i:nth-child(5) { height: 64%; }
    .block-1 .guis-chart i:nth-child(6) { height: 88%; }
    .block-1 .guis-chart i:nth-child(7) { height: 76%; }

    .block-2 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .block-2 article {
      display: grid;
      gap: 12px;
      min-height: 190px;
      padding: 22px;
      align-content: start;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(34, 43, 60, 0.06);
    }

    .block-2 span {
      width: fit-content;
      padding: 4px 8px;
      border-radius: 999px;
      background: #f2f5fa;
      color: #657185;
      font-size: 12px;
      font-weight: 600;
    }

    .block-2 h2,
    .block-2 p,
    .block-3 h2,
    .block-4 h2 {
      margin: 0;
    }

    .block-2 h2 {
      color: #111827;
      font-size: 24px;
      line-height: 1.15;
    }

    .block-2 p {
      color: #526071;
      font-size: 15px;
      line-height: 1.45;
    }

    .block-3,
    .block-4 {
      display: grid;
      gap: 18px;
      padding: 28px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .block-4 {
      overflow-x: auto;
    }

    .guis-section-heading {
      display: grid;
      gap: 8px;
    }

    .guis-section-heading span {
      color: #6b8cff;
      font-size: 13px;
      font-weight: 600;
    }

    .guis-section-heading h2 {
      color: #111827;
      font-size: 32px;
      line-height: 1.15;
    }

    .guis-dashboard {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .guis-dashboard article {
      display: grid;
      gap: 12px;
      padding: 18px;
      border: 1px solid #edf0f6;
      border-radius: 14px;
      background: #f8fafd;
    }

    .guis-dashboard .wide {
      grid-column: 1 / -1;
      background: #ffffff;
    }

    .guis-dashboard span {
      color: #657185;
      font-size: 13px;
    }

    .guis-dashboard strong {
      color: #111827;
      font-size: 30px;
      line-height: 1;
    }

    .guis-progress {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: #e7ecf5;
    }

    .guis-progress i {
      display: block;
      width: 72%;
      height: 100%;
      border-radius: inherit;
      background: #6b8cff;
    }

    .guis-activity {
      display: grid;
      gap: 10px;
    }

    .guis-activity p {
      display: flex;
      margin: 0;
      align-items: center;
      gap: 10px;
      color: #1d2633;
      font-size: 14px;
    }

    .guis-activity b {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #30aa6e;
    }

    .guis-activity em {
      margin-left: auto;
      color: #657185;
      font-style: normal;
    }

    .guis-table {
      width: 100%;
      min-width: 620px;
      border-collapse: collapse;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      overflow: hidden;
      color: #1d2633;
      font-size: 14px;
      white-space: nowrap;
    }

    .guis-table th,
    .guis-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #edf0f6;
      text-align: left;
    }

    .guis-table th {
      background: #f8fafd;
      color: #657185;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .guis-table tr:last-child td {
      border-bottom: 0;
    }

    .guis-table .ok,
    .guis-table .warn {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    .guis-table .ok {
      background: #e8f7ef;
      color: #147a47;
    }

    .guis-table .warn {
      background: #fff4d7;
      color: #8a5a00;
    }
  </style>
  <div class="grid">
    <div class="block-1">
      <div class="guis-hero__copy">
        <div class="guis-kicker">UI samples</div>
        <h1>Build product pages around real interface states</h1>
        <p>Show dashboards, tables, forms, and cards in a framed Gravity UI preview instead of abstract screenshots.</p>
        <div class="guis-actions">
          <a class="guis-button guis-button_primary" href="#">Explore samples</a>
          <a class="guis-button" href="#">Open docs</a>
        </div>
      </div>
      <div class="guis-hero__panel">
        <div class="guis-window">
          <div class="guis-window__bar">
            <span></span><span></span><span></span>
            <strong>Cloud console</strong>
          </div>
          <div class="guis-app">
            <aside class="guis-sidebar">
              <div class="guis-logo">G</div>
              <nav>
                <span class="active">Overview</span>
                <span>Dashboards</span>
                <span>Tables</span>
                <span>Forms</span>
              </nav>
            </aside>
            <main class="guis-main">
              <div class="guis-toolbar">
                <strong>Service health</strong>
                <button>Deploy</button>
              </div>
              <div class="guis-metrics">
                <article><span>Requests</span><strong>12.8M</strong><em>+18%</em></article>
                <article><span>Latency</span><strong>84 ms</strong><em>stable</em></article>
                <article><span>Errors</span><strong>0.03%</strong><em>low</em></article>
              </div>
              <div class="guis-chart" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
    <div class="block-2">
      <article>
        <span>01</span>
        <h2>Dashboard previews</h2>
        <p>Use cards, charts, and status indicators to make operational products feel concrete.</p>
      </article>
      <article>
        <span>02</span>
        <h2>Structured tables</h2>
        <p>Dense but readable data blocks work well for analytics, billing, monitoring, and inventory pages.</p>
      </article>
      <article>
        <span>03</span>
        <h2>Editable forms</h2>
        <p>Compact fields, toggles, and action rows help explain workflow depth without long copy.</p>
      </article>
    </div>
    <div class="block-3">
      <div class="guis-section-heading">
        <span>Dashboard</span>
        <h2>Metrics and activity in one surface</h2>
      </div>
      <div class="guis-dashboard">
        <article><span>Compute</span><strong>74%</strong><div class="guis-progress"><i></i></div></article>
        <article><span>Storage</span><strong>18.4 TB</strong><div class="guis-progress"><i></i></div></article>
        <article><span>Network</span><strong>912 Gb</strong><div class="guis-progress"><i></i></div></article>
        <article class="wide">
          <span>Release activity</span>
          <div class="guis-activity">
            <p><b></b> API gateway updated <em>2 min ago</em></p>
            <p><b></b> Billing export completed <em>18 min ago</em></p>
            <p><b></b> New alert policy published <em>1 h ago</em></p>
          </div>
        </article>
      </div>
    </div>
    <div class="block-4">
      <div class="guis-section-heading">
        <span>Data table</span>
        <h2>Readable density for production data</h2>
      </div>
      <table class="guis-table">
        <thead>
          <tr><th>Service</th><th>Status</th><th>Owner</th><th>Cost</th></tr>
        </thead>
        <tbody>
          <tr><td>Compute pool</td><td><span class="ok">Healthy</span></td><td>Platform</td><td>$8,420</td></tr>
          <tr><td>Analytics storage</td><td><span class="warn">Review</span></td><td>Data</td><td>$3,180</td></tr>
          <tr><td>Notification API</td><td><span class="ok">Healthy</span></td><td>Core</td><td>$920</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<template id="gravity-ui-samples-hero" title="Hero app preview" type="block" group="Gravity UI samples">
  <style>
    & {
      display: grid;
      grid-template-columns: minmax(0, 0.82fr) minmax(420px, 1.18fr);
      gap: 24px;
      min-height: 520px;
      padding: 32px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #f7f9fc;
    }

    .guis-hero__copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 20px;
      padding: 16px;
    }

    .guis-kicker {
      width: fit-content;
      padding: 6px 10px;
      border: 1px solid #d8deea;
      border-radius: 999px;
      background: #ffffff;
      color: #4b596c;
      font-size: 13px;
      font-weight: 500;
      line-height: 16px;
    }

    h1,
    p {
      margin: 0;
    }

    h1 {
      max-width: 520px;
      color: #111827;
      font-size: 54px;
      font-weight: 600;
      line-height: 1.05;
    }

    p {
      max-width: 460px;
      color: #526071;
      font-size: 18px;
      line-height: 1.5;
    }

    .guis-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-top: 4px;
    }

    .guis-button {
      display: inline-flex;
      min-height: 40px;
      padding: 0 16px;
      align-items: center;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #1d2633;
      font-size: 15px;
      font-weight: 500;
    }

    .guis-button_primary {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .guis-hero__panel {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .guis-window {
      overflow: hidden;
      width: 100%;
      border: 1px solid #d8deea;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 50px rgba(34, 43, 60, 0.14);
    }

    .guis-window__bar {
      display: flex;
      height: 40px;
      padding: 0 14px;
      align-items: center;
      gap: 7px;
      border-bottom: 1px solid #edf0f6;
      color: #657185;
      font-size: 13px;
    }

    .guis-window__bar span {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #d8deea;
    }

    .guis-window__bar strong {
      margin-left: 8px;
      font-weight: 500;
    }

    .guis-app {
      display: grid;
      grid-template-columns: 160px minmax(0, 1fr);
      min-height: 360px;
      background: #ffffff;
    }

    .guis-sidebar {
      display: grid;
      align-content: start;
      gap: 18px;
      padding: 18px;
      border-right: 1px solid #edf0f6;
      background: #f8fafd;
    }

    .guis-logo {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      border-radius: 8px;
      background: #ffbe5c;
      color: #111827;
      font-weight: 700;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    nav span {
      padding: 8px 10px;
      border-radius: 8px;
      color: #657185;
      font-size: 13px;
    }

    nav .active {
      background: #111827;
      color: #ffffff;
    }

    .guis-main {
      display: grid;
      gap: 16px;
      align-content: start;
      padding: 20px;
    }

    .guis-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .guis-toolbar strong {
      color: #111827;
      font-size: 18px;
    }

    .guis-toolbar button {
      height: 32px;
      padding: 0 12px;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #1d2633;
    }

    .guis-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .guis-metrics article {
      display: grid;
      gap: 6px;
      padding: 14px;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      background: #ffffff;
    }

    .guis-metrics span,
    .guis-metrics em {
      color: #657185;
      font-size: 12px;
      font-style: normal;
    }

    .guis-metrics strong {
      color: #111827;
      font-size: 22px;
      line-height: 1;
    }

    .guis-chart {
      display: flex;
      height: 120px;
      padding: 18px;
      align-items: end;
      gap: 10px;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      background: linear-gradient(180deg, #ffffff, #f8fafd);
    }

    .guis-chart i {
      flex: 1;
      border-radius: 8px 8px 3px 3px;
      background: #6b8cff;
    }

    .guis-chart i:nth-child(1) {
      height: 34%;
    }

    .guis-chart i:nth-child(2) {
      height: 56%;
    }

    .guis-chart i:nth-child(3) {
      height: 42%;
    }

    .guis-chart i:nth-child(4) {
      height: 72%;
    }

    .guis-chart i:nth-child(5) {
      height: 64%;
    }

    .guis-chart i:nth-child(6) {
      height: 88%;
    }

    .guis-chart i:nth-child(7) {
      height: 76%;
    }
  </style>
  <div class="guis-hero__copy">
    <div class="guis-kicker">UI samples</div>
    <h1>Build product pages around real interface states</h1>
    <p>Show dashboards, tables, forms, and cards in a framed Gravity UI preview instead of abstract screenshots.</p>
    <div class="guis-actions">
      <a class="guis-button guis-button_primary" href="#">Explore samples</a>
      <a class="guis-button" href="#">Open docs</a>
    </div>
  </div>
  <div class="guis-hero__panel">
    <div class="guis-window">
      <div class="guis-window__bar">
        <span></span><span></span><span></span>
        <strong>Cloud console</strong>
      </div>
      <div class="guis-app">
        <aside class="guis-sidebar">
          <div class="guis-logo">G</div>
          <nav>
            <span class="active">Overview</span>
            <span>Dashboards</span>
            <span>Tables</span>
            <span>Forms</span>
          </nav>
        </aside>
        <main class="guis-main">
          <div class="guis-toolbar">
            <strong>Service health</strong>
            <button>Deploy</button>
          </div>
          <div class="guis-metrics">
            <article><span>Requests</span><strong>12.8M</strong><em>+18%</em></article>
            <article><span>Latency</span><strong>84 ms</strong><em>stable</em></article>
            <article><span>Errors</span><strong>0.03%</strong><em>low</em></article>
          </div>
          <div class="guis-chart" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<template id="gravity-ui-samples-cards" title="Sample cards" type="block" group="Gravity UI samples">
  <style>
    & {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    article {
      display: grid;
      gap: 12px;
      min-height: 190px;
      padding: 22px;
      align-content: start;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 10px 28px rgba(34, 43, 60, 0.06);
    }

    span {
      width: fit-content;
      padding: 4px 8px;
      border-radius: 999px;
      background: #f2f5fa;
      color: #657185;
      font-size: 12px;
      font-weight: 600;
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      color: #111827;
      font-size: 24px;
      line-height: 1.15;
    }

    p {
      color: #526071;
      font-size: 15px;
      line-height: 1.45;
    }
  </style>
  <article>
    <span>01</span>
    <h2>Dashboard previews</h2>
    <p>Use cards, charts, and status indicators to make operational products feel concrete.</p>
  </article>
  <article>
    <span>02</span>
    <h2>Structured tables</h2>
    <p>Dense but readable data blocks work well for analytics, billing, monitoring, and inventory pages.</p>
  </article>
  <article>
    <span>03</span>
    <h2>Editable forms</h2>
    <p>Compact fields, toggles, and action rows help explain workflow depth without long copy.</p>
  </article>
</template>

<template id="gravity-ui-samples-dashboard" title="Dashboard section" type="block" group="Gravity UI samples">
  <style>
    & {
      display: grid;
      gap: 18px;
      padding: 28px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .guis-section-heading {
      display: grid;
      gap: 8px;
    }

    .guis-section-heading span {
      color: #6b8cff;
      font-size: 13px;
      font-weight: 600;
    }

    .guis-section-heading h2 {
      margin: 0;
      color: #111827;
      font-size: 32px;
      line-height: 1.15;
    }

    .guis-dashboard {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .guis-dashboard article {
      display: grid;
      gap: 12px;
      padding: 18px;
      border: 1px solid #edf0f6;
      border-radius: 14px;
      background: #f8fafd;
    }

    .guis-dashboard .wide {
      grid-column: 1 / -1;
      background: #ffffff;
    }

    .guis-dashboard span {
      color: #657185;
      font-size: 13px;
    }

    .guis-dashboard strong {
      color: #111827;
      font-size: 30px;
      line-height: 1;
    }

    .guis-progress {
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: #e7ecf5;
    }

    .guis-progress i {
      display: block;
      width: 72%;
      height: 100%;
      border-radius: inherit;
      background: #6b8cff;
    }

    .guis-activity {
      display: grid;
      gap: 10px;
    }

    .guis-activity p {
      display: flex;
      margin: 0;
      align-items: center;
      gap: 10px;
      color: #1d2633;
      font-size: 14px;
    }

    .guis-activity b {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #30aa6e;
    }

    .guis-activity em {
      margin-left: auto;
      color: #657185;
      font-style: normal;
    }
  </style>
  <div class="guis-section-heading">
    <span>Dashboard</span>
    <h2>Metrics and activity in one surface</h2>
  </div>
  <div class="guis-dashboard">
    <article><span>Compute</span><strong>74%</strong><div class="guis-progress"><i></i></div></article>
    <article><span>Storage</span><strong>18.4 TB</strong><div class="guis-progress"><i></i></div></article>
    <article><span>Network</span><strong>912 Gb</strong><div class="guis-progress"><i></i></div></article>
    <article class="wide">
      <span>Release activity</span>
      <div class="guis-activity">
        <p><b></b> API gateway updated <em>2 min ago</em></p>
        <p><b></b> Billing export completed <em>18 min ago</em></p>
        <p><b></b> New alert policy published <em>1 h ago</em></p>
      </div>
    </article>
  </div>
</template>

<template id="gravity-ui-samples-table" title="Data table section" type="block" group="Gravity UI samples">
  <style>
    & {
      display: grid;
      gap: 18px;
      padding: 28px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      overflow-x: auto;
    }

    .guis-section-heading {
      display: grid;
      gap: 8px;
    }

    .guis-section-heading span {
      color: #6b8cff;
      font-size: 13px;
      font-weight: 600;
    }

    .guis-section-heading h2 {
      margin: 0;
      color: #111827;
      font-size: 32px;
      line-height: 1.15;
    }

    .guis-table {
      width: 100%;
      min-width: 620px;
      border-collapse: collapse;
      border: 1px solid #edf0f6;
      border-radius: 12px;
      overflow: hidden;
      color: #1d2633;
      font-size: 14px;
      white-space: nowrap;
    }

    th,
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #edf0f6;
      text-align: left;
    }

    th {
      background: #f8fafd;
      color: #657185;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    tr:last-child td {
      border-bottom: 0;
    }

    .ok,
    .warn {
      display: inline-flex;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }

    .ok {
      background: #e8f7ef;
      color: #147a47;
    }

    .warn {
      background: #fff4d7;
      color: #8a5a00;
    }
  </style>
  <div class="guis-section-heading">
    <span>Data table</span>
    <h2>Readable density for production data</h2>
  </div>
  <table class="guis-table">
    <thead>
      <tr><th>Service</th><th>Status</th><th>Owner</th><th>Cost</th></tr>
    </thead>
    <tbody>
      <tr><td>Compute pool</td><td><span class="ok">Healthy</span></td><td>Platform</td><td>$8,420</td></tr>
      <tr><td>Analytics storage</td><td><span class="warn">Review</span></td><td>Data</td><td>$3,180</td></tr>
      <tr><td>Notification API</td><td><span class="ok">Healthy</span></td><td>Core</td><td>$920</td></tr>
    </tbody>
  </table>
</template>

<template id="gravity-ui-osn-preview-page" title="OSN landing preview" type="container" group="Gravity UI OSN">
  <style>
    .grid {
      display: grid;
      gap: 28px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 16px;
      box-sizing: border-box;
      color: #1d2633;
      font-family: var(--g-font-family-sans, "YS Text", Arial, sans-serif);
    }

    .grid * {
      box-sizing: border-box;
    }

    .grid a {
      color: inherit;
      text-decoration: none;
    }

    .block-1,
    .block-2,
    .block-3,
    .block-4,
    .block-5,
    .block-6 {
      min-width: 0;
    }

    .block-1 {
      overflow: hidden;
      min-height: 760px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 56px rgba(34, 43, 60, 0.1);
    }

    .osn-actionbar {
      display: flex;
      min-height: 44px;
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #edf0f6;
      background: #ffffff;
      color: #657185;
      font-size: 13px;
    }

    .osn-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .osn-breadcrumbs span + span::before {
      content: "/";
      margin-right: 8px;
      color: #a8b1c1;
    }

    .osn-actionbar__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .osn-icon-button,
    .osn-theme-switch {
      display: grid;
      place-items: center;
      border: 1px solid #dfe4ee;
      border-radius: 8px;
      background: #ffffff;
      color: #4b596c;
      font-size: 12px;
    }

    .osn-icon-button {
      width: 28px;
      height: 28px;
    }

    .osn-theme-switch {
      height: 28px;
      padding: 0 10px;
    }

    .osn-page {
      overflow: auto;
      height: 716px;
      background: #f6f8fb;
    }

    .osn-nav {
      display: flex;
      min-height: 72px;
      padding: 0 40px;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }

    .osn-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #111827;
      font-weight: 700;
    }

    .osn-logo img {
      width: 30px;
      height: 30px;
    }

    .osn-nav__links {
      display: flex;
      gap: 26px;
      color: #4b596c;
      font-size: 15px;
    }

    .osn-lang {
      padding: 7px 10px;
      border: 1px solid #dfe4ee;
      border-radius: 8px;
      color: #4b596c;
      font-size: 14px;
    }

    .osn-hero {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(380px, 1.1fr);
      gap: 40px;
      min-height: 440px;
      padding: 68px 40px 58px;
      align-items: center;
      background: #f5f7fb;
    }

    .osn-hero__copy {
      display: grid;
      gap: 22px;
      align-content: center;
    }

    .osn-label {
      width: fit-content;
      padding: 6px 10px;
      border-radius: 999px;
      background: #ffffff;
      color: #657185;
      font-size: 13px;
      font-weight: 600;
    }

    .osn-hero h1,
    .osn-hero p,
    .osn-section-heading h2,
    .osn-section-heading p {
      margin: 0;
    }

    .osn-hero h1 {
      color: #111827;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
    }

    .osn-hero p {
      max-width: 520px;
      color: #526071;
      font-size: 18px;
      line-height: 1.55;
    }

    .osn-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .osn-button {
      display: inline-flex;
      min-height: 42px;
      padding: 0 16px;
      align-items: center;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #111827;
      font-size: 15px;
      font-weight: 600;
    }

    .osn-button_primary {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .osn-hero__image {
      display: grid;
      place-items: center;
      min-height: 300px;
      padding: 24px;
      border: 1px solid #dfe4ee;
      border-radius: 24px;
      background: #ffffff;
    }

    .osn-hero__image img {
      display: block;
      max-width: 100%;
      max-height: 320px;
    }

    .block-2,
    .block-4,
    .block-5 {
      display: grid;
      gap: 22px;
      padding: 34px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .osn-section-heading {
      display: grid;
      gap: 10px;
      max-width: 760px;
    }

    .osn-section-heading h2 {
      color: #111827;
      font-size: 42px;
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: 0;
    }

    .osn-section-heading p {
      color: #526071;
      font-size: 17px;
      line-height: 1.5;
    }

    .osn-features {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-feature {
      display: grid;
      gap: 16px;
      min-height: 260px;
      padding: 24px;
      align-content: start;
      border: 1px solid #edf0f6;
      border-radius: 16px;
      background: #f8fafd;
    }

    .osn-feature img {
      width: 42px;
      height: 42px;
    }

    .osn-feature h3,
    .osn-feature p,
    .osn-card h3,
    .osn-card p,
    .osn-timeline-card h3,
    .osn-timeline-card p {
      margin: 0;
    }

    .osn-feature h3 {
      color: #111827;
      font-size: 24px;
      line-height: 1.15;
    }

    .osn-feature p {
      color: #526071;
      font-size: 15px;
      line-height: 1.5;
    }

    .block-3 {
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 0.85fr) minmax(380px, 1.15fr);
      min-height: 360px;
      border-radius: 16px;
      background: #15191f;
      color: #ffffff;
    }

    .osn-dark-copy {
      display: grid;
      gap: 24px;
      align-content: center;
      padding: 42px;
    }

    .osn-dark-copy h2 {
      margin: 0;
      font-size: 40px;
      line-height: 1.12;
      letter-spacing: 0;
    }

    .osn-dark-copy .osn-button {
      width: fit-content;
      border-color: rgba(255, 255, 255, 0.24);
      background: #ffffff;
      color: #111827;
    }

    .osn-layout-image {
      min-height: 360px;
      background:
        linear-gradient(90deg, rgba(21, 25, 31, 0.1), rgba(21, 25, 31, 0)),
        url("${backgroundPlaceholderImage}") center / cover no-repeat;
    }

    .osn-timeline {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-timeline-card {
      display: grid;
      gap: 14px;
      min-height: 220px;
      padding: 22px;
      border: 1px solid #edf0f6;
      border-radius: 16px;
      background: #f8fafd;
    }

    .osn-timeline-card img {
      height: 56px;
      width: 56px;
    }

    .osn-timeline-card h3 {
      color: #111827;
      font-size: 22px;
      line-height: 1.15;
    }

    .osn-timeline-card p {
      color: #526071;
      font-size: 15px;
      line-height: 1.45;
    }

    .osn-color-cards {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-card {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 10px;
      min-height: 230px;
      padding: 24px;
      align-content: end;
      border-radius: 18px;
      color: #ffffff;
    }

    .osn-card_theme_light {
      color: #111827;
    }

    .osn-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background-position: top right;
      background-repeat: no-repeat;
      background-size: 156px auto;
      opacity: 0.92;
    }

    .osn-card > * {
      position: relative;
      z-index: 1;
    }

    .osn-card h3 {
      font-size: 24px;
      line-height: 1.15;
    }

    .osn-card p {
      max-width: 260px;
      font-size: 15px;
      line-height: 1.45;
      opacity: 0.86;
    }

    .osn-card_cube {
      background: #5b768c;
    }

    .osn-card_cube::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .osn-card_cubes {
      background: #277270;
    }

    .osn-card_cubes::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .osn-card_numbers {
      background: #f7af49;
    }

    .osn-card_numbers::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .osn-card_code {
      background: #4761d6;
    }

    .osn-card_code::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .osn-card_mail {
      background: #77e369;
    }

    .osn-card_mail::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .osn-card_store {
      background: #fae26f;
    }

    .osn-card_store::before {
      background-image: url("${backgroundPlaceholderImage}");
    }

    .block-6 {
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
      gap: 24px;
      align-items: center;
      padding: 34px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .osn-media-copy {
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .osn-media-copy h2,
    .osn-media-copy p {
      margin: 0;
    }

    .osn-media-copy h2 {
      color: #111827;
      font-size: 40px;
      line-height: 1.12;
    }

    .osn-media-copy p {
      color: #526071;
      font-size: 17px;
      line-height: 1.5;
    }

    .osn-result {
      display: grid;
      place-items: center;
      min-height: 280px;
      border-radius: 18px;
      background: #f8fafd;
    }

    .osn-result img {
      max-width: 88%;
      max-height: 260px;
    }

    @media (max-width: 900px) {
      .block-1 .osn-hero,
      .block-3,
      .block-6 {
        grid-template-columns: 1fr;
      }

      .osn-features,
      .osn-timeline,
      .osn-color-cards {
        grid-template-columns: 1fr;
      }

      .osn-nav {
        align-items: flex-start;
        flex-direction: column;
        gap: 14px;
        padding: 20px;
      }

      .osn-hero {
        padding: 42px 22px;
      }

      .osn-hero h1 {
        font-size: 42px;
      }
    }
  </style>
  <div class="grid">
    <div class="block-1">
      <div class="osn-actionbar">
        <div class="osn-breadcrumbs">
          <span>Gravity UI</span>
          <span>Landing</span>
        </div>
        <div class="osn-actionbar__actions">
          <span class="osn-icon-button">S</span>
          <span class="osn-icon-button">A</span>
          <span class="osn-theme-switch">Light</span>
        </div>
      </div>
      <div class="osn-page">
        <header class="osn-nav">
          <a class="osn-logo" href="#">
            <img src="${placeholderImage}" alt="">
            <span>Gravity UI</span>
          </a>
          <nav class="osn-nav__links">
            <a href="#">Projects</a>
            <a href="#">Technology</a>
            <a href="#">Contacts</a>
          </nav>
          <a class="osn-lang" href="#">Language</a>
        </header>
        <section class="osn-hero">
          <div class="osn-hero__copy">
            <span class="osn-label">Sample service</span>
            <h1>Sample Service</h1>
            <p>The service does good and provides you with a lot of opportunities and features. With the highest tech in mind we created a solution for complex product teams.</p>
            <div class="osn-actions">
              <a class="osn-button osn-button_primary" href="#">Get started</a>
              <a class="osn-button" href="#">Learn more</a>
            </div>
          </div>
          <div class="osn-hero__image">
            <img src="${placeholderImage}" alt="">
          </div>
        </section>
      </div>
    </div>
    <div class="block-2">
      <div class="osn-section-heading">
        <h2>Why this solution is good</h2>
        <p>Three concise arguments from the OSN sample: scalability, rich features, and pricing flexibility.</p>
      </div>
      <div class="osn-features">
        <article class="osn-feature">
          <img src="${placeholderImage}" alt="">
          <h3>Scalability</h3>
          <p>Use one instance or multiple environments depending on team size, load, and rollout strategy.</p>
        </article>
        <article class="osn-feature">
          <img src="${placeholderImage}" alt="">
          <h3>Features</h3>
          <p>Describe a broad feature set, integrations, and customization for specific product requirements.</p>
        </article>
        <article class="osn-feature">
          <img src="${placeholderImage}" alt="">
          <h3>Price</h3>
          <p>Show flexible subscription or usage-based pricing with a compact argument for purchase.</p>
        </article>
      </div>
    </div>
    <div class="block-3">
      <div class="osn-dark-copy">
        <h2>We have additional content for you to discover</h2>
        <a class="osn-button" href="#">Learn more</a>
      </div>
      <div class="osn-layout-image"></div>
    </div>
    <div class="block-4">
      <div class="osn-section-heading">
        <h2>Tell a story and build a narrative</h2>
        <p>The OSN preview uses a timeline-style card layout to explain a multi-step process.</p>
      </div>
      <div class="osn-timeline">
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Discover Terms</h3><p>Collect the information you need before starting the application.</p></article>
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Create Application</h3><p>Proceed to the application after the initial information is ready.</p></article>
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Prepare Papers</h3><p>Prepare everything according to the roadmap and checklist.</p></article>
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Fill the Form</h3><p>Answer the last questions and confirm the details.</p></article>
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Meet Manager</h3><p>Managers guide the team throughout the process.</p></article>
        <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Submit</h3><p>Everything is ready for review and launch.</p></article>
      </div>
    </div>
    <div class="block-5">
      <div class="osn-section-heading">
        <h2>Some more cards for your information</h2>
        <p>Background cards work as a visual catalog of areas, cases, and capabilities.</p>
      </div>
      <div class="osn-color-cards">
        <article class="osn-card osn-card_cube"><h3>The Cube</h3><p>A simplistic yet powerful volume geometry primitive.</p></article>
        <article class="osn-card osn-card_cubes"><h3>Pile of Cubes</h3><p>Put cubes together to save space and enhance storage.</p></article>
        <article class="osn-card osn-card_numbers osn-card_theme_light"><h3>Random Numbers</h3><p>Useful data stories for tough management decisions.</p></article>
        <article class="osn-card osn-card_code"><h3>Code Assistant</h3><p>A future-facing example for developer workflows.</p></article>
        <article class="osn-card osn-card_mail osn-card_theme_light"><h3>Mail List Service</h3><p>Classic communication still provides useful experience.</p></article>
        <article class="osn-card osn-card_store osn-card_theme_light"><h3>Project Data</h3><p>Store, share, and collaborate with the team.</p></article>
      </div>
    </div>
    <div class="block-6">
      <div class="osn-media-copy">
        <span class="osn-label">Webinar</span>
        <h2>Discover our latest webinar</h2>
        <p>Managers and engineers share their expertise on the best practices.</p>
        <a class="osn-button osn-button_primary" href="#">Watch now</a>
      </div>
      <div class="osn-result">
        <img src="${placeholderImage}" alt="">
      </div>
    </div>
  </div>
</template>

<template id="gravity-ui-osn-hero-preview" title="OSN hero preview" type="block" group="Gravity UI OSN">
  <style>
    & {
      overflow: hidden;
      min-height: 760px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 56px rgba(34, 43, 60, 0.1);
    }

    .osn-actionbar {
      display: flex;
      min-height: 44px;
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #edf0f6;
      background: #ffffff;
      color: #657185;
      font-size: 13px;
    }

    .osn-breadcrumbs,
    .osn-actionbar__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .osn-breadcrumbs span + span::before {
      content: "/";
      margin-right: 8px;
      color: #a8b1c1;
    }

    .osn-icon-button,
    .osn-theme-switch {
      display: grid;
      place-items: center;
      border: 1px solid #dfe4ee;
      border-radius: 8px;
      background: #ffffff;
      color: #4b596c;
      font-size: 12px;
    }

    .osn-icon-button {
      width: 28px;
      height: 28px;
    }

    .osn-theme-switch {
      height: 28px;
      padding: 0 10px;
    }

    .osn-page {
      overflow: auto;
      height: 716px;
      background: #f6f8fb;
    }

    .osn-nav {
      display: flex;
      min-height: 72px;
      padding: 0 40px;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
    }

    .osn-logo,
    .osn-nav__links {
      display: flex;
      align-items: center;
    }

    .osn-logo {
      gap: 10px;
      color: #111827;
      font-weight: 700;
    }

    .osn-logo img {
      width: 30px;
      height: 30px;
    }

    .osn-nav__links {
      gap: 26px;
      color: #4b596c;
      font-size: 15px;
    }

    .osn-lang {
      padding: 7px 10px;
      border: 1px solid #dfe4ee;
      border-radius: 8px;
      color: #4b596c;
      font-size: 14px;
    }

    .osn-hero {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(380px, 1.1fr);
      gap: 40px;
      min-height: 440px;
      padding: 68px 40px 58px;
      align-items: center;
      background: #f5f7fb;
    }

    .osn-hero__copy {
      display: grid;
      gap: 22px;
      align-content: center;
    }

    .osn-label {
      width: fit-content;
      padding: 6px 10px;
      border-radius: 999px;
      background: #ffffff;
      color: #657185;
      font-size: 13px;
      font-weight: 600;
    }

    h1,
    p {
      margin: 0;
    }

    h1 {
      color: #111827;
      font-size: 64px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
    }

    p {
      max-width: 520px;
      color: #526071;
      font-size: 18px;
      line-height: 1.55;
    }

    .osn-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .osn-button {
      display: inline-flex;
      min-height: 42px;
      padding: 0 16px;
      align-items: center;
      border: 1px solid #d8deea;
      border-radius: 8px;
      background: #ffffff;
      color: #111827;
      font-size: 15px;
      font-weight: 600;
    }

    .osn-button_primary {
      border-color: #111827;
      background: #111827;
      color: #ffffff;
    }

    .osn-hero__image {
      display: grid;
      place-items: center;
      min-height: 300px;
      padding: 24px;
      border: 1px solid #dfe4ee;
      border-radius: 24px;
      background: #ffffff;
    }

    .osn-hero__image img {
      display: block;
      max-width: 100%;
      max-height: 320px;
    }
  </style>
  <div class="osn-actionbar">
    <div class="osn-breadcrumbs">
      <span>Gravity UI</span>
      <span>Landing</span>
    </div>
    <div class="osn-actionbar__actions">
      <span class="osn-icon-button">S</span>
      <span class="osn-icon-button">A</span>
      <span class="osn-theme-switch">Light</span>
    </div>
  </div>
  <div class="osn-page">
    <header class="osn-nav">
      <a class="osn-logo" href="#">
        <img src="${placeholderImage}" alt="">
        <span>Gravity UI</span>
      </a>
      <nav class="osn-nav__links">
        <a href="#">Projects</a>
        <a href="#">Technology</a>
        <a href="#">Contacts</a>
      </nav>
      <a class="osn-lang" href="#">Language</a>
    </header>
    <section class="osn-hero">
      <div class="osn-hero__copy">
        <span class="osn-label">Sample service</span>
        <h1>Sample Service</h1>
        <p>The service does good and provides you with a lot of opportunities and features. With the highest tech in mind we created a solution for complex product teams.</p>
        <div class="osn-actions">
          <a class="osn-button osn-button_primary" href="#">Get started</a>
          <a class="osn-button" href="#">Learn more</a>
        </div>
      </div>
      <div class="osn-hero__image">
        <img src="${placeholderImage}" alt="">
      </div>
    </section>
  </div>
</template>

<template id="gravity-ui-osn-features" title="OSN features" type="block" group="Gravity UI OSN">
  <style>
    & {
      display: grid;
      gap: 22px;
      padding: 34px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
      color: #1d2633;
    }

    .osn-section-heading {
      display: grid;
      gap: 10px;
      max-width: 760px;
    }

    h2,
    p,
    h3 {
      margin: 0;
    }

    h2 {
      color: #111827;
      font-size: 42px;
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: 0;
    }

    .osn-section-heading p {
      color: #526071;
      font-size: 17px;
      line-height: 1.5;
    }

    .osn-features {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-feature {
      display: grid;
      gap: 16px;
      min-height: 260px;
      padding: 24px;
      align-content: start;
      border: 1px solid #edf0f6;
      border-radius: 16px;
      background: #f8fafd;
    }

    .osn-feature img {
      width: 42px;
      height: 42px;
    }

    .osn-feature h3 {
      color: #111827;
      font-size: 24px;
      line-height: 1.15;
    }

    .osn-feature p {
      color: #526071;
      font-size: 15px;
      line-height: 1.5;
    }
  </style>
  <div class="osn-section-heading">
    <h2>Why this solution is good</h2>
    <p>Three concise arguments from the OSN sample: scalability, rich features, and pricing flexibility.</p>
  </div>
  <div class="osn-features">
    <article class="osn-feature">
      <img src="${placeholderImage}" alt="">
      <h3>Scalability</h3>
      <p>Use one instance or multiple environments depending on team size, load, and rollout strategy.</p>
    </article>
    <article class="osn-feature">
      <img src="${placeholderImage}" alt="">
      <h3>Features</h3>
      <p>Describe a broad feature set, integrations, and customization for specific product requirements.</p>
    </article>
    <article class="osn-feature">
      <img src="${placeholderImage}" alt="">
      <h3>Price</h3>
      <p>Show flexible subscription or usage-based pricing with a compact argument for purchase.</p>
    </article>
  </div>
</template>

<template id="gravity-ui-osn-story" title="OSN narrative cards" type="block" group="Gravity UI OSN">
  <style>
    & {
      display: grid;
      gap: 22px;
      padding: 34px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .osn-section-heading {
      display: grid;
      gap: 10px;
      max-width: 760px;
    }

    h2,
    p,
    h3 {
      margin: 0;
    }

    h2 {
      color: #111827;
      font-size: 42px;
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: 0;
    }

    .osn-section-heading p {
      color: #526071;
      font-size: 17px;
      line-height: 1.5;
    }

    .osn-timeline {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-timeline-card {
      display: grid;
      gap: 14px;
      min-height: 220px;
      padding: 22px;
      border: 1px solid #edf0f6;
      border-radius: 16px;
      background: #f8fafd;
    }

    .osn-timeline-card img {
      width: 56px;
      height: 56px;
    }

    .osn-timeline-card h3 {
      color: #111827;
      font-size: 22px;
      line-height: 1.15;
    }

    .osn-timeline-card p {
      color: #526071;
      font-size: 15px;
      line-height: 1.45;
    }
  </style>
  <div class="osn-section-heading">
    <h2>Tell a story and build a narrative</h2>
    <p>The OSN preview uses a timeline-style card layout to explain a multi-step process.</p>
  </div>
  <div class="osn-timeline">
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Discover Terms</h3><p>Collect the information you need before starting the application.</p></article>
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Create Application</h3><p>Proceed to the application after the initial information is ready.</p></article>
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Prepare Papers</h3><p>Prepare everything according to the roadmap and checklist.</p></article>
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Fill the Form</h3><p>Answer the last questions and confirm the details.</p></article>
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Meet Manager</h3><p>Managers guide the team throughout the process.</p></article>
    <article class="osn-timeline-card"><img src="${placeholderImage}" alt=""><h3>Submit</h3><p>Everything is ready for review and launch.</p></article>
  </div>
</template>

<template id="gravity-ui-osn-background-cards" title="OSN background cards" type="block" group="Gravity UI OSN">
  <style>
    & {
      display: grid;
      gap: 22px;
      padding: 34px;
      border: 1px solid #dfe4ee;
      border-radius: 16px;
      background: #ffffff;
    }

    .osn-section-heading {
      display: grid;
      gap: 10px;
      max-width: 760px;
    }

    h2,
    p,
    h3 {
      margin: 0;
    }

    h2 {
      color: #111827;
      font-size: 42px;
      font-weight: 700;
      line-height: 1.12;
      letter-spacing: 0;
    }

    .osn-section-heading p {
      color: #526071;
      font-size: 17px;
      line-height: 1.5;
    }

    .osn-color-cards {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .osn-card {
      position: relative;
      overflow: hidden;
      display: grid;
      gap: 10px;
      min-height: 230px;
      padding: 24px;
      align-content: end;
      border-radius: 18px;
      color: #ffffff;
    }

    .osn-card_theme_light {
      color: #111827;
    }

    .osn-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background-position: top right;
      background-repeat: no-repeat;
      background-size: 156px auto;
      opacity: 0.92;
    }

    .osn-card > * {
      position: relative;
      z-index: 1;
    }

    .osn-card h3 {
      font-size: 24px;
      line-height: 1.15;
    }

    .osn-card p {
      max-width: 260px;
      font-size: 15px;
      line-height: 1.45;
      opacity: 0.86;
    }

    .osn-card_cube { background: #5b768c; }
    .osn-card_cubes { background: #277270; }
    .osn-card_numbers { background: #f7af49; }
    .osn-card_code { background: #4761d6; }
    .osn-card_mail { background: #77e369; }
    .osn-card_store { background: #fae26f; }
    .osn-card_cube::before { background-image: url("${backgroundPlaceholderImage}"); }
    .osn-card_cubes::before { background-image: url("${backgroundPlaceholderImage}"); }
    .osn-card_numbers::before { background-image: url("${backgroundPlaceholderImage}"); }
    .osn-card_code::before { background-image: url("${backgroundPlaceholderImage}"); }
    .osn-card_mail::before { background-image: url("${backgroundPlaceholderImage}"); }
    .osn-card_store::before { background-image: url("${backgroundPlaceholderImage}"); }
  </style>
  <div class="osn-section-heading">
    <h2>Some more cards for your information</h2>
    <p>Background cards work as a visual catalog of areas, cases, and capabilities.</p>
  </div>
  <div class="osn-color-cards">
    <article class="osn-card osn-card_cube"><h3>The Cube</h3><p>A simplistic yet powerful volume geometry primitive.</p></article>
    <article class="osn-card osn-card_cubes"><h3>Pile of Cubes</h3><p>Put cubes together to save space and enhance storage.</p></article>
    <article class="osn-card osn-card_numbers osn-card_theme_light"><h3>Random Numbers</h3><p>Useful data stories for tough management decisions.</p></article>
    <article class="osn-card osn-card_code"><h3>Code Assistant</h3><p>A future-facing example for developer workflows.</p></article>
    <article class="osn-card osn-card_mail osn-card_theme_light"><h3>Mail List Service</h3><p>Classic communication still provides useful experience.</p></article>
    <article class="osn-card osn-card_store osn-card_theme_light"><h3>Project Data</h3><p>Store, share, and collaborate with the team.</p></article>
  </div>
</template>`;

export const gridBlockTemplates: GridBlockTemplate[] = parseTemplates(templateMarkup);
