(function () {
  var header = document.querySelector('[data-site-header]');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navPanel = document.querySelector('[data-nav-panel]');
  var backdrop = document.querySelector('[data-nav-backdrop]');
  var toggleLabel = document.querySelector('[data-nav-toggle-label]');
  var mobileQuery = window.matchMedia('(max-width: 1024px)');
  var lastFocused = null;
  var dropdowns = Array.prototype.slice.call(document.querySelectorAll('[data-dropdown-toggle]'));

  if (!header || !navToggle || !navPanel) return;

  function focusableElements() {
    return Array.prototype.slice
      .call(
        header.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (element) {
        return element.getClientRects().length > 0 && !element.hasAttribute('hidden');
      });
  }

  function closeDropdowns(except) {
    document.querySelectorAll('.nav-item-dropdown.is-open').forEach(function (item) {
      if (item === except) return;
      item.classList.remove('is-open');
      var button = item.querySelector('[data-dropdown-toggle]');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  function openNav() {
    lastFocused = document.activeElement;
    document.body.classList.add('nav-open');
    navToggle.setAttribute('aria-expanded', 'true');
    if (toggleLabel) toggleLabel.textContent = 'Close navigation';
    document.querySelectorAll('main, .site-footer').forEach(function (element) {
      element.setAttribute('inert', '');
    });

    window.setTimeout(function () {
      var first = navPanel.querySelector('.nav-link');
      if (first) first.focus();
    }, 120);
  }

  function closeNav(restoreFocus) {
    if (!document.body.classList.contains('nav-open')) return;
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (toggleLabel) toggleLabel.textContent = 'Open navigation';
    closeDropdowns();
    document.querySelectorAll('main, .site-footer').forEach(function (element) {
      element.removeAttribute('inert');
    });

    if (restoreFocus !== false) {
      var target = lastFocused && document.contains(lastFocused) ? lastFocused : navToggle;
      target.focus();
    }
  }

  navToggle.addEventListener('click', function () {
    if (document.body.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', function () {
      closeNav();
    });
  }

  navPanel.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (link && mobileQuery.matches) {
      closeNav(false);
    }
  });

  dropdowns.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      var item = button.closest('.nav-item-dropdown');
      if (!item) return;
      var willOpen = !item.classList.contains('is-open');

      closeDropdowns(item);
      item.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.nav-item-dropdown')) {
      closeDropdowns();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var openDropdown = document.querySelector('.nav-item-dropdown.is-open');
      if (openDropdown) {
        var button = openDropdown.querySelector('[data-dropdown-toggle]');
        closeDropdowns();
        if (button) button.focus();
        return;
      }

      if (document.body.classList.contains('nav-open')) {
        closeNav();
      }
      return;
    }

    if (event.key !== 'Tab' || !document.body.classList.contains('nav-open')) return;

    var items = focusableElements();
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;

    if (event.shiftKey && (active === first || !header.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !header.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  });

  function handleBreakpoint(event) {
    if (!event.matches) {
      closeNav(false);
      closeDropdowns();
    }
  }

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', handleBreakpoint);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(handleBreakpoint);
  }
})();
