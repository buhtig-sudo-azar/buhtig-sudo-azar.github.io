"use strict";

$(function () {
  // Универсальный плавный скролл к элементу
  const scrollToElement = ($el, delta = 50) => {
    if ($el.length === 0) return;

    const offset = $el.offset().top;

    $("html, body").animate(
      {
        scrollTop: offset - delta
      },
      700
    );
  };

  // Плавный скролл по ссылкам с data-scroll
  $("[data-scroll]").on("click", function (event) {
    event.preventDefault();

    const elementId = $(this).data("scroll");
    const $target = $(elementId);
    const delta = elementId === "#contacts" ? 0 : 50;

    scrollToElement($target, delta);
  });

  // Burger / Nav Toggle
  const $nav = $("#nav");
  const $navToggle = $("#navToggle");

  $navToggle.on("click", function (event) {
    event.preventDefault();
    $nav.toggleClass("show");
  });

  // Кнопки «К демо» и «Запустить демо»
  $("#scrollToDemo, #mainGoToDemo").on("click", function (event) {
    event.preventDefault();
    scrollToElement($("#demo"), 50);
  });

  // Обработка демо-формы (симуляция Browser Desync)
  $("#demoForm").on("submit", function (event) {
    event.preventDefault();

    const $form = $(this);
    const header = $.trim($form.find("input[name='header']").val());
    const body = $.trim($form.find("textarea[name='body']").val());
    const $submitBtn = $form.find(".demo__submit");

    const $result = $("#demoResult");
    const $text = $result.find(".demo__result-text");
    const $error = $("#demoError");

    // Сбрасываем сообщение об ошибке
    $error.hide();

    // Если оба поля пустые — показываем подсказку под формой
    if (!header && !body) {
      $error.show();
      return;
    }

    // Визуально показываем отправку
    const originalBtnText = $submitBtn.text();
    $submitBtn.text("Отправка…").prop("disabled", true);

    let browserView = "";
    let backendView = "";
    let extraHint = "";

    const headerLower = header.toLowerCase();
    const bodyLower = body.toLowerCase();

    if (headerLower.includes("content-length")) {
      browserView =
        "Браузер полагается на вычисленную длину тела ответа и может «отрезать» часть контента.";
      backendView =
        "Бэкенд может принять тело целиком или, наоборот, добавить лишние байты — возникает рассинхрон.";
    } else if (headerLower.includes("transfer-encoding")) {
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

    if (bodyLower.includes("<script") || bodyLower.includes("</html")) {
      extraHint =
        "Вы добавили HTML/JS-фрагмент, который в случае успешного Browser Desync может быть внедрён в ответ страницы.";
    }

    const payloadPreview = body
      ? body.slice(0, 120) + (body.length > 120 ? "…" : "")
      : "пустое тело запроса";

    const safePayload = $("<div>").text(payloadPreview).html();

    $text.html(
      `
<strong>Краткое резюме:</strong><br>
Сервер интерпретировал ответ так: ${backendView}<br>
Браузер интерпретировал ответ так: ${browserView}<br><br>
<strong>Фрагмент полезной нагрузки (потенциальный «лишний» блок):</strong><br>
<code>${safePayload}</code><br><br>
${extraHint ? `<strong>Дополнительно:</strong> ${extraHint}<br><br>` : ""}
<strong>Комментарий:</strong> Это упрощённая текстовая симуляция. В реальном стенде
можно визуально разделить байтовый поток на части «А» (видит сервер) и «Б» (видит браузер).
      `
    );

    setTimeout(() => {
      $submitBtn.text(originalBtnText).prop("disabled", false);
    }, 400);
  });
});
