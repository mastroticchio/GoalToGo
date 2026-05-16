/* GoalToGo - auth_guard.js
 * Modulo client di guardia sessione + iniezione menu profilo.
 * Da includere in <head> di OGNI pagina protetta.
 *
 * La pagina deve impostare PRIMA dell'inclusione di questo script:
 *   window.__AUTH_REQUIRES__ = { role: 'giocatore' | 'gestore' };
 * oppure, per pagine pubbliche (login/signup) che devono spingere
 * fuori l'utente gia' autenticato:
 *   window.__AUTH_REQUIRES__ = { inverseGuard: true };
 */
(function () {
  'use strict';

  var TARGET_LOGIN  = 'pagina_accedi.html';
  var TARGET_PLAYER = 'home_page.html';
  var TARGET_OWNER  = 'pagina_campi_gestore.html';

  var requires = window.__AUTH_REQUIRES__ || {};
  var inverse = requires.inverseGuard === true; // for login/signup pages: redirect AWAY if already logged

  // ===== Step 1 - synchronous client guard from localStorage =====
  var idUtente   = localStorage.getItem('idUtente');
  var tipoUtente = localStorage.getItem('tipoUtente');

  if (inverse) {
    // pubblica: se gia' loggato, vai alla home corretta
    if (idUtente && tipoUtente) {
      location.replace(tipoUtente === 'gestore' ? TARGET_OWNER : TARGET_PLAYER);
      return;
    }
    // non loggato: prosegui col rendering della login/signup
  } else {
    if (!idUtente || !tipoUtente) {
      location.replace(TARGET_LOGIN);
      return;
    }
    if (requires.role && requires.role !== tipoUtente) {
      location.replace(tipoUtente === 'gestore' ? TARGET_OWNER : TARGET_PLAYER);
      return;
    }
  }

  // ===== Step 2 - async server-side session check =====
  // Done after page is interactive so we don't block first paint.
  function verifyServerSession() {
    fetch('/GoalToGo/api/api_me.php', { credentials: 'include' })
      .then(function (res) {
        if (!res.ok) {
          // session expired or never created
          localStorage.clear();
          if (!inverse) location.replace(TARGET_LOGIN);
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'success') return;
        // sync any drift between server truth and localStorage
        if (data.user) {
          localStorage.setItem('idUtente',   data.user.id);
          localStorage.setItem('tipoUtente', data.user.tipo);
          localStorage.setItem('nomeUtente', data.user.nome || '');
        }
      })
      .catch(function () { /* network blip - keep showing the page, user can retry */ });
  }

  // ===== Step 3 - inject the profile dropdown menu (one-shot, after DOM ready) =====
  function injectProfileMenu() {
    if (inverse) return;            // login/signup pages: no menu
    if (document.querySelector('.profile-menu')) return;
    var icon = document.querySelector('.profile-icon');
    if (!icon) return;

    var nome = localStorage.getItem('nomeUtente') || '';
    var menu = document.createElement('div');
    menu.className = 'profile-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Menu profilo');
    menu.innerHTML =
      '<div class="profile-menu__head">' +
        (nome ? ('Ciao, ' + nome.replace(/[<>]/g, '')) : 'Profilo') +
      '</div>' +
      '<div class="profile-menu__divider"></div>' +
      '<button type="button" class="profile-menu__item" role="menuitem" data-action="profile">Il mio profilo</button>' +
      '<button type="button" class="profile-menu__item" role="menuitem" data-action="logout">Esci</button>';
    document.body.appendChild(menu);

    function close() { menu.removeAttribute('data-open'); icon.setAttribute('aria-expanded', 'false'); }
    function open()  { menu.setAttribute('data-open', 'true'); icon.setAttribute('aria-expanded', 'true'); }

    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('aria-haspopup', 'menu');
    icon.setAttribute('aria-expanded', 'false');
    icon.setAttribute('aria-label', 'Apri menu profilo');

    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.hasAttribute('data-open')) {
        close();
      } else {
        open();
      }
    });
    icon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); icon.click(); }
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== icon) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      close();
      if (action === 'logout' && typeof window.logout === 'function') {
        window.logout();
      } else if (action === 'profile') {
        // Naviga alla pagina profilo corretta in base al tipo utente
        var tipo = localStorage.getItem('tipoUtente');
        window.location.href = tipo === 'gestore' ? 'pagina_profilo_gestore.html' : 'pagina_profilo.html';
      }
    });
  }

  // ===== Boot order =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectProfileMenu();
      verifyServerSession();
    });
  } else {
    injectProfileMenu();
    verifyServerSession();
  }
})();
