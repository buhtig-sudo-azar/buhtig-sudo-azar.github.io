"use strict"; // Включаем строгий режим JS (ловит часть ошибок на этапе выполнения)

$(function () {
  // ----- Универсальная функция плавного скролла к элементу -----
  const scrollToElement = ($el, delta = 50) => {
    // Если элемента нет на странице — ничего не делаем
    if ($el.length === 0) return;

    // Берём координату элемента от верхнего края страницы
    const offset = $el.offset().top;

    // Плавно скроллим документ к нужной позиции
    $("html, body").animate(
      {
        scrollTop: offset - delta // delta — небольшой отступ сверху, чтобы блок не прилипал к самому краю
      },
      700 // длительность анимации в миллисекундах
    );
  };

  // ----- Плавный скролл по клику на ссылки с атрибутом data-scroll -----
  // Пример в HTML: <a data-scroll="#about">О уязвимости</a>
  $("[data-scroll]").on("click", function (event) {
    event.preventDefault(); // Отменяем стандартный переход по ссылке

    const elementId = $(this).data("scroll"); // Берём значение data-scroll, например "#about"
    const $target = $(elementId);             // Находим jQuery-объект по селектору
    const delta = elementId === "#contacts" ? 0 : 50; // Для блока контактов можно не делать отступ

    scrollToElement($target, delta);
  });

  // ----- Burger / Nav Toggle -----
  // Навигация (меню) и кнопка-бургер для мобильной версии
  const $nav = $("#nav");           // <nav id="nav">...</nav>
  const $navToggle = $("#navToggle"); // Кнопка-бургер с id="navToggle"

  $navToggle.on("click", function (event) {
    event.preventDefault();
    // Переключаем класс "show" у навигации.
    // В CSS по этому классу ты можешь показывать/прятать меню.
    $nav.toggleClass("show");
  });

  // ----- Кнопки «К демо» и «Запустить демо» -----
  // Они должны скроллить к секции с id="demo"
  $("#scrollToDemo, #mainGoToDemo").on("click", function (event) {
    event.preventDefault();
    scrollToElement($("#demo"), 50);
  });

  // ----- Обработка демо-формы (симуляция Browser Desync) -----
  // Форма с id="demoForm" и блок результата с id="demoResult"
  $("#demoForm").on("submit", function (event) {
    event.preventDefault(); // Не отправляем форму реально на сервер

    const $form = $(this);

    // Забираем значения полей формы
    const header = $.trim($form.find("input[name='header']").val());    // Поле "Header"
    const body = $.trim($form.find("textarea[name='body']").val());     // Поле "Body"
    const $submitBtn = $form.find(".demo__submit");                     // Кнопка отправки

    // Блок, куда выводим текст симуляции
    const $result = $("#demoResult");
    const $text = $result.find(".demo__result-text");

    // Если оба поля пустые — подсказка пользователю и выходим
    if (!header && !body) {
      $text.text(
        "Заполните хотя бы одно из полей (Header или Body), чтобы запустить симуляцию."
      );
      return;
    }

    // На время обработки блокируем кнопку, чтобы не спамили сабмиты
    $submitBtn.prop("disabled", true);

    let browserView = ""; // Как «видит» ситуацию браузер
    let backendView = ""; // Как «видит» ситуацию бэкенд/прокси
    let extraHint = "";   // Дополнительная подсказка, если payload похож на HTML/JS

    const headerLower = header.toLowerCase();
    const bodyLower = body.toLowerCase();

    // Примитивный анализ заголовков: Content-Length / Transfer-Encoding
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
      // Общий случай — без специфичных заголовков
      browserView =
        "Браузер интерпретирует ответ как обычный документ без явных аномалий.";
      backendView =
        "Но при специфическом сочетании заголовков и тела прокси/сервер могут разбирать поток иначе, создавая почву для Browser Desync.";
    }

    // Если в теле запроса есть HTML/JS — даём дополнительную подсказку
    if (bodyLower.includes("<script") || bodyLower.includes("</html")) {
      extraHint =
        "Вы добавили HTML/JS-фрагмент, который в случае успешного Browser Desync может быть внедрён в ответ страницы.";
    }

    // Небольшой превью полезной нагрузки (обрезаем до 120 символов)
    const payloadPreview = body
      ? body.slice(0, 120) + (body.length > 120 ? "…" : "")
      : "пустое тело запроса";

    // Экранируем payloadPreview, чтобы он не выполнялся как HTML/JS
    const safePayload = $("<div>").text(payloadPreview).html();

    // Собираем HTML для блока результата
    $text.html(
      `
<strong>Браузер:</strong> ${browserView}<br><br>
<strong>Бэкенд / прокси:</strong> ${backendView}<br><br>
<strong>Фрагмент полезной нагрузки:</strong> <code>${safePayload}</code><br><br>
${extraHint ? `<strong>Дополнительно:</strong> ${extraHint}<br><br>` : ""}
<strong>Комментарий:</strong> В реальном тестовом стенде здесь можно визуализировать,
как один и тот же поток байтов по-разному парсится на клиенте и на сервере.
      `
    );

    // Через короткую задержку разблокируем кнопку
    setTimeout(() => {
      $submitBtn.prop("disabled", false);
    }, 400);
  });
});
