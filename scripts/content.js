// Avisamos a la barra lateral nuestra URL actual (funciona porque all_frames: true)
// window.parent es la ventana de sidebar.html
function notifyParent() {
  window.parent.postMessage({ type: 'pedco_url', url: window.location.href }, '*');
}

// Avisamos cuando cargamos
notifyParent();

// Avisamos también si la página actualiza la URL sin recargar (por si usa pushState/replaceState)
const _pushState = history.pushState;
history.pushState = function() {
  _pushState.apply(this, arguments);
  notifyParent();
};
const _replaceState = history.replaceState;
history.replaceState = function() {
  _replaceState.apply(this, arguments);
  notifyParent();
};
window.addEventListener('popstate', notifyParent);

// Escuchamos las órdenes de la barra lateral (Atrás, Adelante, Recargar)
window.addEventListener('message', function(event) {
  if (!event.data || !event.data.action) return;
  if (event.data.action === 'goBack')    window.history.back();
  if (event.data.action === 'goForward') window.history.forward();
  if (event.data.action === 'refresh')   window.location.reload();
});

// Estilos dark mode (funcionalidad original)
chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'toggle_dark_mode') {
    document.body.classList.toggle('pedco-dark');
  } else if (request.action === 'scroll_top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ==========================================
// SCROLL & HOVER DETECTION (Ocultar/Mostrar barra)
// ==========================================
let lastScrollY = 0;
let isAnimating = false;

// Obtiene la posición de scroll actual desde CUALQUIER contenedor activo
function getCurrentScrollY(eventTarget) {
  // 1. Intentar leer del target del evento (lo más preciso)
  if (eventTarget && eventTarget.nodeType === 1 && eventTarget !== document.documentElement) {
    const sy = eventTarget.scrollTop;
    if (sy > 0) return sy;
  }
  // 2. Scroll de window/html nativo
  const winSY = window.scrollY || document.documentElement.scrollTop || 0;
  if (winSY > 0) return winSY;
  // 3. Buscar en candidatos conocidos de Moodle 4
  const moodleCandidates = ['page', 'page-wrapper'];
  for (const id of moodleCandidates) {
    const el = document.getElementById(id);
    if (el && el.scrollTop > 0) return el.scrollTop;
  }
  const drawers = document.querySelector('.drawers');
  if (drawers && drawers.scrollTop > 0) return drawers.scrollTop;
  return 0;
}

function hideBars() {
  if (!isAnimating && !document.body.classList.contains('pedco-hide-bars')) {
    isAnimating = true;
    window.parent.postMessage({ type: 'pedco_scroll', direction: 'down' }, '*');
    document.body.classList.add('pedco-hide-bars');
    setTimeout(() => { isAnimating = false; }, 400);
  }
}

function showBars() {
  if (!isAnimating && document.body.classList.contains('pedco-hide-bars')) {
    isAnimating = true;
    window.parent.postMessage({ type: 'pedco_scroll', direction: 'up' }, '*');
    document.body.classList.remove('pedco-hide-bars');
    setTimeout(() => { isAnimating = false; }, 400);
  }
}

// Listener universal: capture:true en document intercepta scroll de CUALQUIER elemento
document.addEventListener('scroll', (e) => {
  const currentScrollY = getCurrentScrollY(e.target);

  // Botón volver arriba
  const backToTop = document.getElementById('pedco-back-to-top');
  if (backToTop) backToTop.classList.toggle('visible', currentScrollY > 300);

  if (isAnimating) { lastScrollY = currentScrollY; return; }

  const delta = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  // Si estamos en el tope de la página (≤ 20px), las barras DEBEN estar visibles
  if (currentScrollY <= 20) {
    showBars();
    return;
  }

  // Al bajar pasando los 40px → ocultar barras
  if (currentScrollY > 40 && delta > 3) {
    hideBars();
  }
  // Al subir sustancialmente cerca de la parte superior → volver a mostrar
  else if (delta < -25 && currentScrollY < 180) {
    showBars();
  }
}, { capture: true, passive: true });

// Mostrar barras si el mouse toca el borde superior (≤ 30px)
window.addEventListener('mousemove', (e) => {
  if (e.clientY < 30) showBars();
});



// ==========================================
// BOTÓN VOLVER ARRIBA
// ==========================================
function injectBackToTop() {
  if (document.getElementById('pedco-back-to-top')) return;
  const btn = document.createElement('div');
  btn.id = 'pedco-back-to-top';
  btn.title = 'Volver arriba';
  btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
  document.body.appendChild(btn);
  
  btn.addEventListener('click', () => {
    const opts = { top: 0, behavior: 'smooth' };
    // Scroll a todo lo posible porque Moodle 4 usa contenedores internos
    try { window.scrollTo(opts); } catch(e){}
    try { document.documentElement.scrollTo(opts); } catch(e){}
    try { document.body.scrollTo(opts); } catch(e){}
    
    const page = document.getElementById('page');
    if (page) try { page.scrollTo(opts); } catch(e){}
    
    const wrapper = document.getElementById('page-wrapper');
    if (wrapper) try { wrapper.scrollTo(opts); } catch(e){}
    

    
    window.parent.postMessage({ type: 'pedco_scroll', direction: 'up' }, '*');
    document.body.classList.remove('pedco-hide-bars');
  });
}
injectBackToTop();

// ==========================================
// DETECTAR CAMBIOS DE URL POR AJAX Y MANTENER BARRA INYECTADA
// ==========================================
let pedcoLastUrl = window.location.href;

function injectToolbar() {
  if (document.getElementById('pedco-injected-toolbar')) return;
  
  const navbar = document.querySelector('nav.fixed-top');
  if (!navbar) return;
  
  const leftSection = navbar.querySelector('.primary-navigation') || navbar.querySelector('.drawer-toggles') || navbar.firstElementChild;
  if (!leftSection) return;

  const toolbarHtml = `
    <div id="pedco-injected-toolbar">
      <button id="pedco-btn-back" title="Atrás">◀</button>
      <button id="pedco-btn-forward" title="Adelante">▶</button>
      <button id="pedco-btn-refresh" title="Recargar">🔄</button>
      <button id="pedco-btn-home" title="Mis Cursos">🏠</button>
      <button id="pedco-btn-acc" title="Accesibilidad">♿</button>
      <div id="pedco-url-bar">${window.location.href}</div>
    </div>
  `;
  
  leftSection.insertAdjacentHTML('afterend', toolbarHtml);
  
  if (!document.getElementById('pedco-injected-styles')) {
    const style = document.createElement('style');
    style.id = 'pedco-injected-styles';
    style.innerHTML = `
      #pedco-injected-toolbar button:hover { background: #e5e7eb !important; border-color: #9ca3af !important; }
      #pedco-injected-toolbar button:active { background: #d1d5db !important; }
      #pedco-injected-toolbar button:disabled { opacity: 0.35 !important; cursor: default !important; }
    `;
    document.head.appendChild(style);
  }

  document.getElementById('pedco-btn-back').onclick = () => window.parent.postMessage({ type: 'pedco_nav', action: 'back' }, '*');
  document.getElementById('pedco-btn-forward').onclick = () => window.parent.postMessage({ type: 'pedco_nav', action: 'forward' }, '*');
  document.getElementById('pedco-btn-refresh').onclick = () => window.parent.postMessage({ type: 'pedco_nav', action: 'refresh' }, '*');
  document.getElementById('pedco-btn-home').onclick = () => window.parent.postMessage({ type: 'pedco_nav', action: 'home' }, '*');
  document.getElementById('pedco-btn-acc').onclick = () => { if (window.pedcoOpenAccessibility) window.pedcoOpenAccessibility(); };
  
  window.parent.postMessage({ type: 'pedco_injected' }, '*');
}

setInterval(() => {
  injectToolbar();
  injectBackToTop();
  if (window.pedcoInitAccessibility) window.pedcoInitAccessibility();
  
  if (window.location.href !== pedcoLastUrl) {
    pedcoLastUrl = window.location.href;
    window.parent.postMessage({ type: 'pedco_url', url: pedcoLastUrl }, '*');
    
    let injectedUrlBar = document.getElementById('pedco-url-bar');
    if (injectedUrlBar) injectedUrlBar.textContent = pedcoLastUrl;
    
    // Forzar mostrar las barras al cambiar de página
    window.parent.postMessage({ type: 'pedco_scroll', direction: 'up' }, '*');
    document.body.classList.remove('pedco-hide-bars');
  }
}, 500);

// Recibir actualizaciones de estado de botones desde sidebar.js
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'pedco_state') {
    let bb = document.getElementById('pedco-btn-back');
    if (bb) bb.disabled = !e.data.canBack;
    let bf = document.getElementById('pedco-btn-forward');
    if (bf) bf.disabled = !e.data.canForward;
  }
});
