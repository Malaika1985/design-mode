/**
 * Design Mode overlay
 * -------------------
 * Click the palette button (bottom right) to arm design mode:
 *   - hover  -> element is highlighted
 *   - click  -> a comment box opens ("What should change here?")
 *   - Enter  -> comment + element info are appended to design-comments.md
 *   - Esc    -> leave design mode
 *
 * Comments are posted to a local endpoint:
 *   1. same-origin  /__design-mode/comment   (Nuxt module / Vite plugin)
 *   2. fallback     http://127.0.0.1:4939/comment   (standalone collector)
 *
 * Configuration is injected by the server as `window.__DESIGN_MODE__`.
 * This file is plain ES5-ish browser JS on purpose: it is served verbatim,
 * never bundled, and must run in whatever the dev server is showing.
 */
(function () {
  'use strict';
  if (window.__designModeLoaded) return;
  window.__designModeLoaded = true;

  var CONFIG = window.__DESIGN_MODE__ || {};
  var SAME_ORIGIN = CONFIG.endpoint || '/__design-mode/comment';
  var COLLECTOR = CONFIG.collector || 'http://127.0.0.1:4939/comment';

  /* -- i18n ------------------------------------------------ */
  var STRINGS = {
    en: {
      toggle: 'Design mode (click an element and comment on it)',
      placeholder: 'What should change here?',
      cancel: 'Cancel',
      save: 'Save',
      saved: 'Comment saved - run /design in Claude Code',
      failed: 'No receiver reachable (see design-mode README)',
    },
    de: {
      toggle: 'Design-Mode (Element anklicken & kommentieren)',
      placeholder: 'Was soll hier geaendert werden?',
      cancel: 'Abbrechen',
      save: 'Speichern',
      saved: 'Kommentar gespeichert - in Claude Code /design ausfuehren',
      failed: 'Kein Empfaenger erreichbar (siehe design-mode README)',
    },
  };

  var lang = CONFIG.lang || 'en';
  if (lang === 'auto') {
    lang = (navigator.language || 'en').toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }
  var t = STRINGS[lang] || STRINGS.en;

  var active = false;
  var hoverEl = null;
  var savedCount = 0;

  /* -- Styles ---------------------------------------------- */
  var style = document.createElement('style');
  style.textContent = [
    '#__dm-toggle{position:fixed;bottom:16px;right:16px;z-index:2147483646;',
    'width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;',
    'background:#1e1e2e;color:#fff;font-size:20px;line-height:44px;text-align:center;',
    'box-shadow:0 2px 10px rgba(0,0,0,.35);transition:transform .15s;}',
    '#__dm-toggle:hover{transform:scale(1.08);}',
    '#__dm-toggle.__dm-on{background:#7c3aed;outline:3px solid rgba(124,58,237,.35);}',
    '#__dm-badge{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;',
    'border-radius:9px;font-size:11px;min-width:18px;height:18px;line-height:18px;',
    'padding:0 4px;display:none;font-family:system-ui,sans-serif;}',
    '#__dm-hl{position:fixed;z-index:2147483644;pointer-events:none;display:none;',
    'border:2px solid #7c3aed;background:rgba(124,58,237,.12);border-radius:3px;}',
    '#__dm-tag{position:fixed;z-index:2147483645;pointer-events:none;display:none;',
    'background:#7c3aed;color:#fff;font:11px/1.6 ui-monospace,monospace;',
    'padding:1px 7px;border-radius:3px;white-space:nowrap;}',
    '#__dm-panel{position:fixed;z-index:2147483647;display:none;width:320px;',
    'background:#1e1e2e;color:#e4e4ef;border-radius:10px;padding:12px;',
    'box-shadow:0 8px 30px rgba(0,0,0,.45);font:13px system-ui,sans-serif;}',
    '#__dm-panel .__dm-sel{font:11px ui-monospace,monospace;color:#a78bfa;',
    'margin-bottom:8px;word-break:break-all;}',
    '#__dm-panel textarea{width:100%;box-sizing:border-box;height:70px;resize:vertical;',
    'background:#2a2a3c;color:#fff;border:1px solid #44445a;border-radius:6px;',
    'padding:8px;font:13px system-ui,sans-serif;outline:none;}',
    '#__dm-panel textarea:focus{border-color:#7c3aed;}',
    '#__dm-panel .__dm-row{display:flex;gap:8px;margin-top:8px;justify-content:flex-end;}',
    '#__dm-panel button{border:none;border-radius:6px;padding:6px 14px;cursor:pointer;',
    'font:600 12px system-ui,sans-serif;}',
    '#__dm-save{background:#7c3aed;color:#fff;}',
    '#__dm-cancel{background:#3a3a4e;color:#ccc;}',
    '#__dm-toast{position:fixed;bottom:70px;right:16px;z-index:2147483647;display:none;',
    'background:#16a34a;color:#fff;padding:8px 14px;border-radius:8px;',
    'font:12px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3);}',
  ].join('');
  document.head.appendChild(style);

  /* -- DOM ------------------------------------------------- */
  var btn = document.createElement('button');
  btn.id = '__dm-toggle';
  btn.type = 'button';
  btn.title = t.toggle;
  btn.setAttribute('aria-label', t.toggle);
  btn.textContent = '🎨'; // palette emoji

  var badge = document.createElement('span');
  badge.id = '__dm-badge';
  btn.appendChild(badge);

  var hl = document.createElement('div');
  hl.id = '__dm-hl';
  var tag = document.createElement('div');
  tag.id = '__dm-tag';
  var toast = document.createElement('div');
  toast.id = '__dm-toast';

  var panel = document.createElement('div');
  panel.id = '__dm-panel';

  var selLabel = document.createElement('div');
  selLabel.className = '__dm-sel';

  var ta = document.createElement('textarea');
  ta.placeholder = t.placeholder;

  var row = document.createElement('div');
  row.className = '__dm-row';
  var cancelBtn = document.createElement('button');
  cancelBtn.id = '__dm-cancel';
  cancelBtn.type = 'button';
  cancelBtn.textContent = t.cancel;
  var saveBtn = document.createElement('button');
  saveBtn.id = '__dm-save';
  saveBtn.type = 'button';
  saveBtn.textContent = t.save;
  row.append(cancelBtn, saveBtn);
  panel.append(selLabel, ta, row);

  document.body.append(btn, hl, tag, toast, panel);

  var pendingTarget = null;

  /* -- Helpers --------------------------------------------- */
  function isOwn(el) {
    return !!(el && (el.closest('#__dm-panel') || el.closest('#__dm-toggle')));
  }

  function cssPath(el) {
    var parts = [];
    while (el && el.nodeType === 1 && parts.length < 6) {
      var p = el.tagName.toLowerCase();
      if (el.id) {
        parts.unshift(p + '#' + el.id);
        break;
      }
      var cls = [].slice.call(el.classList).filter(function (c) {
        return c.indexOf('__dm') !== 0;
      }).slice(0, 2);
      if (cls.length) p += '.' + cls.join('.');
      var parent = el.parentElement;
      if (parent) {
        var same = [].slice.call(parent.children).filter(function (c) {
          return c.tagName === el.tagName;
        });
        if (same.length > 1) p += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
      }
      parts.unshift(p);
      el = parent;
    }
    return parts.join(' > ');
  }

  var IGNORED_COMPONENTS = [
    'Anonymous', 'AsyncComponentWrapper', 'nuxt-root', 'NuxtRoot',
    'NuxtPage', 'NuxtLayout', 'RouterView',
  ];

  /**
   * Best effort component info from Vue (preferred) or React (fallback).
   * Vue 3 exposes the source file as `__file` in dev builds - that is the
   * single most valuable hint we can hand to the coding agent.
   */
  function componentInfo(el) {
    var info = { names: [], file: null };
    try {
      var node = el;
      while (node && !node.__vueParentComponent) node = node.parentElement;
      if (node) {
        var inst = node.__vueParentComponent;
        while (inst && info.names.length < 4) {
          var type = inst.type || {};
          var name = type.__name || type.name;
          var file = type.__file;
          if (name && info.names.indexOf(name) === -1 && IGNORED_COMPONENTS.indexOf(name) === -1) {
            info.names.push(name);
          }
          if (!info.file && file && !/node_modules/.test(file)) info.file = file;
          inst = inst.parent;
        }
        if (info.names.length || info.file) return info;
      }

      var key = Object.keys(el).find(function (k) {
        return k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0;
      });
      if (key) {
        var fiber = el[key];
        while (fiber && info.names.length < 4) {
          var ft = fiber.type;
          var fname = ft && (ft.displayName || ft.name);
          if (fname && /^[A-Z]/.test(fname) && info.names.indexOf(fname) === -1) {
            info.names.push(fname);
          }
          if (!info.file && fiber._debugSource && fiber._debugSource.fileName) {
            info.file = fiber._debugSource.fileName;
          }
          fiber = fiber.return;
        }
      }
    } catch (e) {
      /* best effort only */
    }
    return info;
  }

  var toastTimer = null;
  function showToast(msg, ok) {
    toast.textContent = msg;
    toast.style.background = ok === false ? '#dc2626' : '#16a34a';
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.style.display = 'none';
    }, 2600);
  }

  function send(payload) {
    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    return fetch(SAME_ORIGIN, opts)
      .then(function (r) {
        if (r.ok) return true;
        throw new Error('same-origin endpoint returned ' + r.status);
      })
      .catch(function () {
        return fetch(COLLECTOR, opts)
          .then(function (r) {
            return r.ok;
          })
          .catch(function () {
            return false;
          });
      });
  }

  /* -- Mode on/off ----------------------------------------- */
  function setActive(on) {
    active = on;
    btn.classList.toggle('__dm-on', on);
    document.body.style.cursor = on ? 'crosshair' : '';
    if (!on) {
      hl.style.display = 'none';
      tag.style.display = 'none';
      panel.style.display = 'none';
    }
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setActive(!active);
  });

  /* -- Hover highlight ------------------------------------- */
  document.addEventListener(
    'mousemove',
    function (e) {
      if (!active || panel.style.display === 'block') return;
      var el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isOwn(el)) {
        hl.style.display = 'none';
        tag.style.display = 'none';
        return;
      }
      hoverEl = el;
      var r = el.getBoundingClientRect();
      Object.assign(hl.style, {
        display: 'block',
        left: r.left + 'px',
        top: r.top + 'px',
        width: r.width + 'px',
        height: r.height + 'px',
      });
      var ci = componentInfo(el);
      var last = cssPath(el).split(' > ').pop();
      tag.textContent = (ci.names[0] ? '<' + ci.names[0] + '> ' : '') + last;
      Object.assign(tag.style, {
        display: 'block',
        left: Math.max(4, r.left) + 'px',
        top: Math.max(4, r.top - 22) + 'px',
      });
    },
    true
  );

  /* -- Click -> comment panel ------------------------------ */
  document.addEventListener(
    'click',
    function (e) {
      if (!active || isOwn(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      if (panel.style.display === 'block') return; // close the open panel first
      pendingTarget = hoverEl || e.target;

      var ci = componentInfo(pendingTarget);
      var prefix = ci.names.length
        ? ci.names
            .map(function (c) {
              return '<' + c + '>';
            })
            .join(' <- ') + '  -  '
        : '';
      selLabel.textContent = prefix + cssPath(pendingTarget);

      var x = Math.max(8, Math.min(e.clientX, window.innerWidth - 340));
      var y = Math.max(8, Math.min(e.clientY + 12, window.innerHeight - 190));
      Object.assign(panel.style, { display: 'block', left: x + 'px', top: y + 'px' });
      ta.value = '';
      setTimeout(function () {
        ta.focus();
      }, 0);
    },
    true
  );

  /* -- Save / cancel --------------------------------------- */
  function save() {
    var comment = ta.value.trim();
    if (!comment || !pendingTarget) return;
    var el = pendingTarget;
    var ci = componentInfo(el);
    var payload = {
      comment: comment,
      url: location.pathname + location.search,
      selector: cssPath(el),
      components: ci.names,
      sourceFile: ci.file,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: [].slice.call(el.classList).filter(function (c) {
        return c.indexOf('__dm') !== 0;
      }),
      text: (el.innerText || '').trim().slice(0, 120) || null,
      html: el.outerHTML.slice(0, 300),
      time: new Date().toISOString(),
    };
    panel.style.display = 'none';
    send(payload).then(function (ok) {
      if (!ok) return showToast(t.failed, false);
      savedCount++;
      badge.textContent = String(savedCount);
      badge.style.display = 'block';
      showToast(t.saved);
    });
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', function () {
    panel.style.display = 'none';
  });

  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') panel.style.display = 'none';
    e.stopPropagation();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) setActive(false);
  });
})();
