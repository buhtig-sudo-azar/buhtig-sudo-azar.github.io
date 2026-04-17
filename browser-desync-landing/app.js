"use strict";

/*
 * app.js для обновлённого Browser Desync Demo
 *
 * Логика:
 *  - плавный скролл по секциям;
 *  - бургер и мобильное меню;
 *  - кнопки BACK (desktop + mobile) с переходом на основной интерфейс;
 *  - пресеты в демо-зоне (3 примера);
 *  - отправка формы: проверка, генерация текстовой симуляции;
 *  - сброс формы и результата.
 */

// TODO: сюда подставить URL основного интерфейса
const BACK_TARGET_URL = "https://example.com/app";

document.addEventListener("DOMContentLoaded", function () {
  /* ============ ПЛАВНЫЙ СКРОЛЛ ============ */

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

  var scrollToDemoBtnMobile = document.getElementById("scrollToDemoBtnMobile");
  if (scrollToDemoBtnMobile) {
    scrollToDemoBtnMobile.addEventListener("click", function (e) {
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

  /* ============ BURGER / МОБИЛЬНОЕ МЕНЮ ============ */

  (function () {
    var navToggle = document.getElementById("navToggle");
    var navMobile = document.getElementById("navMobile");
    if (!navToggle || !navMobile) return;

    navMobile.style.display = "none";

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

  /* ============ КНОПКА BACK (desktop + mobile) ============ */

  function goBackToMainInterface() {
    if (BACK_TARGET_URL && typeof BACK_TARGET_URL === "string") {
      window.location.href = BACK_TARGET_URL;
    }
  }

  var backBtn = document.getElementById("backBtn");
  var backBtnMobile = document.getElementById("backBtnMobile");

  if (backBtn) {
    backBtn.addEventListener("click", function (e) {
      e.preventDefault();
      goBackToMainInterface();
    });
  }

  if (backBtnMobile) {
    backBtnMobile.addEventListener("click", function (e) {
      e.preventDefault();
      goBackToMainInterface();
    });
  }

  /* ============ ПРЕСЕТЫ ДЕМО-ЗОНЫ ============ */

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

  /* ============ ДЕМО-ФОРМА: СИМУЛЯЦИЯ + СБРОС ============ */

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
          "Сервер видит конфликт заголовков Content-Length и Transfer-Encoding: chunked и " +
          "может по-разному решать, какой из них приоритетнее. На уровне прокси " +
          "и бэкендов возможна рассинхронизация границ тела.";
        browserView =
          "Браузер ориентируется на одну модель потока (обычно chunked), поэтому лишний " +
          "фрагмент данных может быть принят как начало нового документа.";
      } else if (contentLengthDeclared !== null) {
        backendView =
          "Сервер следует Content-Length = " + contentLengthDeclared +
          " и считает тело завершённым после указанного числа байт.";
        if (bodyByteLength > contentLengthDeclared) {
          browserView =
            "Фактическое тело длиннее заявленного. Остаток может быть воспринят " +
            "как начало следующего ответа и потенциально стать отдельным документом.";
        } else if (bodyByteLength < contentLengthDeclared) {
          browserView =
            "Фактическое тело короче заявленного. Браузер может ожидать больше данных, " +
            "что создаёт окно для подмешивания фрагментов последующих ответов.";
        } else {
          browserView =
            "Длина тела совпадает с Content-Length. Явного конфликта нет, но при " +
            "нестандартной обработке на пути запрос всё равно может вести себя неожиданно.";
        }
      } else if (hasChunked) {
        backendView =
          "Сервер/прокси разбирают тело как chunked-поток и полагаются на корректность " +
          "структуры чанков.";
        browserView =
          "Браузер завершает документ по первому корректному окончанию chunked-последовательности, " +
          "оставшийся хвост может превратиться в «лишний» контент.";
      } else {
        backendView =
          "Сервер видит неявное тело без явного Content-Length и Transfer-Encoding. " +
          "Поведение зависит от конкретного стека HTTP.";
        browserView =
          "Браузер просто рендерит полученный документ. При этом любые нестандартные " +
          "ответы прокси могут привести к десинхронизации.";
      }

      if (hasJson || bodyLower.indexOf("{") !== -1) {
        extraHint =
          "Тело похоже на JSON. Если внутри закодированы последовательности вида " +
          "\"GET /... HTTP/1.1\", они могут использоваться как вложенные HTTP-запросы.";
      }

      if (bodyLower.indexOf("get /") !== -1 ||
          bodyLower.indexOf("post /") !== -1 ||
          bodyLower.indexOf("<script") !== -1) {
        extraHint =
          (extraHint ? extraHint + " " : "") +
          "В теле есть фрагменты, похожие на самостоятельный HTTP-запрос или HTML/JS-код — " +
          "в случае успешного Browser Desync именно они могли бы оказаться отдельным документом.";
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
        "эмулирует поведение конкретных серверов, прокси и браузеров. Её цель — " +
        "показать идею рассинхронизации и появления «лишнего» ответа.</div>";

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
