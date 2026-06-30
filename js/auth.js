/* =========================================================
   FINANZAS · Autenticación y sesión
   ========================================================= */
APP.Auth = (function () {
  const KEY = 'fin_app_session';

  function session() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; }
  }
  function user() {
    const s = session();
    return s ? s.user : null;
  }
  function setSession(token, user) {
    localStorage.setItem(KEY, JSON.stringify({ token, usuario: user.usuario, user }));
  }
  function logout() {
    localStorage.removeItem(KEY);
    location.reload();
  }

  function mountLogin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    const form = document.getElementById('login-form');
    const err  = document.getElementById('login-err');
    const btn  = document.getElementById('login-btn');

    form.onsubmit = async function (ev) {
      ev.preventDefault();
      err.classList.remove('show');
      const usuario = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      if (!usuario || !password) return;

      const original = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Ingresando…';
      const r = await APP.API.call('login', { usuario, password });
      btn.disabled = false; btn.innerHTML = original;

      if (!r.ok) { err.textContent = r.error || 'Error de acceso'; err.classList.add('show'); return; }
      setSession(r.token, r.user);
      APP.boot();
    };
  }

  return { session, user, setSession, logout, mountLogin };
})();
