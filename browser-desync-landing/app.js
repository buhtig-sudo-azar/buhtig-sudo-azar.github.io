"use strict";

/*
 * Учебный app.js
 *
 * Здесь собрана логика:
 * - плавного скролла по секциям (через data-scroll),
 * - работы бургер-меню,
 * - готовых примеров (пресетов) для формы,
 * - симуляции Browser Desync (текстовый разбор),
 * - сброса формы.
 */

// Ждём, пока браузер построит DOM-дерево, чтобы можно было безопасно искать элементы по id.
document.addEventListener("DOMContentLoaded", function () {
  // ----------------------------------------------------
  // ФУНКЦИЯ ПЛАВНОГО СКРОЛЛА К ЭЛЕМЕНТУ
  // ----------------------------------------------------
  /**
   * Плавно прокручивает страницу к заданному DOM-элементу.
   * @param {Element|null} el - элемент, к которому нужно проскроллить.
   * @param {number} delta - отступ сверху (чтобы не уехать под шапку).
   */
  function scrollToElement(el, delta) {
    if (!el) return;

    // Получаем позицию элемента относительно viewport.
    var rect = el.getBoundingClientRect();

    // Расчитываем целевую позицию скролла:
    // текущий скролл + положение элемента - желаемый отступ.
    var offset = window.pageYOffset + rect.top - (delta || 50);

    // Плавно скроллим.
    window.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }

  // ----------------------------------------------------
  // ССЫЛКИ/КНОПКИ С data-scroll
  // ----------------------------------------------------
  /*
   * Любой элемент с атрибутом data-scroll="#idСекции"
   * при клике плавно прокручивает страницу к указанной секции.
   * Работает для:
   * - пунктов меню в шапке (desktop),
   * - пунктов меню в мобильном nav,
   * - других ссылок, где ты захочешь использовать data-scroll.
   */
  document.addEventListener("click", function (e) {
    // Ищем ближайший родительский элемент с атрибутом data-scroll.
    var link = e.target.closest("[data-scroll]");
    if (!link) return;

    e.preventDefault();

    // В data-scroll хранится CSS-селектор (обычно вида "#about", "#demo", "#contacts").
    var targetSelector = link.getAttribute("data-scroll");
    var target = document.querySelector(targetSelector);

    // Для секции contacts можно убрать отступ, чтобы доехать до самого низа.
    var delta = targetSelector === "#contacts" ? 0 : 50;

    scrollToElement(target, delta);
  });

  // ----------------------------------------------------
  // КНОПКИ "К демо" (в шапке) и "Запустить демо" (в hero)
  // ----------------------------------------------------
  /*
   * Эти кнопки — просто быстрый шорткат к секции #demo.
   * - #scrollToDemoBtn — в шапке (на десктопе).
   * - #mainToDemo — в блоке hero на первом экране.
   */
  var scrollToDemoBtn = document.getElementById("scrollToDemoBtn");
  var mainToDemo = document.getElementById("mainToDemo");

  if (scrollToDemoBtn) {
    scrollToDemoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  if (mainToDemo) {
    mainToDemo.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  // ----------------------------------------------------
  // BURGER / МОБИЛЬНОЕ МЕНЮ
  // ----------------------------------------------------
  /*
   * На мобильных устройствах основное меню не видно.
   * Вместо него есть:
   * - кнопка #navToggle (бургер),
   * - блок #navMobile (мобильное меню).
   *
   * При клике по бургеру мы просто переключаем display у #navMobile
   * между "none" и "flex".
   */
  (function () {
    var navToggle = document.getElementById("navToggle");
    var navMobile = document.getElementById("navMobile");
    if (!navToggle || !navMobile) return;

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

    // Дополнительно: когда пользователь кликает по ссылке в мобильном меню,
    // мы закрываем меню, чтобы оно не висело поверх контента.
    navMobile.addEventListener("click", function (e) {
      if (e.target.matches(".nav__link")) {
        navMobile.style.display = "none";
      }
    });
  })();

  // ----------------------------------------------------
  // ГОТОВЫЕ ПРИМЕРЫ (PRESETS) ДЛЯ ДЕМО-ФОРМЫ
  // ----------------------------------------------------
  /*
   * DEMO_PRESETS — объект с готовыми примерами.
   * Ключи (simple-desync, length-conflict, weird-json) совпадают с атрибутом data-preset
   * у кнопок в HTML.
   *
   * Каждый пресет — это просто пара строк:
   *   { header: "...", body: "..." }
   *
   * При клике по кнопке-примеру мы подставляем соответствующий header/body в форму.
   * Поля остаются редактируемыми — пользователь может менять текст как хочет.
   */
  var DEMO_PRESETS = {
    // Пример 1. Простой десинхрон
    "simple-desync": {
      header:
        "X-Debug-Mode: desync\n" +
        "X-Client-ID: demo-user\n" +
        "Content-Length: 48\n" +
        "Transfer-Encoding: chunked",
      body:
        "4\n" +
        "test\n" +
        "0\n\n" +
        "GET /injected HTTP/1.1\n" +
        "Host: vulnerable.example"
    },

    // Пример 2. Конфликт длины
    "length-conflict": {
      header:
        "Content-Length: 10\n" +
        "X-Desync-Test: length-mismatch",
      body: '{"ok":true,"padding":"AAAAAA"}'
    },

    // Пример 3. Странный JSON
    "weird-json": {
      header:
        "X-Desync-Vector: json-weird\n" +
        "Content-Type: application/json",
      body:
        '{"action":"probe","next":"GET /evil HTTP/1.1\\r\\nHost: demo"}'
    }
  };

  /**
   * Подставляет выбранный пресет в поля формы (header/body),
   * сбрасывает ошибку и очищает результат симуляции.
   * @param {string} presetKey - ключ пресета (simple-desync / length-conflict / weird-json)
   */
  function applyPresetToForm(presetKey) {
    var preset = DEMO_PRESETS[presetKey];
    if (!preset) return;

    var form = document.getElementById("demoForm");
    if (!form) return;

    var headerInput = form.querySelector("input[name='header']");
    var bodyTextarea = form.querySelector("textarea[name='body']");
    if (!headerInput || !bodyTextarea) return;

    // Подставляем текст в поля формы
    headerInput.value = preset.header;
    bodyTextarea.value = preset.body;

    // При подстановке:
    // - скрываем ошибку (если была),
    // - показываем пустое состояние результата,
    // - чистим предыдущий результат.
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");

    if (errorEl) errorEl.style.display = "none";
    if (emptyEl && contentEl) {
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";
    }

    // Визуально отмечаем активный пресет
    var allPresetButtons = document.querySelectorAll(".demo-presets__item");
    allPresetButtons.forEach(function (btn) {
      btn.classList.remove("demo-presets__item--active");
    });

    var activeBtn = document.querySelector(
      '.demo-presets__item[data-preset="' + presetKey + '"]'
    );
    if (activeBtn) {
      activeBtn.classList.add("demo-presets__item--active");
    }
  }

  // Вешаем обработчик на все кнопки-примеры.
  (function () {
    var presetButtons = document.querySelectorAll(".demo-presets__item");
    if (!presetButtons.length) return;

    presetButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-preset");
        applyPresetToForm(key);
      });
    });
  })();

  // ----------------------------------------------------
  // ДЕМО-ФОРМА: СИМУЛЯЦИЯ + СБРОС
  // ----------------------------------------------------
  (function () {
    // Основные элементы формы и результата
    var form = document.getElementById("demoForm");
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");
    var resetBtn = document.getElementById("demoReset");

    if (!form || !errorEl || !emptyEl || !contentEl) return;

    /**
     * Полный сброс демо-формы:
     * - очищает поля,
     * - скрывает ошибку,
     * - показывает пустой результат,
     * - снимает выделение с пресетов.
     */
    function resetDemoForm() {
      var headerInput = form.querySelector("input[name='header']");
      var bodyTextarea = form.querySelector("textarea[name='body']");
      if (headerInput) headerInput.value = "";
      if (bodyTextarea) bodyTextarea.value = "";

      errorEl.style.display = "none";
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";

      var presetButtons = document.querySelectorAll(".demo-presets__item");
      presetButtons.forEach(function (btn) {
        btn.classList.remove("demo-presets__item--active");
      });
    }

    // Кнопка "Сбросить форму"
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetDemoForm();
      });
    }

    // Обработка отправки формы
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var headerInput = form.querySelector("input[name='header']");
      var bodyTextarea = form.querySelector("textarea[name='body']");
      var submitBtn = form.querySelector("button[type='submit']");

      // Берём значения из полей, обрезаем пробелы по краям.
      var header = (headerInput && headerInput.value ? headerInput.value : "").trim();
      var body = (bodyTextarea && bodyTextarea.value ? bodyTextarea.value : "").trim();

      // Сбрасываем прошлую ошибку.
      errorEl.style.display = "none";

      // Если оба поля пустые — показываем ошибку и не симулируем.
      if (!header && !body) {
        errorEl.style.display = "block";
        return;
      }

      // Визуально показываем "отправку": меняем текст и дизейблим кнопку.
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      var browserView = "";
      var backendView = "";
      var extraHint = "";

      var headerLower = header.toLowerCase();
      var bodyLower = body.toLowerCase();

      // Простейшая логика анализа заголовков: ищем ключевые слова.
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
        browserView =
          "Браузер интерпретирует ответ как обычный документ без явных аномалий.";
        backendView =
          "Но при специфическом сочетании заголовков и тела прокси/сервер могут разбирать поток иначе, создавая почву для Browser Desync.";
      }

      // Если в теле есть HTML/JS — добавляем дополнительную подсказку.
      if (bodyLower.indexOf("<script") !== -1 || bodyLower.indexOf("</html") !== -1) {
        extraHint =
          "Вы добавили HTML/JS-фрагмент, который в случае успешного Browser Desync может быть внедрён в ответ страницы.";
      }

      // Вытаскиваем первые 120 символов тела запроса — как "фрагмент полезной нагрузки".
      var payloadPreview;
      if (body) {
        payloadPreview = body.slice(0, 120);
        if (body.length > 120) {
          payloadPreview += "…";
        }
      } else {
        payloadPreview = "пустое тело запроса";
      }

      // Экранируем текст, чтобы не сломать HTML и не исполнить теги.
      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      var safePayload = escapeHtml(payloadPreview);

      // Собираем HTML результата. Всё, что может содержать пользовательский ввод,
      // обязательно пропускаем через escapeHtml.
      var html =
        "<strong>Краткое резюме:</strong><br>" +
        "Сервер интерпретировал ответ так: " + escapeHtml(backendView) + "<br><br>" +
        "Браузер интерпретировал ответ так: " + escapeHtml(browserView) + "<br><br>" +
        "<strong>Фрагмент полезной нагрузки (потенциальный «лишний» блок):</strong><br>" +
        "<code>" + safePayload + "</code><br><br>";

      if (extraHint) {
        html += "<strong>Дополнительно:</strong> " + escapeHtml(extraHint) + "<br><br>";
      }

      html +=
        "<strong>Комментарий:</strong> Это упрощённая текстовая симуляция. " +
        "В реальном стенде можно визуально разделить байтовый поток на части «А» (видит сервер) " +
        "и «Б» (видит браузер).";

      // Показываем результат, прячем пустое состояние.
      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = html;

      // Через 400 мс возвращаем кнопке исходное состояние.
      setTimeout(function () {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }, 400);
    });
  })();
});
