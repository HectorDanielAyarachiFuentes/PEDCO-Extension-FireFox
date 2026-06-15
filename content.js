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
let isAnimating = false; // Bloqueo para evitar bucle infinito

// Mostrar barras si el mouse toca el borde superior de la pantalla
window.addEventListener('mousemove', (e) => {
  if (e.clientY < 30 && document.body.classList.contains('pedco-hide-bars')) {
    isAnimating = true;
    window.parent.postMessage({ type: 'pedco_scroll', direction: 'up' }, '*');
    document.body.classList.remove('pedco-hide-bars');
    setTimeout(() => { isAnimating = false; }, 400);
  }
});

window.addEventListener('scroll', (e) => {
  if (isAnimating) return;

  let currentScrollY = window.scrollY || document.documentElement.scrollTop;
  if (currentScrollY === 0 && e.target && e.target.scrollTop !== undefined) {
    currentScrollY = e.target.scrollTop;
  }
  
  if (Math.abs(currentScrollY - lastScrollY) > 5) {
    if (currentScrollY > 60 && currentScrollY > lastScrollY) {
      if (!document.body.classList.contains('pedco-hide-bars')) {
        isAnimating = true;
        window.parent.postMessage({ type: 'pedco_scroll', direction: 'down' }, '*');
        document.body.classList.add('pedco-hide-bars');
        setTimeout(() => { isAnimating = false; }, 400);
      }
    } else if (currentScrollY < 20) {
      if (document.body.classList.contains('pedco-hide-bars')) {
        isAnimating = true;
        window.parent.postMessage({ type: 'pedco_scroll', direction: 'up' }, '*');
        document.body.classList.remove('pedco-hide-bars');
        setTimeout(() => { isAnimating = false; }, 400);
      }
    }
    lastScrollY = currentScrollY;
  }
}, true);

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
    <div id="pedco-injected-toolbar" style="display: flex; align-items: center; gap: 6px; margin-left: 15px; flex-grow: 1;">
      <button id="pedco-btn-back" title="Atrás" style="padding: 4px 8px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; font-size: 13px; color: #374151; display: flex; align-items: center; justify-content: center;">◀</button>
      <button id="pedco-btn-forward" title="Adelante" style="padding: 4px 8px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; font-size: 13px; color: #374151; display: flex; align-items: center; justify-content: center;">▶</button>
      <button id="pedco-btn-refresh" title="Recargar" style="padding: 4px 8px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; font-size: 13px; color: #374151; display: flex; align-items: center; justify-content: center;">🔄</button>
      <button id="pedco-btn-home" title="Mis Cursos" style="padding: 4px 8px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; font-size: 13px; color: #374151; display: flex; align-items: center; justify-content: center;">🏠</button>
      <div id="pedco-url-bar" style="flex: 1; font-size: 11px; color: #6b7280; padding: 4px 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: all; max-width: 250px;">
        ${window.location.href}
      </div>
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
  
  window.parent.postMessage({ type: 'pedco_injected' }, '*');
}

setInterval(() => {
  injectToolbar();
  
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
