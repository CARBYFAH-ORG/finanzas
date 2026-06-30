/* =========================================================
   FINANZAS · Utilidades
   ========================================================= */
APP.U = (function(){
  function fmtFecha(d){
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'});
  }
  function fmtFechaHora(d){
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return '—';
    return dt.toLocaleString('es-HN',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
  }
  function fmtFechaInput(d){
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const pad = n => String(n).padStart(2,'0');
    return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate());
  }
  function fmtMoneda(n){
    n = Number(n)||0;
    const neg = n < 0;
    const v = Math.abs(n).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2});
    return (neg?'-':'')+'L. '+v;
  }
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function toast(msg, type){
    type = type || 'success';
    const cont = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast '+type;
    el.textContent = msg;
    cont.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateX(20px)'; }, 2800);
    setTimeout(()=>el.remove(), 3200);
  }
  function loader(show){
    document.getElementById('fullload').classList.toggle('show', !!show);
  }
  function openModal(html){
    const bg = document.getElementById('modal-bg');
    bg.innerHTML = html;
    bg.classList.add('show');
    bg.onclick = function(ev){ if (ev.target === bg) closeModal(); };
  }
  function closeModal(){
    const bg = document.getElementById('modal-bg');
    bg.classList.remove('show');
    bg.innerHTML = '';
  }
  function confirmar(msg, opts){
    opts = opts || {};
    return new Promise(resolve => {
      const bg = document.getElementById('modal-bg');
      bg.innerHTML = `<div class="modal confirm-modal" onclick="event.stopPropagation()">
        <div class="confirm-icon ${opts.danger?'danger':''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p class="confirm-msg">${esc(msg)}</p>
        <div class="confirm-actions">
          <button class="btn sec" id="confirm-no">Cancelar</button>
          <button class="btn ${opts.danger?'danger':'success'}" id="confirm-yes">${opts.confirmText?esc(opts.confirmText):'Confirmar'}</button>
        </div>
      </div>`;
      bg.classList.add('show');
      const cerrar = (val) => { bg.classList.remove('show'); bg.innerHTML=''; resolve(val); };
      bg.onclick = (ev) => { if (ev.target === bg) cerrar(false); };
      document.getElementById('confirm-no').onclick = () => cerrar(false);
      document.getElementById('confirm-yes').onclick = () => cerrar(true);
    });
  }

  function promptMonto(titulo, opts){
    opts = opts || {};
    return new Promise(resolve => {
      const bg = document.getElementById('modal-bg');
      bg.innerHTML = `<div class="modal confirm-modal" onclick="event.stopPropagation()">
        <p class="confirm-msg" style="margin-bottom:14px">${esc(titulo)}</p>
        <input type="number" step="0.01" min="0.01" id="prompt-monto-input" placeholder="0.00" autofocus style="width:100%;background:var(--soft);border:1px solid var(--border);border-radius:var(--radius-sm);padding:11px 12px;font-size:1rem;text-align:center;margin-bottom:18px">
        <div class="confirm-actions">
          <button class="btn sec" id="prompt-no">Cancelar</button>
          <button class="btn success" id="prompt-yes">${opts.confirmText?esc(opts.confirmText):'Aportar'}</button>
        </div>
      </div>`;
      bg.classList.add('show');
      const input = document.getElementById('prompt-monto-input');
      input.focus();
      const cerrar = (val) => { bg.classList.remove('show'); bg.innerHTML=''; resolve(val); };
      bg.onclick = (ev) => { if (ev.target === bg) cerrar(null); };
      document.getElementById('prompt-no').onclick = () => cerrar(null);
      const enviar = () => {
        const v = Number(input.value);
        if (!v || v <= 0) { input.style.borderColor = 'var(--red)'; return; }
        cerrar(v);
      };
      document.getElementById('prompt-yes').onclick = enviar;
      input.onkeydown = (ev) => { if (ev.key === 'Enter') enviar(); };
    });
  }

  // ---- Bootstrap cacheado: una sola llamada al backend trae
  // categorías, cuentas, config de sueldo, presupuesto y dashboard.
  // Las vistas lo consumen de aquí en vez de pedir cada cosa por separado.
  let bootstrapCache = null;
  let bootstrapPromise = null;

  async function getBootstrap(force){
    if (bootstrapCache && !force) return bootstrapCache;
    if (bootstrapPromise && !force) return bootstrapPromise;
    bootstrapPromise = APP.API.call('bootstrap').then(r => {
      bootstrapPromise = null;
      if (r.ok) bootstrapCache = r;
      return r;
    });
    return bootstrapPromise;
  }
  function invalidarBootstrap(){ bootstrapCache = null; }

  async function getCategorias(force){
    const b = await getBootstrap(force);
    return b.ok ? b.categorias : [];
  }
  async function getCuentas(force){
    const b = await getBootstrap(force);
    return b.ok ? b.cuentas : [];
  }
  function invalidar(k){ invalidarBootstrap(); }

  function catNombre(cod, cats){
    const c = (cats||(bootstrapCache?bootstrapCache.categorias:[])||[]).find(x=>x.codigo===cod);
    return c ? c.nombre : cod;
  }
  function catColor(cod, cats){
    const c = (cats||(bootstrapCache?bootstrapCache.categorias:[])||[]).find(x=>x.codigo===cod);
    return c ? c.color : '#94a3b8';
  }

  return { fmtFecha, fmtFechaHora, fmtFechaInput, fmtMoneda, esc,
           toast, loader, openModal, closeModal, confirmar, promptMonto,
           getCategorias, getCuentas, invalidar,
           getBootstrap, invalidarBootstrap, catNombre, catColor };
})();
