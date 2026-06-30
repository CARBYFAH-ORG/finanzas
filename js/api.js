/* =========================================================
   FINANZAS · API client
   Para cambiar el backend: editar solo API_URL aquí abajo.
   ========================================================= */
window.APP = window.APP || {};

// ▼ Pega aquí la URL de tu deploy de Apps Script cuando lo despliegues ▼
const API_URL = 'https://script.google.com/macros/s/AKfycbzJmzMykP8sIc0l0Hb-MKOGgu6BekZigZv04nOjhSL6I8ieuTsH61Z_LeCppobuBwGI/exec';

APP.API = (function () {
  async function call(action, payload) {
    const body = Object.assign({ action }, payload || {});
    const ses = APP.Auth && APP.Auth.session();
    if (ses) {
      body._ses_usuario = ses.usuario;
      body._ses_token   = ses.token;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow'
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: 'Error de red: ' + e.message };
    }
  }
  return { call };
})();