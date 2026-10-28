(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-counter]'));
  var rotator = document.querySelector('[data-rotator]');

  function revealAll() {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealAll();
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  function animateCounter(element) {
    var target = Number(element.getAttribute('data-counter'));
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }

    var duration = 900;
    var started = null;
    element.textContent = '0';

    function tick(timestamp) {
      if (started === null) started = timestamp;
      var progress = Math.min((timestamp - started) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      counters.forEach(function (counter) {
        if (reduceMotion) counter.textContent = counter.getAttribute('data-counter');
      });
    } else {
      var counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(function (counter) {
        counterObserver.observe(counter);
      });
    }
  }

  if (rotator && !reduceMotion) {
    var phrases = (rotator.getAttribute('data-rotator') || '')
      .split('|')
      .map(function (phrase) {
        return phrase.trim();
      })
      .filter(Boolean);

    if (phrases.length > 1) {
      var phraseIndex = 0;
      var characterIndex = rotator.textContent.length;
      var deleting = false;

      var type = function () {
        if (document.hidden) {
          window.setTimeout(type, 600);
          return;
        }

        var phrase = phrases[phraseIndex];

        if (!deleting) {
          characterIndex += 1;
          rotator.textContent = phrase.slice(0, characterIndex);

          if (characterIndex >= phrase.length) {
            deleting = true;
            window.setTimeout(type, 2400);
            return;
          }

          window.setTimeout(type, 48 + Math.random() * 38);
          return;
        }

        characterIndex -= 1;
        rotator.textContent = phrase.slice(0, Math.max(characterIndex, 0));

        if (characterIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          window.setTimeout(type, 320);
          return;
        }

        window.setTimeout(type, 26);
      };

      window.setTimeout(type, 3200);
    }
  }
})();
