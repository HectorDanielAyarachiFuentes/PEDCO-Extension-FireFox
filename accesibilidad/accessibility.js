// accessibility.js
const ACC_STATE = {
  dyslexic: false,
  highContrast: false,
  highlightLinks: false
};

function initAccessibility() {
  // Load state from localStorage
  const saved = localStorage.getItem('pedco_acc_state');
  if (saved) {
    try {
      Object.assign(ACC_STATE, JSON.parse(saved));
    } catch(e) {}
  }
  
  applyAccessibility();
  injectAccessibilityModal();
}

function applyAccessibility() {
  document.body.classList.toggle('pedco-dyslexic', ACC_STATE.dyslexic);
  document.body.classList.toggle('pedco-high-contrast', ACC_STATE.highContrast);
  document.body.classList.toggle('pedco-highlight-links', ACC_STATE.highlightLinks);
}

function saveAccessibility() {
  localStorage.setItem('pedco_acc_state', JSON.stringify(ACC_STATE));
  applyAccessibility();
}

function injectAccessibilityModal() {
  if (document.getElementById('pedco-acc-backdrop')) return;
  
  const backdrop = document.createElement('div');
  backdrop.id = 'pedco-acc-backdrop';
  document.body.appendChild(backdrop);
  
  const modal = document.createElement('div');
  modal.id = 'pedco-acc-modal';
  modal.innerHTML = `
    <div class="pedco-acc-header">
      <h3>♿ Accesibilidad</h3>
      <span class="pedco-acc-close" id="pedco-acc-close" title="Cerrar">&times;</span>
    </div>
    <div class="pedco-acc-body">
      <div class="pedco-acc-row">
        <span>Fuente para Dislexia</span>
        <label class="pedco-switch">
          <input type="checkbox" id="pedco-toggle-dyslexic" ${ACC_STATE.dyslexic ? 'checked' : ''}>
          <span class="pedco-slider"></span>
        </label>
      </div>
      <div class="pedco-acc-row">
        <span>Alto Contraste Oscuro</span>
        <label class="pedco-switch">
          <input type="checkbox" id="pedco-toggle-contrast" ${ACC_STATE.highContrast ? 'checked' : ''}>
          <span class="pedco-slider"></span>
        </label>
      </div>
      <div class="pedco-acc-row">
        <span>Resaltar Enlaces</span>
        <label class="pedco-switch">
          <input type="checkbox" id="pedco-toggle-links" ${ACC_STATE.highlightLinks ? 'checked' : ''}>
          <span class="pedco-slider"></span>
        </label>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Events
  document.getElementById('pedco-acc-close').onclick = closeAccModal;
  backdrop.onclick = closeAccModal;
  
  document.getElementById('pedco-toggle-dyslexic').onchange = (e) => {
    ACC_STATE.dyslexic = e.target.checked;
    saveAccessibility();
  };
  document.getElementById('pedco-toggle-contrast').onchange = (e) => {
    ACC_STATE.highContrast = e.target.checked;
    saveAccessibility();
  };
  document.getElementById('pedco-toggle-links').onchange = (e) => {
    ACC_STATE.highlightLinks = e.target.checked;
    saveAccessibility();
  };
}

function openAccModal() {
  injectAccessibilityModal(); // Ensure it exists
  const backdrop = document.getElementById('pedco-acc-backdrop');
  const modal = document.getElementById('pedco-acc-modal');
  if (backdrop && modal) {
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  }
}

function closeAccModal() {
  const backdrop = document.getElementById('pedco-acc-backdrop');
  const modal = document.getElementById('pedco-acc-modal');
  if (backdrop && modal) {
    backdrop.classList.remove('visible');
    modal.classList.remove('visible');
  }
}

// Global exposure to open the modal from content.js
window.pedcoOpenAccessibility = openAccModal;
window.pedcoInitAccessibility = function() {
  if (!document.getElementById('pedco-acc-backdrop')) {
    injectAccessibilityModal();
  }
  applyAccessibility();
};

// Initialize
if (document.body) {
  initAccessibility();
} else {
  window.addEventListener('DOMContentLoaded', initAccessibility);
}
