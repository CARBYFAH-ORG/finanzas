/* =========================================================
   FINANZAS · Configuración personal
   ========================================================= */
APP.Views.config = {
  title: 'Configuración',
  render: async function(cont){
    const u = APP.Auth.user();
    cont.innerHTML = `
      <div class="panel">
        <h3>Mi perfil</h3>
        <div class="detalle-grid">
          <div class="dg"><span class="l">Usuario</span><span class="v">${APP.U.esc(u.usuario)}</span></div>
          <div class="dg"><span class="l">Nombre</span><span class="v">${APP.U.esc(u.nombre)}</span></div>
        </div>
      </div>
      <div class="panel">
        <h3>Cambiar contraseña</h3>
        <form autocomplete="off" onsubmit="return false">
        <div class="row2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label>Contraseña actual</label><input type="password" id="cfg-p1" autocomplete="current-password"></div>
          <div><label>Contraseña nueva</label><input type="password" id="cfg-p2" autocomplete="new-password"></div>
        </div>
        </form>
        <button class="btn" id="cfg-pass-save" style="margin-top:14px">Cambiar contraseña</button>
      </div>
      <div class="panel">
        <h3>Backend</h3>
        <p style="font-size:.85rem;color:var(--text-dim);margin-bottom:10px">
          URL del Apps Script conectado. Para cambiarla hay que editar <code class="mono">js/api.js</code> en el repositorio.
        </p>
        <div style="background:var(--soft);border:1px solid var(--border);border-radius:9px;padding:10px 12px;font-family:monospace;font-size:.78rem;color:var(--text-dim);word-break:break-all">${APP.U.esc(API_URL)}</div>
      </div>
    `;
    document.getElementById('cfg-pass-save').onclick = async function(){
      const p1 = document.getElementById('cfg-p1').value;
      const p2 = document.getElementById('cfg-p2').value;
      if (!p1 || !p2) { APP.U.toast('Llena ambos campos','error'); return; }
      const original = this.innerHTML;
      this.disabled = true; this.innerHTML = '<span class="spinner"></span> Cambiando…';
      const r = await APP.API.call('cambiar_password', {password_actual:p1, password_nueva:p2});
      if (!r.ok) { APP.U.toast(r.error,'error'); this.disabled=false; this.innerHTML=original; return; }
      APP.U.toast('Contraseña cambiada, vuelve a entrar','success');
      setTimeout(()=>APP.Auth.logout(), 1500);
    };
  }
};
