(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var preloader = document.querySelector('[data-preloader]');
  var progressWrap = document.querySelector('[data-scroll-progress]');
  var progressBar = progressWrap ? progressWrap.querySelector('span') : null;
  var backToTop = document.querySelector('[data-back-to-top]');
  var printButton = document.querySelector('[data-print]');
  var shareButton = document.querySelector('[data-share-button]');
  var shareLabel = shareButton ? shareButton.querySelector('[data-share-label]') : null;
  var shareStatus = document.querySelector('[data-share-status]');

  function hidePreloader() {
    if (!preloader || preloader.classList.contains('is-done')) return;
    preloader.classList.add('is-done');
    window.setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 350);
  }

  if (preloader) {
    if (document.readyState === 'complete') {
      window.setTimeout(hidePreloader, 250);
    } else {
      window.addEventListener('load', function () {
        window.setTimeout(hidePreloader, 250);
      });
      window.setTimeout(hidePreloader, 2200);
    }
  }

  function updateProgress() {
    if (!progressBar) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressBar.style.transform = 'scaleX(' + progress + ')';

    var header = document.querySelector('[data-site-header]');
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    }

    if (backToTop) {
      if (window.scrollY > 600) {
        backToTop.hidden = false;
      } else {
        backToTop.hidden = true;
      }
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateProgress();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateProgress();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(function (year) {
    year.textContent = String(new Date().getFullYear());
  });

  if (printButton) {
    printButton.addEventListener('click', function () {
      window.print();
    });
  }

  function fallbackCopy(value) {
    var field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-1000px';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    field.remove();
    return copied;
  }

  function updateShareState(message, label) {
    if (shareStatus) shareStatus.textContent = message;
    if (shareLabel) {
      shareLabel.textContent = label;
      window.setTimeout(function () {
        shareLabel.textContent = 'Share this article';
      }, 2600);
    }
  }

  function sharePage() {
    var data = {
      title: document.title,
      text: document.title,
      url: window.location.href
    };

    if (navigator.share) {
      navigator
        .share(data)
        .then(function () {
          updateShareState('Article shared.', 'Shared');
        })
        .catch(function (error) {
          if (error && error.name === 'AbortError') return;
          copyShareLink();
        });
      return;
    }

    copyShareLink();
  }

  function copyShareLink() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(function () {
          updateShareState('Link copied to clipboard.', 'Copied');
        })
        .catch(function () {
          var copied = fallbackCopy(window.location.href);
          updateShareState(
            copied ? 'Link copied to clipboard.' : 'Copy the URL from your address bar to share.',
            copied ? 'Copied' : 'Copy manually'
          );
        });
      return;
    }

    var copied = fallbackCopy(window.location.href);
    updateShareState(
      copied ? 'Link copied to clipboard.' : 'Copy the URL from your address bar to share.',
      copied ? 'Copied' : 'Copy manually'
    );
  }

  if (shareButton) {
    shareButton.addEventListener('click', sharePage);
  }
})();
