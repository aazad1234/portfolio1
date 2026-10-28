(function () {
  var form = document.querySelector('[data-contact-form]');

  if (!form) return;

  var status = form.querySelector('[data-form-status]');
  var submit = form.querySelector('[data-submit-button]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var copyButton = form.querySelector('[data-copy-email]');
  var copyLabel = form.querySelector('[data-copy-label]');
  var fields = {
    name: form.querySelector('#name'),
    email: form.querySelector('#email'),
    message: form.querySelector('#message')
  };

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('is-error', 'is-success', 'is-info');
    if (message) status.classList.add('is-' + type);
  }

  function clearStatus() {
    if (!status) return;
    status.textContent = '';
    status.classList.remove('is-error', 'is-success', 'is-info');
  }

  function fieldWrap(field) {
    return field ? field.closest('.form-field') : null;
  }

  function errorNode(field) {
    return form.querySelector('[data-error-for="' + field.name + '"]');
  }

  function setError(field, message) {
    var wrap = fieldWrap(field);
    var error = errorNode(field);
    if (wrap) wrap.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  }

  function clearError(field) {
    var wrap = fieldWrap(field);
    var error = errorNode(field);
    if (wrap) wrap.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    if (error) error.textContent = '';
  }

  function validateField(field) {
    if (!field) return true;
    var value = field.value.trim();

    if (field.name === 'name') {
      if (value.length < 2) {
        setError(field, 'Please enter your name (at least 2 characters).');
        return false;
      }
    }

    if (field.name === 'email') {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setError(field, 'Please enter a valid email address.');
        return false;
      }
    }

    if (field.name === 'message') {
      if (value.length < 20) {
        setError(field, 'Please add a little more detail (at least 20 characters).');
        return false;
      }
    }

    clearError(field);
    return true;
  }

  function validateForm() {
    var invalid = [];
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!validateField(field)) invalid.push(field);
    });
    return invalid;
  }

  function mailtoAddress() {
    if (form.dataset.mailto) return form.dataset.mailto.trim();
    var action = form.getAttribute('action') || '';
    return action.replace(/^mailto:/i, '').split('?')[0].trim();
  }

  function selectedSubject() {
    var subject = form.querySelector('#subject');
    if (!subject || !subject.value) return '';
    return subject.options[subject.selectedIndex] ? subject.options[subject.selectedIndex].text.trim() : '';
  }

  function buildMailto() {
    var address = mailtoAddress();
    if (!address) return '';

    var prefix = form.dataset.subjectPrefix || 'Portfolio enquiry';
    var service = selectedSubject();
    var subject = service ? prefix + ' — ' + service : prefix;
    var company = form.querySelector('#company');
    var lines = [
      'Name: ' + (fields.name ? fields.name.value.trim() : ''),
      'Email: ' + (fields.email ? fields.email.value.trim() : '')
    ];

    if (company && company.value.trim()) {
      lines.push('Company: ' + company.value.trim());
    }

    lines.push('Project type: ' + (service || 'Not specified'));
    lines.push('');
    lines.push(fields.message ? fields.message.value.trim() : '');

    return (
      'mailto:' +
      address +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(lines.join('\n'))
    );
  }

  function setSending(sending) {
    if (!submit) return;
    submit.disabled = sending;
    if (submitLabel) submitLabel.textContent = sending ? 'Sending…' : 'Send message';
  }

  async function submitToEndpoint(endpoint) {
    setSending(true);
    setStatus('Sending your message…', 'info');

    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Request failed');

      form.reset();
      Object.keys(fields).forEach(function (key) {
        clearError(fields[key]);
      });
      setStatus('Thanks — your message has been sent. I usually reply within one to two business days.', 'success');
    } catch (error) {
      setStatus(
        'I could not send that automatically. Please email ' +
          (mailtoAddress() || 'me directly') +
          ' and I will reply as soon as I can.',
        'error'
      );
    } finally {
      setSending(false);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var honeypot = form.querySelector('#website');
    var invalid = validateForm();

    if (honeypot && honeypot.value.trim()) {
      setStatus('This message could not be sent. Please email me directly instead.', 'error');
      return;
    }

    if (invalid.length) {
      setStatus('Please fix the highlighted fields and try again.', 'error');
      invalid[0].focus();
      return;
    }

    var endpoint = (form.dataset.endpoint || '').trim();
    if (endpoint) {
      submitToEndpoint(endpoint);
      return;
    }

    var mailto = buildMailto();
    if (!mailto) {
      setStatus('The contact form is not configured yet. Please use the email address listed on this page.', 'error');
      return;
    }

    setStatus(
      'Opening your email app with the message pre-filled. If nothing opens, email ' +
        (mailtoAddress() || 'me') +
        ' directly.',
      'info'
    );
    window.location.href = mailto;
  });

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    if (!field) return;

    field.addEventListener('input', function () {
      if (fieldWrap(field) && fieldWrap(field).classList.contains('is-invalid')) {
        validateField(field);
      }
      if (status && status.classList.contains('is-error')) clearStatus();
    });

    field.addEventListener('blur', function () {
      if (field.value.trim()) validateField(field);
    });
  });

  function fallbackCopy(value) {
    var helper = document.createElement('textarea');
    helper.value = value;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.top = '-1000px';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    helper.remove();
    return copied;
  }

  function updateCopyLabel(text) {
    if (!copyLabel) return;
    copyLabel.textContent = text;
    window.setTimeout(function () {
      copyLabel.textContent = 'Copy email';
    }, 2200);
  }

  if (copyButton) {
    copyButton.addEventListener('click', function () {
      var email = copyButton.getAttribute('data-copy-email') || '';
      if (!email) return;

      function onCopied(copied) {
        updateCopyLabel(copied ? 'Copied!' : 'Copy failed');
        if (copied && !status.textContent) {
          setStatus('Email address copied to clipboard.', 'info');
        }
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            onCopied(true);
          })
          .catch(function () {
            onCopied(fallbackCopy(email));
          });
        return;
      }

      onCopied(fallbackCopy(email));
    });
  }
})();
