"use strict";

/**
 * Логика фронтенда для Browser Desync Demo.
 *
 * - плавный скролл по якорям;
 * - бургер и мобильное меню;
 * - кнопка BACK (desktop + mobile) с переходом по BACK_TARGET_URL;
 * - пресеты демо-зоны;
 * - отправка формы и генерация текстового разбора;
 * - сброс формы и результата.
 */

// TODO: сюда я подставлю URL основного интерфейса
const BACK_TARGET_URL = "https://buhtig-sudo-azar.github.io/landings/";

document.addEventListener("DOMContentLoaded", () => {
  /* ========= ПЛАВНЫЙ СКРОЛЛ ========= */

  const scrollToTarget = (selector, offset = 56) => {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-scroll]");
    if (!link) return;

    event.preventDefault();
    const selector = link.getAttribute("data-scroll");
    scrollToTarget(selector);
  });

  const scrollButtons = [
    { id: "scrollToDemoBtn", target: "#demo" },
    { id: "scrollToDemoBtnMobile", target: "#demo" },
    { id: "mainToDemo", target: "#demo" }
  ];

  scrollButtons.forEach((item) => {
    const btn = document.getElementById(item.id);
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTarget(item.target);
    });
  });

  /* ========= БУРГЕР И МОБИЛЬНОЕ МЕНЮ ========= */

  (() => {
    const toggle = document.getElementById("navToggle");
    const mobileNav = document.getElementById("navMobile");
    if (!toggle || !mobileNav) return;

    mobileNav.style.display = "none";

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const visible = mobileNav.style.display === "flex";
      mobileNav.style.display = visible ? "none" : "flex";
    });

    mobileNav.addEventListener("click", (e) => {
      if (e.target.matches(".nav__link")) {
        mobileNav.style.display = "none";
      }
    });
  })();

  /* ========= КНОПКА BACK ========= */

  const goBackToMainApp = () => {
    if (typeof BACK_TARGET_URL === "string" && BACK_TARGET_URL.length > 0) {
      window.location.href = BACK_TARGET_URL;
    }
  };

  const backButtons = ["backBtn", "backBtnMobile"];
  backButtons.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      goBackToMainApp();
    });
  });

  /* ========= ПРЕСЕТЫ ДЕМО-ЗОНЫ ========= */

  const PRESETS = {
    "simple-desync": {
      headers: `X-Debug-Mode: desync
X-Client-ID: demo-user
Content-Length: 48
Transfer-Encoding: chunked`,
      body: `4
test
0

GET /injected HTTP/1.1
Host: vulnerable.example`
    },
    "length-conflict": {
      headers: `Content-Length: 10
X-Desync-Test: length-mismatch`,
      body: `{"ok":true,"padding":"AAAAAA"}`
    },
    "weird-json": {
      headers: `X-Desync-Vector: json-weird
Content-Type: application/json`,
      body: `{"action":"probe","next":"GET /evil HTTP/1.1\\r\\nHost: demo"}`
    }
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const form = document.getElementById("demoForm");
    if (!form) return;

    const headersField = form.querySelector("textarea[name='headers']");
    const bodyField = form.querySelector("textarea[name='body']");
    if (!headersField || !bodyField) return;

    headersField.value = preset.headers;
    bodyField.value = preset.body;

    const errorEl = document.getElementById("demoError");
    const emptyEl = document.getElementById("demoResultEmpty");
    const contentEl = document.getElementById("demoResultContent");

    if (errorEl) errorEl.style.display = "none";
    if (emptyEl && contentEl) {
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";
    }

    document.querySelectorAll(".demo-presets__item").forEach((btn) => {
      btn.classList.remove("demo-presets__item--active");
    });
    const activeBtn = document.querySelector(
      `.demo-presets__item[data-preset="${presetKey}"]`
    );
    if (activeBtn) {
      activeBtn.classList.add("demo-presets__item--active");
    }
  };

  (() => {
    const buttons = document.querySelectorAll(".demo-presets__item");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-preset");
        applyPreset(key);
      });
    });
  })();

  /* ========= ДЕМО-ФОРМА: СИМУЛЯЦИЯ И СБРОС ========= */

  (() => {
    const form = document.getElementById("demoForm");
    const errorEl = document.getElementById("demoError");
    const emptyEl = document.getElementById("demoResultEmpty");
    const contentEl = document.getElementById("demoResultContent");
    const resetBtn = document.getElementById("demoReset");

    if (!form || !errorEl || !emptyEl || !contentEl) return;

    const escapeHtml = (str) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const resetForm = () => {
      const headersField = form.querySelector("textarea[name='headers']");
      const bodyField = form.querySelector("textarea[name='body']");
      if (headersField) headersField.value = "";
      if (bodyField) bodyField.value = "";

      errorEl.style.display = "none";
      emptyEl.style.display = "block";
      contentEl.style.display = "none";
      contentEl.innerHTML = "";

      document.querySelectorAll(".demo-presets__item").forEach((btn) => {
        btn.classList.remove("demo-presets__item--active");
      });
    };

    if (resetBtn) {
      resetBtn.addEventListener("click", () => resetForm());
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const headersField = form.querySelector("textarea[name='headers']");
      const bodyField = form.querySelector("textarea[name='body']");
      const submitBtn = form.querySelector("button[type='submit']");

      const rawHeaders = (headersField?.value || "").trim();
      const rawBody = (bodyField?.value || "").trim();

      errorEl.style.display = "none";

      if (!rawHeaders && !rawBody) {
        errorEl.style.display = "block";
        return;
      }

      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "Отправка…";
      submitBtn.disabled = true;

      const headersLower = rawHeaders.toLowerCase();
      const bodyLower = rawBody.toLowerCase();

      let serverView = "";
      let browserView = "";
      let extraHint = "";

      const clMatch = rawHeaders.match(/content-length:\s*(\d+)/i);
      const declaredLength = clMatch ? parseInt(clMatch[1], 10) : null;
      const bodySize = rawBody.length;
      const hasChunked = /transfer-encoding:\s*chunked/i.test(rawHeaders);
      const hasJson = /content-type:\s*application\/json/i.test(rawHeaders);

      if (declaredLength !== null && hasChunked) {
        serverView =
          "Сервер или прокси видят конфликт между Content-Length и Transfer-Encoding: chunked и могут по-разному выбирать приоритет. Это создаёт окно для рассинхронизации границ тела.";
        browserView =
          "Браузер ориентируется на одну модель потока (часто chunked), поэтому часть данных может оказаться «лишней» и быть воспринятой как начало нового документа.";
      } else if (declaredLength !== null) {
        serverView =
          "Сервер опирается на Content-Length = " +
          declaredLength +
          " и считает тело завершённым после указанного числа байт.";
        if (bodySize > declaredLength) {
          browserView =
            "Фактическое тело длиннее заявленного. Хвост после позиции Content-Length может трактоваться как начало следующего ответа и стать отдельным документом.";
        } else if (bodySize < declaredLength) {
          browserView =
            "Фактическое тело короче заявленного. Браузер/прокси могут ожидать ещё данные, что создаёт возможность подмешивания чужих фрагментов в поток.";
        } else {
          browserView =
            "Длина тела совпадает с Content-Length. Явного конфликта нет, но при нестандартной обработке на промежуточных узлах возможно нетипичное поведение.";
        }
      } else if (hasChunked) {
        serverView =
          "Сервер и прокси интерпретируют тело как chunked-поток и доверяют структуре чанков.";
        browserView =
          "Браузер завершает документ по окончанию chunked-последовательности. Всё, что идёт дальше, может восприниматься как начало нового ответа.";
      } else {
        serverView =
          "Сервер видит тело без явного Content-Length и Transfer-Encoding. Конкретное поведение зависит от стека и настроек таймаутов.";
        browserView =
          "Браузер рендерит то, что получает. Любые расхождения в логике разделения ответов на пути могут привести к появлению «лишнего» документа.";
      }

      if (hasJson || bodyLower.includes("{")) {
        extraHint =
          "Тело похоже на JSON. Если внутри закодированы последовательности вида \"GET /... HTTP/1.1\", они могут использоваться как вложенные HTTP-запросы.";
      }

      if (
        bodyLower.includes("get /") ||
        bodyLower.includes("post /") ||
        bodyLower.includes("<script")
      ) {
        extraHint +=
          (extraHint ? " " : "") +
          "В теле есть фрагменты, похожие на самостоятельный HTTP-запрос или HTML/JS — при успешном десинхроне именно они часто становятся отдельным документом.";
      }

      const payloadSource = rawBody || rawHeaders;
      let payloadPreview = payloadSource.slice(0, 200);
      if (payloadSource.length > 200) {
        payloadPreview += "…";
      }
      if (!payloadSource) {
        payloadPreview = "нет данных для анализа";
      }

      const safePayload = escapeHtml(payloadPreview);

      let html =
        "<div><strong>Серверная интерпретация:</strong><br>" +
        escapeHtml(serverView) +
        "</div><br>" +
        "<div><strong>Браузерная интерпретация:</strong><br>" +
        escapeHtml(browserView) +
        "</div><br>" +
        "<div><strong>Потенциально опасный фрагмент (упрощённо):</strong><br>" +
        '<span class="demo-result__payload">' +
        safePayload +
        "</span></div>";

      if (extraHint) {
        html +=
          '<div class="demo-result__extra"><strong>Дополнительно:</strong> ' +
          escapeHtml(extraHint) +
          "</div>";
      }

      html +=
        "<br><div><strong>Комментарий:</strong> это упрощённая модель. " +
        "Она не эмулирует поведение конкретных серверов, прокси и браузеров, " +
        "а показывает саму идею рассинхронизации границ ответа.</div>";

      emptyEl.style.display = "none";
      contentEl.style.display = "block";
      contentEl.innerHTML = html;

      setTimeout(() => {
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = false;
      }, 350);
    });
  })();
});
