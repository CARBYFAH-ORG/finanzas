/* =========================================================
   FINANZAS · Bootstrap principal
   ========================================================= */
APP.boot = function () {
  const ses = APP.Auth.session();
  if (!ses) { APP.Auth.mountLogin(); return; }

  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  APP.Router.register('dashboard',    APP.Views.dashboard);
  APP.Router.register('movimientos',  APP.Views.movimientos);
  APP.Router.register('sueldo',       APP.Views.sueldo);
  APP.Router.register('presupuesto',  APP.Views.presupuesto);
  APP.Router.register('metas',        APP.Views.metas);
  APP.Router.register('categorias',   APP.Views.categorias);
  APP.Router.register('config',       APP.Views.config);

  pintarSidebar();

  document.getElementById('btn-logout').onclick = APP.Auth.logout;

  const sidebar = document.getElementById('sidebar');
  const overlay = crearOverlay();
  document.getElementById('menubtn').onclick = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  };
  overlay.onclick = closeSidebar;
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }

  const u = APP.Auth.user();
  const topUser = document.getElementById('topbar-user');
  if (topUser) topUser.innerHTML = `<span class="dot"></span>${APP.U.esc(u.nombre)}`;

  APP.Router.go('dashboard');
};

function pintarSidebar() {
  const u = APP.Auth.user();
  const items = [
    { v: 'dashboard',   t: 'Dashboard',   ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>' },
    { v: 'movimientos', t: 'Movimientos', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>' },
    { v: 'sueldo',      t: 'Sueldo',      ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
    { v: 'presupuesto', t: 'Presupuesto', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 6 12 12 16 14"/></svg>' },
    { v: 'metas',       t: 'Metas',       ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' }
  ];
  const admin = [
    { v: 'categorias', t: 'Categorías', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 11 4H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>' },
    { v: 'config', t: 'Configuración', ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>' }
  ];

  const nav = document.getElementById('nav');
  let html = '<div class="grp">General</div>';
  items.forEach(i => { html += `<a data-view="${i.v}">${i.ic}<span>${i.t}</span></a>`; });
  html += '<div class="grp">Cuenta</div>';
  admin.forEach(i => { html += `<a data-view="${i.v}">${i.ic}<span>${i.t}</span></a>`; });
  nav.innerHTML = html;

  document.querySelectorAll('.nav a').forEach(a => {
    a.onclick = ev => {
      ev.preventDefault();
      document.getElementById('sidebar').classList.remove('open');
      const ov = document.querySelector('.sidebar-overlay');
      if (ov) ov.classList.remove('show');
      APP.Router.go(a.dataset.view);
    };
  });

  document.getElementById('sf-who').textContent = u.nombre;
  document.getElementById('sf-rol').textContent = 'Administrador';
}

function crearOverlay() {
  let ov = document.querySelector('.sidebar-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'sidebar-overlay';
    document.body.appendChild(ov);
  }
  return ov;
}

document.addEventListener('DOMContentLoaded', function () {
  APP.boot();
});
