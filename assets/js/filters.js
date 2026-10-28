(function () {
  var configs = [
    {
      root: '[data-project-filter-root]',
      item: '[data-project-card]',
      noun: 'project',
      allLabel: 'Showing all projects'
    },
    {
      root: '[data-blog-filter-root]',
      item: '[data-blog-card]',
      noun: 'article',
      allLabel: 'Showing all articles'
    }
  ];

  configs.forEach(function (config) {
    var root = document.querySelector(config.root);
    if (!root) return;

    var scope = root.closest('section') || document;
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter]'));
    var cards = Array.prototype.slice.call(scope.querySelectorAll(config.item));
    var count = root.querySelector('[data-filter-count]');
    var emptyState = scope.querySelector('[data-empty-state]');
    var reset = scope.querySelector('[data-filter-reset]');

    if (!buttons.length || !cards.length) return;

    function labelFor(filter) {
      var button = buttons.filter(function (item) {
        return item.getAttribute('data-filter') === filter;
      })[0];
      return button ? button.textContent.trim() : filter;
    }

    function applyFilter(filter) {
      var visible = 0;

      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.hidden = !match;
        if (match) visible += 1;
      });

      buttons.forEach(function (button) {
        var active = button.getAttribute('data-filter') === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (count) {
        if (filter === 'all') {
          count.textContent = config.allLabel;
        } else {
          count.textContent =
            'Showing ' +
            visible +
            ' ' +
            config.noun +
            (visible === 1 ? '' : 's') +
            ' in ' +
            labelFor(filter);
        }
      }

      if (emptyState) emptyState.hidden = visible !== 0;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyFilter(button.getAttribute('data-filter') || 'all');
      });
    });

    if (reset) {
      reset.addEventListener('click', function () {
        applyFilter('all');
        var all = buttons.filter(function (button) {
          return button.getAttribute('data-filter') === 'all';
        })[0];
        if (all) all.focus();
      });
    }
  });
})();
