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
// SCROLL DETECTION (Ocultar barra automáticamente)
// ==========================================
let lastScrollY = 0;
let isAnimating = false; // Bloqueo para evitar bucle infinito

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
