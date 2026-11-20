const siteHeader = document.querySelector('header');
function updateHeaderSurface() {
  const scrolled = window.scrollY >= siteHeader.querySelector('.header-top').offsetHeight;
  siteHeader.classList.toggle('is-scrolled', scrolled);
  if (document.body.classList.contains('home-page')) {
    siteHeader.classList.toggle('nav-ready', scrolled);
    document.body.classList.toggle('has-left-top', window.scrollY > 2);
    siteHeader.classList.add('nav-enhanced');
  }
}
window.addEventListener('scroll', updateHeaderSurface, { passive: true });
window.addEventListener('resize', updateHeaderSurface);
window.addEventListener('pageshow', updateHeaderSurface);
updateHeaderSurface();
const languageButton = document.getElementById('language');
const themeButton = document.getElementById('theme');
let language = 'ru';

function readPreference(key, fallback) {
  try { return localStorage.getItem(key) || fallback; }
  catch { return fallback; }
}
function savePreference(key, value) {
  try { localStorage.setItem(key, value); }
  catch { /* Preferences remain usable for this visit. */ }
}
function updateThemeLabel() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  const label = language === 'ru'
    ? (isDark ? 'Включить светлую тему' : 'Включить тёмную тему')
    : (isDark ? 'Switch to light theme' : 'Switch to dark theme');
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
}
function setTheme(value) {
  document.documentElement.dataset.theme = value;
  updateThemeLabel();
  savePreference('portfolio-theme', value);
}

function updateCopyFeedback() {
  document.querySelectorAll('[data-copy]').forEach(button => {
    const address = button.querySelector('.contact-address');
    address.textContent = button.classList.contains('is-copied')
      ? (language === 'ru' ? 'скопировано' : 'copied')
      : button.dataset.copy;
    const action = language === 'ru' ? 'Скопировать' : 'Copy';
    button.setAttribute('aria-label', action + ' ' + button.dataset.copy);
  });
}

function setLanguage(value) {
  language = value;
  document.documentElement.lang = value;
  document.querySelectorAll('[data-ru]').forEach(element => {
    element.innerHTML = element.dataset[value];
  });
  languageButton.textContent = value === 'ru' ? 'EN' : 'RU';
  languageButton.setAttribute('aria-label', value === 'ru' ? 'Switch to English' : 'Переключить на русский');
  document.title = document.querySelector('title').dataset[value] || (value === 'ru' ? 'Никита Тихомиров — продуктовый дизайнер' : 'Nikita Tikhomirov — Product designer');
  updateThemeLabel();
  updateCopyFeedback();
  document.querySelector('header nav').setAttribute('aria-label', value === 'ru' ? 'Навигация' : 'Navigation');
  document.querySelector('.logo').setAttribute('aria-label', value === 'ru' ? 'На главную' : 'Home');
  savePreference('portfolio-language', value);
  updateHeaderSurface();
}
languageButton.addEventListener('click', () => setLanguage(language === 'ru' ? 'en' : 'ru'));
themeButton.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
setLanguage(readPreference('portfolio-language', 'ru') === 'en' ? 'en' : 'ru');
setTheme(readPreference('portfolio-theme', 'dark') === 'light' ? 'light' : 'dark');
const copyStatus = document.getElementById('copy-status');

async function copyContact(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); }
    catch { copied = false; }
    field.remove();
    return copied;
  }
}
document.querySelectorAll('[data-copy]').forEach(button => {

  let resetTimer;
  button.addEventListener('click', async () => {
    const address = button.querySelector('.contact-address');
    if (!button.classList.contains('is-copied')) address.style.minWidth = address.getBoundingClientRect().width + 'px';
    button.disabled = true;
    const copied = await copyContact(button.dataset.copy);
    button.disabled = false;
    button.focus({ preventScroll: true });
    clearTimeout(resetTimer);
    button.classList.toggle('copy-failed', !copied);
    button.classList.toggle('is-copied', copied);
    updateCopyFeedback();
    button.title = copied
      ? (language === 'ru' ? 'скопировано' : 'copied')
      : (language === 'ru' ? 'Не удалось скопировать. Попробуйте ещё раз.' : 'Could not copy. Please try again.');
    copyStatus.textContent = button.title;
    resetTimer = setTimeout(() => {
      button.classList.remove('copy-failed');
      button.classList.remove('is-copied');
      updateCopyFeedback();
      address.style.minWidth = '';
      button.removeAttribute('title');
      copyStatus.textContent = '';
    }, 2200);
  });
});
// Arm offscreen content before it enters the viewport.
const revealTargets = document.querySelectorAll(
  '#work > .section-head, .project, .about, .profile-section, .contact'
);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;
let revealGeneration = 0;

function configureScrollReveal() {
  revealObserver?.disconnect();
  const generation = ++revealGeneration;
  revealTargets.forEach(element => element.classList.remove('scroll-reveal', 'is-revealed'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  revealTargets.forEach(element => {
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add('scroll-reveal');
    }
  });
  revealObserver = new IntersectionObserver(entries => {
    if (generation !== revealGeneration) return;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      } else if (entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? window.innerHeight)) {
        entry.target.classList.remove('is-revealed');
        entry.target.classList.add('scroll-reveal');
      }
    });
  });
  revealTargets.forEach(element => revealObserver.observe(element));
}
configureScrollReveal();
reducedMotion.addEventListener('change', configureScrollReveal);
window.addEventListener('pageshow', event => {
  if (event.persisted) configureScrollReveal();
});
// Smooth wheel input while leaving touch, keyboard and browser zoom native.
let scrollFrame = 0;
let scrollTarget = window.scrollY;
let previousScrollTime = 0;

function stopSmoothScroll() {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  previousScrollTime = 0;
  scrollTarget = window.scrollY;
}

function animateWheelScroll(time) {
  const elapsed = previousScrollTime ? Math.min(time - previousScrollTime, 50) : 16;
  previousScrollTime = time;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  scrollTarget = Math.max(0, Math.min(scrollTarget, maximum));
  const distance = scrollTarget - window.scrollY;
  if (Math.abs(distance) < 0.5) {
    window.scrollTo({ top: scrollTarget, behavior: 'instant' });
    stopSmoothScroll();
    return;
  }
  const easing = 1 - Math.exp(-elapsed / 85);
  window.scrollTo({ top: window.scrollY + distance * easing, behavior: 'instant' });
  scrollFrame = requestAnimationFrame(animateWheelScroll);
}

window.addEventListener('wheel', event => {
  if (event.defaultPrevented || !event.cancelable || reducedMotion.matches ||
      event.ctrlKey || event.metaKey || event.shiftKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

  // Preserve scrolling inside any independently scrollable control or panel.
  let element = event.target instanceof Element ? event.target : null;
  while (element && element !== document.body) {
    const overflow = getComputedStyle(element).overflowY;
    if (element.scrollHeight > element.clientHeight && /auto|scroll/.test(overflow)) return;
    element = element.parentElement;
  }

  const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1;
  const delta = event.deltaY * unit;
  if (!delta) return;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (!scrollFrame) scrollTarget = window.scrollY;
  // Reverse direction immediately rather than completing the previous movement.
  if ((scrollTarget - window.scrollY) * delta < 0) scrollTarget = window.scrollY;
  const nextTarget = Math.max(0, Math.min(scrollTarget + delta, maximum));
  if (nextTarget === window.scrollY && !scrollFrame) return;
  event.preventDefault();
  scrollTarget = nextTarget;
  if (!scrollFrame) scrollFrame = requestAnimationFrame(animateWheelScroll);
}, { passive: false });

window.addEventListener('pointerdown', stopSmoothScroll, { passive: true });
window.addEventListener('touchstart', stopSmoothScroll, { passive: true });
window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
    stopSmoothScroll();
  }
});
window.addEventListener('resize', stopSmoothScroll);
window.addEventListener('pagehide', stopSmoothScroll);
reducedMotion.addEventListener('change', stopSmoothScroll);