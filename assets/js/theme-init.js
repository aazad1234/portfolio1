(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var stored = null;
  try {
    stored = window.localStorage.getItem('theme');
  } catch (error) {
    stored = null;
  }

  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
})();
