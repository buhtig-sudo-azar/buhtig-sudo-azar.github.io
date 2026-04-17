"use strict";

/*
 * app.js для browser-desync-landing
 *
 * Логика:
 * - плавный скролл по секциям (data-scroll, кнопки "К демо" и "Запустить демо");
 * - бургер-меню на мобиле;
 * - готовые примеры (пресеты) в демо-зоне;
 * - обработка отправки формы: генерация "разбора" сервер/браузер + опасный фрагмент;
 * - сброс формы и возврат демо в исходное состояние.
 */

document.addEventListener("DOMContentLoaded", function () {
  /* ============================
   *  ПЛАВНЫЙ СКРОЛЛ К СЕКЦИЯМ
   * ============================ */

  function scrollToElement(el, delta) {
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var offset = window.pageYOffset + rect.top - (delta || 50);
    window.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }

  // Клики по ссылкам с data-scroll (в шапке и в мобильном меню)
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-scroll]");
    if (!link) return;

    e.preventDefault();
    var selector = link.getAttribute("data-scroll");
    var target = document.querySelector(selector);
    var delta = selector === "#contacts" ? 0 : 50;
    scrollToElement(target, delta);
  });

  // Кнопка "К демо" в шапке
  var scrollToDemoBtn = document.getElementById("scrollToDemoBtn");
  if (scrollToDemoBtn) {
    scrollToDemoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  // Кнопка "Запустить демо" в hero
  var mainToDemo = document.getElementById("mainToDemo");
  if (mainToDemo) {
    mainToDemo.addEventListener("click", function (e) {
      e.preventDefault();
      scrollToElement(document.getElementById("demo"), 50);
    });
  }

  /* ============================
   *  БУРГЕР-МЕНЮ (МОБИЛЬНОЕ)
   * ============================ */

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

    // При клике по пункту меню в мобиле — закрываем меню
    navMobile.addEventListener("click", function (e) {
      if (e.target.matches(".nav__link")) {
        navMobile.style.display = "none";
      }
    });
  })();

  /* ============================
   *  ГОТОВЫЕ ПРИМЕРЫ (ПРЕСЕТЫ)
   * ============================ */

  // Набор примеров: ключи совпадают с data-preset в HTML
  var DEMO_PRESETS = {
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
    "length-conflict": {
      header:
        "Content-Length: 10\n" +
        "X-Desync-Test: length-mismatch",
      body: '{"ok":true,"padding":"AAAAAA"}'
    },
    "weird-json": {
      header:
        "X-Desync-Vector: json-weird\n" +
        "Content-Type: application/json",
      body:
        '{"action":"probe","next":"GET /evil HTTP/1.1\\\\r\\\\nHost: demo"}'
    }
  };

  /**
   * Подставляет выбранный пресет в форму.
   * @param {string} presetKey - ключ из DEMO_PRESETS.
   */
  function applyPresetToForm(presetKey) {
    var preset = DEMO_PRESETS[presetKey];
    if (!preset) return;

    var form = document.getElementById("demoForm");
    if (!form) return;

    var headerInput = form.querySelector("input[name='header']");
    var bodyTextarea = form.querySelector("textarea[name='body']");
    if (!headerInput || !bodyTextarea) return;

    // Подставляем текст примера в поля (они остаются редактируемыми)
    headerInput.value = preset.header;
    bodyTextarea.value = preset.body;

    // Сбрасываем возможную ошибку и возвращаем "пустое" состояние результата
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");

    if (errorEl) errorEl.style.display = "none";
    if (emptyEl && contentEl) {
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";
    }

    // Подсветка активного пресета
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

  // Вешаем обработчики на кнопки-пресеты
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

  /* ==================================
   *  ДЕМО-ФОРМА: СИМУЛЯЦИЯ + СБРОС
   * ================================== */

  (function () {
    var form = document.getElementById("demoForm");
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");
    var resetBtn = document.getElementById("demoReset");

    if (!form || !errorEl || !emptyEl || !contentEl) return;

    /**
     * Полный сброс формы и результата к начальному состоянию.
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

      // Снимаем подсветку активных пресетов
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

    /**
     * Простая экранизация HTML, чтобы не ломать разметку,
     * когда мы вставляем куски пользовательского ввода в innerHTML.
     */
    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var headerInput = form.querySelector("input[name='header']");
      var bodyTextarea = form.querySelector("textarea[name='body']");
      var submitBtn = form.querySelector("button[type='submit']");

      var header = (headerInput && headerInput.value ? headerInput.value : "").trim();
      var body = (bodyTextarea && bodyTextarea.value ? bodyTextarea.value : "").trim();

      // Снимаем старую ошибку
      errorEl.style.display = "none";

      // Если оба поля пустые — не симулируем, только ошибка
      if (!header && !body) {
        errorEl.style.display = "block";
        return;
      }

      // Небольшая имитация "отправки"
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      // Простейший анализ, как "сервер" и "браузер" могли бы видеть ответ
      var browserView = "";
      var backendView = "";
      var extraHint = "";

      var headerLower = header.toLowerCase();
      var bodyLower = body.toLowerCase();

      if (headerLower.indexOf("content-length") !== -1 &&
          headerLower.indexOf("transfer-encoding") !== -1) {
        backendView =
          "Бэкенд использует конфликт заголовков Content-Length и Transfer-Encoding " +
          "и может нарезать поток так, что часть следующего ответа станет хвостом текущего.";
        browserView =
          "Браузер ориентируется на одну интерпретацию границ, поэтому принимает " +
          "лишний фрагмент как часть доверенного документа.";
      } else if (headerLower.indexOf("content-length") !== -1) {
        backendView =
          "Сервер строго следует Content-Length и может считать тело завершённым " +
          "раньше или позже, чем это ожидает браузер.";
        browserView =
          "Браузер исходит из целостного документа и не подозревает, что часть " +
          "потока относится к следующему логическому ответу.";
      } else if (headerLower.indexOf("transfer-encoding") !== -1) {
        backendView =
          "Сервер/прокси разбирают поток как chunked и могут по-разному трактовать " +
          "размеры чанков при пограничных значениях.";
        browserView =
          "Браузер закрывает документ по первому корректному завершению chunked-потока, " +
          "оставляя остальное как потенциальный «лишний» хвост.";
      } else {
        backendView =
          "Сервер видит относительно обычный набор заголовков, но при специфическом " +
          "сочетании с телом всё ещё возможна десинхронизация.";
        browserView =
          "Браузер просто рендерит полученный документ и не знает, что сервер " +
          "мог «подмешать» сюда кусок другого ответа.";
      }

      // Доп. подсказка, если в body похоже на HTML/JS
      if (bodyLower.indexOf("<script") !== -1 ||
          bodyLower.indexOf("</html") !== -1 ||
          bodyLower.indexOf("get /") !== -1) {
        extraHint =
          "В теле запроса присутствует фрагмент, который напоминает отдельный HTTP-запрос " +
          "или HTML/JS. В случае успешного Browser Desync именно он мог бы быть " +
          "интерпретирован как лишний самостоятельный документ.";
      }

      // Небольшой превью «опасного» фрагмента
      var payloadPreview;
      if (body) {
        payloadPreview = body.slice(0, 160);
        if (body.length > 160) {
          payloadPreview += "…";
        }
      } else if (header) {
        // Если тело пустое, но заголовки есть — подсветим кусок заголовков
        payloadPreview = header.slice(0, 160);
        if (header.length > 160) {
          payloadPreview += "…";
        }
      } else {
        payloadPreview = "нет данных для анализа";
      }

      var safePayload = escapeHtml(payloadPreview);

      // Собираем HTML результата
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
        "<br><div><strong>Комментарий:</strong> симуляция абстрактная и не " +
        "эмулирует поведение конкретного сервера или браузера. Её цель — " +
        "показать идею рассинхронизации и «лишнего» фрагмента.</div>";

      // Показываем результат, прячем пустой текст
      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = rendered;

      // Возвращаем кнопку в нормальное состояние
      setTimeout(function () {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }, 300);
    });
  })();
});
