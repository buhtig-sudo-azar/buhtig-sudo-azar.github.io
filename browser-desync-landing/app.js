"use strict";

// Ждём загрузки DOM
document.addEventListener("DOMContentLoaded", function () {
  // Универсальный плавный скролл к элементу
  function scrollToElement(el, delta) {
    if (!el) return;
    var rect = el.getBoundingClientRect();
    var offset = window.pageYOffset + rect.top - (delta || 50);
    window.scrollTo({
      top: offset,
      behavior: "smooth"
    });
  }

  // Плавный скролл по data-scroll (и десктоп, и мобильное меню)
  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-scroll]");
    if (!link) return;

    e.preventDefault();
    var targetSelector = link.getAttribute("data-scroll");
    var target = document.querySelector(targetSelector);

    var delta = targetSelector === "#contacts" ? 0 : 50;
    scrollToElement(target, delta);
  });

  // Кнопки «К демо» (шапка) и «Запустить демо» (hero)
  var scrollToDemoBtn = document.getElementById("scrollToDemoBtn");
  var mainToDemo = document.getElementById("mainToDemo");

  if (scrollToDemoBtn) {
    scrollToDemoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var demo = document.getElementById("demo");
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

  // Burger / mobile nav toggle
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

  // Обработка демо‑формы (симуляция Browser Desync)
  (function () {
    var form = document.getElementById("demoForm");
    var errorEl = document.getElementById("demoError");
    var emptyEl = document.getElementById("demoResultEmpty");
    var contentEl = document.getElementById("demoResultContent");
    if (!form || !errorEl || !emptyEl || !contentEl) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var headerInput = form.querySelector("input[name='header']");
      var bodyTextarea = form.querySelector("textarea[name='body']");
      var submitBtn = form.querySelector("button[type='submit']");

      var header = (headerInput && headerInput.value ? headerInput.value : "").trim();
      var body = (bodyTextarea && bodyTextarea.value ? bodyTextarea.value : "").trim();

      // Сбрасываем ошибку
      errorEl.style.display = "none";

      // Если оба поля пустые — показываем подсказку под формой
      if (!header && !body) {
        errorEl.style.display = "block";
        return;
      }

      // Визуально показываем «отправку»
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      var browserView = "";
      var backendView = "";
      var extraHint = "";

      var headerLower = header.toLowerCase();
      var bodyLower = body.toLowerCase();

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

      if (bodyLower.indexOf("<script") !== -1 || bodyLower.indexOf("</html") !== -1) {
        extraHint =
          "Вы добавили HTML/JS-фрагмент, который в случае успешного Browser Desync может быть внедрён в ответ страницы.";
      }

      var payloadPreview;
      if (body) {
        payloadPreview = body.slice(0, 120);
        if (body.length > 120) {
          payloadPreview += "…";
        }
      } else {
        payloadPreview = "пустое тело запроса";
      }

      // Экранируем, чтобы не исполнялся HTML
      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      var safePayload = escapeHtml(payloadPreview);

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

      // Показываем результат в новой карточке
      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = html;

      setTimeout(function () {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }, 400);
    });
  })();
});
