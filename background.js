// === DIAGNÓSTICO ===
// Intentamos con ambas APIs por si acaso
var api = (typeof browser !== 'undefined') ? browser : chrome;

// Señal de vida
try {
  api.storage.local.set({ bg_alive: "SI " + new Date().toLocaleTimeString() });
} catch(e) {}

// Interceptar tráfico de red
try {
  api.webRequest.onBeforeRequest.addListener(
    function(details) {
      try {
        api.storage.local.set({ 
          detected_url: details.url, 
          detected_type: details.type,
          detected_time: new Date().toLocaleTimeString()
        });
      } catch(e) {}
    },
    { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] }
  );
} catch(e) {
  try {
    api.storage.local.set({ bg_error: e.message });
  } catch(e2) {}
}
