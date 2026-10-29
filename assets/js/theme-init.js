(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var stored = null;
  try {
    stored = window.localStorage.getItem('theme');
  } catch (error) {
    stored = null;
  }

  // Default to the white and brown light theme unless explicitly chosen
  var theme = stored === 'light' || stored === 'dark' ? stored : 'light';
  root.setAttribute('data-theme', theme);
})();
