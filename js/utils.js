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

  const cache = {categorias:null, cuentas:null};
  async function getCategorias(force){
    if (cache.categorias && !force) return cache.categorias;
    const r = await APP.API.call('listar_categorias');
    cache.categorias = r.ok ? r.categorias : [];
    return cache.categorias;
  }
  async function getCuentas(force){
    if (cache.cuentas && !force) return cache.cuentas;
    const r = await APP.API.call('listar_cuentas');
    cache.cuentas = r.ok ? r.cuentas : [];
    return cache.cuentas;
  }
  function invalidar(k){ cache[k] = null; }

  function catNombre(cod, cats){
    const c = (cats||cache.categorias||[]).find(x=>x.codigo===cod);
    return c ? c.nombre : cod;
  }
  function catColor(cod, cats){
    const c = (cats||cache.categorias||[]).find(x=>x.codigo===cod);
    return c ? c.color : '#94a3b8';
  }

  return { fmtFecha, fmtFechaHora, fmtFechaInput, fmtMoneda, esc,
           toast, loader, openModal, closeModal, confirmar,
           getCategorias, getCuentas, invalidar, catNombre, catColor };
})();
