// Remove private HTML saved by older workers before taking control.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all(['pages', 'static-media'].map((name) => caches.delete(name))),
  )
})
