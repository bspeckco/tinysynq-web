(async () => {
  const mod = await import('http://localhost:8181/tinysynq.module.js');
  window.tinysynq = mod?.default;
  console.log('@@ MODULE @@', mod.default);
})();
