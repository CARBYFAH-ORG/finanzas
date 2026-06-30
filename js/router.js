/* =========================================================
   FA-2 ACTIVIDADES · Router
   ========================================================= */
APP.Router = (function(){
  const views = {};
  let current = null;

  function register(name, view){ views[name] = view; }

  async function go(name){
    if (!views[name]) name = 'dashboard';
    current = name;
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.view === name));
    const tit = document.getElementById('topbar-title');
    if (tit) tit.textContent = views[name].title || name;
    const cont = document.getElementById('content');
    cont.innerHTML = '<div class="empty"><div class="spinner" style="color:var(--primary)"></div><p>Cargando…</p></div>';
    try {
      await views[name].render(cont);
    } catch(e) {
      cont.innerHTML = '<div class="empty"><p>Error: '+APP.U.esc(e.message)+'</p></div>';
    }
    // cerrar sidebar móvil
    document.querySelector('.sidebar').classList.remove('open');
  }

  function currentView(){ return current; }
  function refresh(){ if (current) go(current); }

  return { register, go, currentView, refresh };
})();
