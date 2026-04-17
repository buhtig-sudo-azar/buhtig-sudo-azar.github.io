"use strict";

// Ждём, пока браузер построит DOM-дерево страницы.
// Это безопасная точка, когда можно искать элементы по id / классам.
document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------------------------------
  // ФУНКЦИЯ ПЛАВНОГО СКРОЛЛА К ЛЮБОМУ ЭЛЕМЕНТУ
  // ----------------------------------------------------
  /**
   * Плавно прокручивает страницу к заданному элементу.
   * @param {Element|null} el - DOM-элемент, к которому нужно проскроллить.
   * @param {number} delta - Дополнительное смещение сверху (например, чтобы не залезать под шапку).
   */
  function scrollToElement(el, delta) {
    if (!el) return; // Если элемента нет на странице — выходим.

    // Координаты элемента относительно текущего viewport.
    var rect = el.getBoundingClientRect();

    // Итоговая позиция прокрутки:
    // текущий скролл + смещение элемента относительно окна - отступ.
    var offset = window.pageYOffset + rect.top - (delta || 50);

    // Плавная прокрутка до нужной позиции.
    window.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }

  // ----------------------------------------------------
  // ГЛОБАЛЬНЫЙ ЛИСТЕНЕР ДЛЯ ССЫЛОК С data-scroll
  // (работает и для десктоп-меню, и для мобильного)
  // ----------------------------------------------------
  document.addEventListener("click", function (e) {
    // Ищем ближайший родительский элемент, у которого есть атрибут data-scroll.
    var link = e.target.closest("[data-scroll]");
    if (!link) return; // Если клик не по такой ссылке — игнорируем.

    e.preventDefault();

    // В data-scroll хранится CSS-селектор (например, "#demo" или "#contacts").
    var targetSelector = link.getAttribute("data-scroll");
    var target = document.querySelector(targetSelector);

    // Для блока контактов не вычитаем отступ (чтобы доехать до самого низа),
    // для остальных секций делаем стандартный delta = 50.
    var delta = targetSelector === "#contacts" ? 0 : 50;

    scrollToElement(target, delta);
  });

  // ----------------------------------------------------
  // КНОПКИ "К демо" (в шапке) и "Запустить демо" (hero)
  // ----------------------------------------------------
  // Кнопка в шапке: <button id="scrollToDemoBtn">
  var scrollToDemoBtn = document.getElementById("scrollToDemoBtn");
  // Кнопка в hero: <button id="mainToDemo">
  var mainToDemo = document.getElementById("mainToDemo");

  if (scrollToDemoBtn) {
    scrollToDemoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var demo = document.getElementById("demo"); // Секция демо <section id="demo">
      scrollToElement(demo, 50);
    });
  }

  if (mainToDemo) {
    mainToDemo.addEventListener("click", function (e) {
      e.preventDefault();
      var demo = document.getElementById("demo");
      scrollToElement(demo, 50);
    });
  }

  // ----------------------------------------------------
  // BURGER / МОБИЛЬНОЕ МЕНЮ
  // ----------------------------------------------------
  (function () {
    // Кнопка-бургер в шапке: <button id="navToggle">
    var navToggle = document.getElementById("navToggle");
    // Блок мобильного меню: <nav id="navMobile">
    var navMobile = document.getElementById("navMobile");
    if (!navToggle || !navMobile) return;

    // Клик по бургеру — просто переключаем display у блока navMobile.
    navToggle.addEventListener("click", function (e) {
      e.preventDefault();

      if (navMobile.style.display === "none" || navMobile.style.display === "") {
        // Меню было скрыто — показываем.
        navMobile.style.display = "flex";
      } else {
        // Меню было видно — скрываем.
        navMobile.style.display = "none";
      }
    });

    // Если пользователь кликнул по ссылке внутри мобильного меню —
    // закрываем меню (чтобы оно не висело поверх контента после перехода).
    navMobile.addEventListener("click", function (e) {
      if (e.target.matches(".nav__link")) {
        navMobile.style.display = "none";
      }
    });
  })();

  // ----------------------------------------------------
  // ДЕМО-ФОРМА: СИМУЛЯЦИЯ BROWSER DESYNC
  // ----------------------------------------------------
  (function () {
    // Сама форма: <form id="demoForm">
    var form = document.getElementById("demoForm");
    // Блок ошибки под формой: <div id="demoError">
    var errorEl = document.getElementById("demoError");
    // Пустое состояние результата: <div id="demoResultEmpty">
    var emptyEl = document.getElementById("demoResultEmpty");
    // Контейнер для сгенерированного текста результата: <div id="demoResultContent">
    var contentEl = document.getElementById("demoResultContent");

    // Если чего-то из этого нет — выходим, чтобы не ловить ошибки.
    if (!form || !errorEl || !emptyEl || !contentEl) return;

    // Обработчик отправки формы.
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Находим поля ввода внутри формы по name.
      var headerInput = form.querySelector("input[name='header']");
      var bodyTextarea = form.querySelector("textarea[name='body']");
      var submitBtn = form.querySelector("button[type='submit']");

      // Берём значения, приводим к строке и обрезаем пробелы.
      var header = (headerInput && headerInput.value ? headerInput.value : "").trim();
      var body = (bodyTextarea && bodyTextarea.value ? bodyTextarea.value : "").trim();

      // Сбрасываем сообщение об ошибке (если было показано ранее).
      errorEl.style.display = "none";

      // Если оба поля пустые — показываем ошибку и ничего не симулируем.
      if (!header && !body) {
        errorEl.style.display = "block";
        return;
      }

      // Визуально показываем "отправку":
      // меняем текст кнопки и временно блокируем её.
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      // Эти строки будут описывать, как "видит" ответ браузер и бэкенд.
      var browserView = "";
      var backendView = "";
      // Дополнительный комментарий, если пользователь добавил HTML/JS.
      var extraHint = "";

      // Приводим к нижнему регистру для более простой проверки через indexOf.
      var headerLower = header.toLowerCase();
      var bodyLower = body.toLowerCase();

      // Простая логика: если в заголовках есть "content-length" —
      // выдаём один тип комментария, если "transfer-encoding" — другой.
      if (headerLower.indexOf("content-length") !== -1) {
        browserView =
          "Браузер полагается на вычисленную длину тела ответа и может «отрезать» часть контента.";
        backendView =
          "Бэкенд может принять тело целиком или, наоборот, добавить лишние байты — возникает рассинхрон.";
      } else if (headerLower.indexOf("transfer-encoding") !== -1) {
        browserView =
          "Браузер обрабатывает ответ как chunked-поток и завершает документ по первому корректному окончанию.";
        backendView =
          "Прокси/сервер может трактовать границы чанков иначе, что открывает путь к внедрению содержимого следующего ответа.";
      } else {
        // Если никаких специальных заголовков нет — общий комментарий.
        browserView =
          "Браузер интерпретирует ответ как обычный документ без явных аномалий.";
        backendView =
          "Но при специфическом сочетании заголовков и тела прокси/сервер могут разбирать поток иначе, создавая почву для Browser Desync.";
      }

      // Если в теле есть HTML/JS-теги, добавляем отдельный комментарий.
      if (bodyLower.indexOf("<script") !== -1 || bodyLower.indexOf("</html") !== -1) {
        extraHint =
          "Вы добавили HTML/JS-фрагмент, который в случае успешного Browser Desync может быть внедрён в ответ страницы.";
      }

      // Показываем только первые ~120 символов тела запроса как "фрагмент полезной нагрузки".
      var payloadPreview;
      if (body) {
        payloadPreview = body.slice(0, 120);
        if (body.length > 120) {
          payloadPreview += "…";
        }
      } else {
        payloadPreview = "пустое тело запроса";
      }

      // Экранируем спецсимволы, чтобы отрезок не воспринимался как настоящий HTML.
      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      var safePayload = escapeHtml(payloadPreview);

      // Собираем HTML-строку для блока результата.
      // Здесь текст "про браузер" и "про сервер", плюс фрагмент payload-а.
      var html =
        "<strong>Краткое резюме:</strong><br>" +
        "Сервер интерпретировал ответ так: " + escapeHtml(backendView) + "<br><br>" +
        "Браузер интерпретировал ответ так: " + escapeHtml(browserView) + "<br><br>" +
        "<strong>Фрагмент полезной нагрузки (потенциальный «лишний» блок):</strong><br>" +
        "<code>" + safePayload + "</code><br><br>";

      // Если есть extraHint — добавляем дополнительный блок.
      if (extraHint) {
        html += "<strong>Дополнительно:</strong> " + escapeHtml(extraHint) + "<br><br>";
      }

      html +=
        "<strong>Комментарий:</strong> Это упрощённая текстовая симуляция. " +
        "В реальном стенде можно визуально разделить байтовый поток на части «А» (видит сервер) " +
        "и «Б» (видит браузер).";

      // Прячем пустое состояние и показываем сгенерированный результат.
      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = html;

      // Возвращаем кнопке исходное состояние через 400 мс.
      setTimeout(function () {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }, 400);
    });
  })();
});







