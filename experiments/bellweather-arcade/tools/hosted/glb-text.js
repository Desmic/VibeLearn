// Hosted copy only: models are published as base64 text (the host does not serve .glb).
// Images inside the model load through TextureLoader (<img>), not fetch(blob:).
export async function loadGlbText(loader, url) {
  const res = await fetch(url.replace(/\.glb$/, '.glb.b64.txt'));
  if (!res.ok) throw Error(`Model unavailable (${res.status}) ${url}`);
  const text = await res.text();
  const bin = atob(text.trim()), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const saved = self.createImageBitmap;
  try { self.createImageBitmap = undefined; var pending = loader.parseAsync(bytes.buffer, ''); }
  finally { self.createImageBitmap = saved; }
  return pending;
}
