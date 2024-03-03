(async () => {
  const mod = await import('http://localhost:8181/synqlite.module.js');
  window.synqlite = mod?.default;
  console.log('@@ MODULE @@', mod.default);
})();
