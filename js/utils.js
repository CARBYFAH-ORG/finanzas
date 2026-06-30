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
  function confirmar(msg){ return window.confirm(msg); }

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
           toast, loader, openModal, closeModal, confirmar,
           getCategorias, getCuentas, invalidar,
           getBootstrap, invalidarBootstrap, catNombre, catColor };
})();
