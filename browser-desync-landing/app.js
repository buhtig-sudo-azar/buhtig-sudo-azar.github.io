"use strict";

/*
 * app.js для обновлённого browser-desync-landing
 *
 * Логика:
 * - плавный скролл по секциям;
 * - бургер-меню на мобиле;
 * - пресеты (3 примера) => подстановка в textarea заголовков и тела;
 * - отправка формы: проверка пустых полей, текстовая симуляция;
 * - сброс формы и демо-состояния.
 */

document.addEventListener("DOMContentLoaded", function () {
  /* ===== ПЛАВНЫЙ СКРОЛЛ ===== */

  function scrollToElement(el, delta) {
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var offset = window.pageYOffset + rect.top - (delta || 50);
    window.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-scroll]");
    if (!link) return;

    e.preventDefault();
    var selector = link.getAttribute("data-scroll");
    var target = document.querySelector(selector);
    var delta = selector === "#contacts" ? 0 : 50;
    scrollToElement(target, delta);
  });

  var scrollToDemoBtn = document.getElementById("scrollToDemoBtn");
  if (scrollToDemoBtn) {
    scrollToDemoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  var mainToDemo = document.getElementById("mainToDemo");
  if (mainToDemo) {
    mainToDemo.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  /* ===== BURGER / МОБИЛЬНОЕ МЕНЮ ===== */

  (function () {
    var navToggle = document.getElementById("navToggle");
    var navMobile = document.getElementById("navMobile");
    if (!navToggle || !navMobile) return;

    navToggle.addEventListener("click", function (e) {
      e.preventDefault();
      if (navMobile.style.display === "none" || navMobile.style.display === "") {
        navMobile.style.display = "flex";
      } else {
        navMobile.style.display = "none";
      }
    });

    navMobile.addEventListener("click", function (e) {
      if (e.target.matches(".nav__link")) {
        navMobile.style.display = "none";
      }
    });
  })();

  /* ===== ПРЕСЕТЫ ===== */

  var DEMO_PRESETS = {
    "simple-desync": {
      headers:
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
    "length-conflict": {
      headers:
        "Content-Length: 10\n" +
        "X-Desync-Test: length-mismatch",
      body: '{"ok":true,"padding":"AAAAAA"}'
    },
    "weird-json": {
      headers:
        "X-Desync-Vector: json-weird\n" +
        "Content-Type: application/json",
      body:
        '{"action":"probe","next":"GET /evil HTTP/1.1\\r\\nHost: demo"}'
    }
  };

  function applyPresetToForm(presetKey) {
    var preset = DEMO_PRESETS[presetKey];
    if (!preset) return;

    var form = document.getElementById("demoForm");
    if (!form) return;

    var headersField = form.querySelector("textarea[name='headers']");
    var bodyField = form.querySelector("textarea[name='body']");
    if (!headersField || !bodyField) return;

    headersField.value = preset.headers;
    bodyField.value = preset.body;

    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");

    if (errorEl) errorEl.style.display = "none";
    if (emptyEl && contentEl) {
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";
    }

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

  /* ===== ДЕМО-ФОРМА: СИМУЛЯЦИЯ + СБРОС ===== */

  (function () {
    var form = document.getElementById("demoForm");
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");
    var resetBtn = document.getElementById("demoReset");

    if (!form || !errorEl || !emptyEl || !contentEl) return;

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function resetDemoForm() {
      var headersField = form.querySelector("textarea[name='headers']");
      var bodyField = form.querySelector("textarea[name='body']");

      if (headersField) headersField.value = "";
      if (bodyField) bodyField.value = "";

      errorEl.style.display = "none";
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";

      var presetButtons = document.querySelectorAll(".demo-presets__item");
      presetButtons.forEach(function (btn) {
        btn.classList.remove("demo-presets__item--active");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        resetDemoForm();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var headersField = form.querySelector("textarea[name='headers']");
      var bodyField = form.querySelector("textarea[name='body']");
      var submitBtn = form.querySelector("button[type='submit']");

      var rawHeaders = (headersField && headersField.value ? headersField.value : "").trim();
      var rawBody = (bodyField && bodyField.value ? bodyField.value : "").trim();

      errorEl.style.display = "none";

      if (!rawHeaders && !rawBody) {
        errorEl.style.display = "block";
        return;
      }

      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      var headersLower = rawHeaders.toLowerCase();
      var bodyLower = rawBody.toLowerCase();

      var backendView = "";
      var browserView = "";
      var extraHint = "";

      var contentLengthMatch = rawHeaders.match(/content-length:\s*(\d+)/i);
      var contentLengthDeclared = contentLengthMatch
        ? parseInt(contentLengthMatch[1], 10)
        : null;
      var bodyByteLength = rawBody ? rawBody.length : 0;

      var hasChunked = /transfer-encoding:\s*chunked/i.test(rawHeaders);
      var hasJson = /content-type:\s*application\/json/i.test(rawHeaders);

      if (contentLengthDeclared !== null && hasChunked) {
        backendView =
          "Сервер получает конфликтующие указания: и Content-Length, и Transfer-Encoding: chunked. " +
          "Разные узлы цепочки могут по-разному решить, какой заголовок важнее.";
        browserView =
          "Браузер ориентируется на одну интерпретацию границ ответа, поэтому «лишний» хвост потока " +
          "может быть принят как начало нового документа.";
      } else if (contentLengthDeclared !== null) {
        backendView =
          "Сервер строго следует Content-Length = " + contentLengthDeclared +
          " и считает тело завершённым после указанного числа байт.";
        if (bodyByteLength > contentLengthDeclared) {
          browserView =
            "Фактическое тело длиннее заявленного: браузер может обработать весь поток, тогда как сервер " +
            "может «отрезать» часть и интерпретировать остаток как начало следующего ответа.";
        } else if (bodyByteLength < contentLengthDeclared) {
          browserView =
            "Фактическое тело короче заявленного: браузер ждёт больше данных, чем фактически приходит, " +
            "что создаёт окно для подмешивания фрагментов последующих ответов.";
        } else {
          browserView =
            "Длина тела совпадает с Content-Length. Явного конфликта нет, но при нестандартном кешировании " +
            "или прокси всё равно возможны пограничные кейсы.";
        }
      } else if (hasChunked) {
        backendView =
          "Сервер/прокси разбирают поток как chunked и полагаются на корректность размеров чанков.";
        browserView =
          "Браузер закрывает документ по первому корректному завершению chunked-потока; " +
          "оставшийся хвост может стать «лишним» контентом.";
      } else {
        backendView =
          "Сервер видит обычный набор заголовков без явного указания Content-Length/Transfer-Encoding.";
        browserView =
          "Браузер рендерит документ как есть, но при особых условиях на стороне прокси/кеша " +
          "появляется пространство для десинхронизации.";
      }

      if (hasJson || bodyLower.indexOf("{") !== -1) {
        extraHint =
          "Тело похоже на JSON. Если внутри него закодированы последовательности вроде " +
          "\"GET /... HTTP/1.1\", они могут использоваться для построения вложенных HTTP-запросов.";
      }

      if (bodyLower.indexOf("get /") !== -1 ||
          bodyLower.indexOf("post /") !== -1 ||
          bodyLower.indexOf("<script") !== -1) {
        extraHint =
          (extraHint ? extraHint + " " : "") +
          "В теле присутствуют фрагменты, похожие на отдельный HTTP-запрос или HTML/JS-код — " +
          "в случае успешного Browser Desync именно они могут оказаться «лишним» документом.";
      }

      var payloadSource = rawBody || rawHeaders;
      var payloadPreview = payloadSource.slice(0, 200);
      if (payloadSource.length > 200) {
        payloadPreview += "…";
      }
      if (!payloadSource) {
        payloadPreview = "нет данных для анализа";
      }

      var safePayload = escapeHtml(payloadPreview);

      var rendered =
        "<div><strong>Серверная интерпретация:</strong><br>" +
        escapeHtml(backendView) +
        "</div><br>" +
        "<div><strong>Браузерная интерпретация:</strong><br>" +
        escapeHtml(browserView) +
        "</div><br>" +
        "<div><strong>Потенциально опасный фрагмент (упрощённо):</strong><br>" +
        "<span class=\"demo-result__payload\">" + safePayload + "</span>" +
        "</div>";

      if (extraHint) {
        rendered +=
          "<div class=\"demo-result__extra\"><strong>Дополнительно:</strong> " +
          escapeHtml(extraHint) +
          "</div>";
      }

      rendered +=
        "<br><div><strong>Комментарий:</strong> эта симуляция упрощена и не " +
        "эмулирует точное поведение конкретных серверов, прокси и браузеров. " +
        "Её задача — подсветить идею рассинхронизации и «лишнего» ответа.</div>";

      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = rendered;

      setTimeout(function () {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }, 350);
    });
  })();
});
