var frame = document.getElementById('pedco-frame');
var urlBar = document.getElementById('url-bar');
var btnBack = document.getElementById('btn-back');
var btnForward = document.getElementById('btn-forward');

// === HISTORIAL MANUAL ===
var historyStack = ['https://pedco.uncoma.edu.ar/my/'];
var forwardStack = [];
var weNavigated = false;

function updateButtons() {
  btnBack.disabled = historyStack.length <= 1;
  btnForward.disabled = forwardStack.length === 0;
  
  if (frame.contentWindow) {
    frame.contentWindow.postMessage({
      type: 'pedco_state',
      canBack: !btnBack.disabled,
      canForward: !btnForward.disabled
    }, '*');
  }
}
updateButtons();

// Recibimos la URL desde content.js vía postMessage
window.addEventListener('message', function(event) {
  if (!event.data) return;
  
  if (event.data.type === 'pedco_injected') {
    document.querySelector('.toolbar').style.display = 'none'; // Ocultar barra nativa
    updateButtons();
    return;
  }
  
  if (event.data.type === 'pedco_nav') {
    if (event.data.action === 'back') btnBack.click();
    if (event.data.action === 'forward') btnForward.click();
    if (event.data.action === 'refresh') document.getElementById('btn-refresh').click();
    if (event.data.action === 'home') document.getElementById('btn-home').click();
    return;
  }
  
  if (event.data.type === 'pedco_scroll') {
    var toolbar = document.querySelector('.toolbar');
    if (event.data.direction === 'down') {
      toolbar.classList.add('hidden');
    } else {
      toolbar.classList.remove('hidden');
    }
    return;
  }

  if (event.data.type !== 'pedco_url') return;

  var newUrl = event.data.url;
  urlBar.textContent = newUrl;
  document.querySelector('.toolbar').classList.remove('hidden');

  if (weNavigated) {
    weNavigated = false;
    updateButtons();
    return;
  }

  var current = historyStack[historyStack.length - 1];
  if (current !== newUrl) {
    historyStack.push(newUrl);
    forwardStack.length = 0;
  }
  updateButtons();
});

// Seguridad adicional: si cambia la página en el iframe (ej: un PDF), forzar la aparición
frame.addEventListener('load', function() {
  document.querySelector('.toolbar').classList.remove('hidden');
  document.querySelector('.toolbar').style.display = 'flex'; // Visible por defecto como fallback
});

// === BOTONES ===
btnBack.onclick = function() {
  if (historyStack.length <= 1) return;
  var current = historyStack.pop();
  forwardStack.push(current);
  var prev = historyStack[historyStack.length - 1];
  weNavigated = true;
  frame.src = prev;
  urlBar.textContent = prev;
  updateButtons();
};

btnForward.onclick = function() {
  if (forwardStack.length === 0) return;
  var next = forwardStack.pop();
  historyStack.push(next);
  weNavigated = true;
  frame.src = next;
  urlBar.textContent = next;
  updateButtons();
};

document.getElementById('btn-refresh').onclick = function() {
  weNavigated = true;
  var url = historyStack[historyStack.length - 1];
  var u = new URL(url);
  u.searchParams.set('_t', Date.now());
  frame.src = u.toString();
};

document.getElementById('btn-home').onclick = function() {
  historyStack.length = 0;
  historyStack.push('https://pedco.uncoma.edu.ar/my/');
  forwardStack.length = 0;
  weNavigated = true;
  frame.src = 'https://pedco.uncoma.edu.ar/my/';
  urlBar.textContent = 'https://pedco.uncoma.edu.ar/my/';
  updateButtons();
};
