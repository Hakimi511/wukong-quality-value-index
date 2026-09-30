(() => {
  const key = "wukong-public-theme-v1";
  const valid = (value) => value === "dark" || value === "light" ? value : "light";
  const apply = (value) => {
    const theme = valid(value);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const button = document.querySelector("#theme-toggle");
    if (button) {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "切换为浅色模式" : "切换为深色模式");
      button.innerHTML = dark ? "&#9788; 浅色" : "&#9790; 深色";
      button.title = dark ? "切换为浅色显示" : "切换为深色显示";
    }
    window.dispatchEvent(new Event("wukongthemechange"));
  };
  const setup = () => {
    try { apply(localStorage.getItem(key)); } catch (_) { apply("light"); }
    document.querySelector("#theme-toggle")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(key, next); } catch (_) { /* session-only preference */ }
      apply(next);
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
