/* =========================================================
   FINANZAS · API client
   Para cambiar el backend: editar solo API_URL aquí abajo.
   ========================================================= */
window.APP = window.APP || {};

// ▼ Pega aquí la URL de tu deploy de Apps Script cuando lo despliegues ▼
const API_URL = 'https://script.google.com/macros/s/AKfycbwvgTwPMf4UpVLRvOjusoYIcy5OSdYcrXoDc7EVT2pMx68xFO7IQTmkT8UXClctJnfc/exec';

APP.API = (function () {
  async function _attempt(action, body) {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // Apps Script a veces responde con una página HTML de error
      // (404/500) en vez de JSON cuando hay varias peticiones casi
      // simultáneas. Se trata como falla transitoria reintentable.
      throw new Error('respuesta_no_json');
    }
  }

  async function call(action, payload) {
    const body = Object.assign({ action }, payload || {});
    const ses = APP.Auth && APP.Auth.session();
    if (ses) {
      body._ses_usuario = ses.usuario;
      body._ses_token   = ses.token;
    }
    for (let intento = 1; intento <= 3; intento++) {
      try {
        return await _attempt(action, body);
      } catch (e) {
        if (e.message === 'respuesta_no_json' && intento < 3) {
          await new Promise(r => setTimeout(r, 400 * intento));
          continue;
        }
        return { ok: false, error: e.message === 'respuesta_no_json'
          ? 'El servidor no respondió correctamente, intenta de nuevo'
          : 'Error de red: ' + e.message };
      }
    }
  }
  return { call };
})();
