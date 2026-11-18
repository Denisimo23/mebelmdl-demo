(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8 ? '0 8px 24px rgba(22,24,26,.1)' : 'none';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var menu = $('mobileMenu');
  var menuBtn = $('menuBtn');
  var closeBtn = $('menuClose');
  var lastFocus = null;

  function menuItems() {
    if (!menu) return [];
    return Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])'));
  }

  function openMenu() {
    if (!menu || !menuBtn) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    menu.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(restoreFocus) {
    if (!menu || !menuBtn) return;
    menu.classList.remove('open');
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (restoreFocus === false) return;
    var target = lastFocus && lastFocus !== document.body && document.contains(lastFocus) && typeof lastFocus.focus === 'function'
      ? lastFocus
      : menuBtn;
    target.focus();
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });
  if (menu) {
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (!menu || menu.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== 'Tab') return;
    var items = menuItems();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  var state = { type: 'Кухня', rate: 45000, mat: 'ЛДСП', k: 1, len: 3 };
  var fmt = new Intl.NumberFormat('ru-RU');

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  function lengthLabel() {
    return state.len.toFixed(1).replace('.', ',') + ' м';
  }

  function totalPrice() {
    return roundTo(Math.round(state.rate * state.k) * state.len, 1000);
  }

  var sumEl = $('sum');
  var perEl = $('per');
  var typeEl = $('rType');
  var matEl = $('rMat');
  var lenEl = $('rLen');
  var announceEl = $('calcAnnounce');

  function calc(announceResult) {
    if (!sumEl) return;
    var perMeter = Math.round(state.rate * state.k);
    sumEl.textContent = fmt.format(totalPrice()) + ' ₽';
    perEl.textContent = fmt.format(perMeter) + ' ₽ за м.п. · ' + lengthLabel();
    typeEl.textContent = state.type;
    matEl.textContent = state.mat;
    lenEl.textContent = lengthLabel();
    if (announceResult && announceEl) {
      announceEl.textContent = 'Ориентировочная стоимость: ' + fmt.format(totalPrice()) + ' рублей';
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.chips'), function (group) {
    group.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (!chip) return;
      Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (item) {
        item.setAttribute('aria-pressed', String(item === chip));
      });
      if (group.dataset.group === 'type') {
        state.type = chip.dataset.value;
        state.rate = Number(chip.dataset.rate);
      } else {
        state.mat = chip.dataset.value;
        state.k = Number(chip.dataset.k);
      }
      calc(true);
    });
  });

  var lenInput = $('len');
  if (lenInput) {
    lenInput.addEventListener('input', function () {
      state.len = Number(lenInput.value);
      var label = $('lenVal');
      if (label) label.textContent = lengthLabel();
      calc(false);
    });
    lenInput.addEventListener('change', function () { calc(true); });
  }

  var form = $('calcForm');
  if (form) {
    var nameEl = $('mName');
    var phoneEl = $('mPhone');
    var consentEl = $('mConsent');
    var nameErr = $('mNameErr');
    var phoneErr = $('mPhoneErr');
    var consentErr = $('mConsentErr');
    var statusEl = $('calcStatus');
    var fallback = $('waFallback');

    var clean = function (value, max) {
      return String(value)
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
    };

    var resetStatus = function () {
      if (statusEl) statusEl.textContent = '';
      if (fallback) {
        fallback.hidden = true;
        fallback.href = 'https://wa.me/79269058222';
      }
    };

    var clearField = function (field, error) {
      if (error) error.textContent = '';
      if (field) field.removeAttribute('aria-invalid');
    };

    [[nameEl, nameErr], [phoneEl, phoneErr], [consentEl, consentErr]].forEach(function (pair) {
      var field = pair[0];
      var error = pair[1];
      if (!field) return;
      var handler = function () {
        clearField(field, error);
        resetStatus();
      };
      field.addEventListener('input', handler);
      field.addEventListener('change', handler);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearField(nameEl, nameErr);
      clearField(phoneEl, phoneErr);
      clearField(consentEl, consentErr);
      resetStatus();

      var name = clean(nameEl.value, 40);
      var phone = clean(phoneEl.value, 20);
      var digits = phone.replace(/\D/g, '');
      var allowed = /^[0-9+()\-\s]+$/;
      var ok = true;

      if (name.length < 2) {
        nameErr.textContent = 'Напишите имя — хотя бы две буквы';
        nameEl.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (!allowed.test(phone) || digits.length < 10 || digits.length > 15) {
        phoneErr.textContent = 'Только цифры, пробелы, +, скобки и дефис. Нужно 10–15 цифр';
        phoneEl.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (!consentEl.checked) {
        consentErr.textContent = 'Без согласия на обработку данных отправить нельзя';
        consentEl.setAttribute('aria-invalid', 'true');
        ok = false;
      }
      if (!ok) {
        statusEl.textContent = 'Проверьте выделенные поля.';
        return;
      }

      var lines = [
        'Здравствуйте! Пишу с сайта Mebelmdl.',
        'Имя: ' + name,
        'Телефон: ' + phone,
        'Изделие: ' + state.type,
        'Материал: ' + state.mat,
        'Длина: ' + lengthLabel(),
        'Ориентир из калькулятора: ' + fmt.format(totalPrice()) + ' ₽'
      ];
      var url = 'https://wa.me/79269058222?text=' + encodeURIComponent(lines.join('\n'));

      fallback.href = url;
      fallback.hidden = false;
      statusEl.textContent = 'Открываем WhatsApp. Если окно не появилось — нажмите ссылку ниже.';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  calc(false);
  var yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
