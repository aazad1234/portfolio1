(function () {
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var existingMetas = Array.prototype.slice.call(document.querySelectorAll('meta[name="theme-color"]'));
  var lightMeta = existingMetas.filter(function (meta) {
    return !meta.getAttribute('media');
  })[0];
  var darkMeta = existingMetas.filter(function (meta) {
    return /dark/i.test(meta.getAttribute('media') || '');
  })[0];
  var colors = {
    light: lightMeta ? lightMeta.getAttribute('content') : '#4F46E5',
    dark: darkMeta ? darkMeta.getAttribute('content') : '#0B0B10'
  };

  function storedTheme() {
    try {
      var value = window.localStorage.getItem('theme');
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function updateThemeColor(theme) {
    Array.prototype.slice.call(document.querySelectorAll('meta[name="theme-color"]')).forEach(function (meta) {
      meta.parentNode.removeChild(meta);
    });

    var meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', colors[theme]);
    document.head.appendChild(meta);
  }

  function updateToggle(theme) {
    if (!toggle) return;
    var label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  }

  function applyTheme(theme, persist) {
    var next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;
    updateThemeColor(next);
    updateToggle(next);

    if (persist) {
      try {
        window.localStorage.setItem('theme', next);
      } catch (error) {
        return;
      }
    }
  }

  applyTheme(root.getAttribute('data-theme'), false);

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      toggle.dispatchEvent(new CustomEvent('themechange', { bubbles: true, detail: { theme: next } }));
    });
  }

  if (media) {
    var onSystemChange = function (event) {
      if (storedTheme()) return;
      applyTheme(event.matches ? 'dark' : 'light', false);
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onSystemChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onSystemChange);
    }
  }
})();
