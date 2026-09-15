/* Значок сайта во вкладке браузера и на экране «Домой» — из логотипа клуба.
   Запуск из корня сайта: node tools/favicon.js

   Логотип белый на прозрачном: во вкладке светлого браузера он бы пропал,
   поэтому значок стоит на тёмной плашке цвета фона сайта. Во вкладке
   (16–48 px) только «DC»: подпись DATSIEV CLUB там сливается в серую полосу.
   На экране «Домой» (180 px) логотип целиком. */
const fs = require('fs'), zlib = require('zlib');

const SRC = 'tools/logo-src.png';             // логотип 900 px: media/logo.png для значка мелковат
const BG  = [5, 5, 6];                        // --bg из site.css

/* ---------- PNG: чтение (8 бит, RGBA, без чересстрочности) и запись ---------- */
function readPNG(file){
  const b = fs.readFileSync(file), idat = [];
  let p = 8, w, h;
  while (p < b.length){
    const len = b.readUInt32BE(p), type = b.toString('latin1', p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR'){
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error(file + ': нужен PNG 8 бит RGBA без чересстрочности');
    }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * 4, px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++){
    const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, d = y * stride;
    for (let i = 0; i < stride; i++){
      const a = i >= 4 ? px[d + i - 4] : 0, up = y ? px[d + i - stride] : 0, c = i >= 4 && y ? px[d + i - stride - 4] : 0;
      let v = raw[s + i];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4){
        const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      px[d + i] = v & 255;
    }
  }
  return { w, h, px };
}
function chunk(type, data){
  const len = Buffer.alloc(4), crc = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  len.writeUInt32BE(data.length); crc.writeUInt32BE(zlib.crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePNG({ w, h, px }){
  const ihdr = Buffer.alloc(13), raw = Buffer.alloc((w * 4 + 1) * h);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- где в логотипе «DC», а где подпись ---------- */
const logo = readPNG(SRC);
const ink = (x, y) => logo.px[(y * logo.w + x) * 4 + 3] > 24;
const blocks = [];                            // строки с рисунком; щель до 12 px — тот же блок
for (let y = 0; y < logo.h; y++){
  let any = false;
  for (let x = 0; x < logo.w && !any; x++) any = ink(x, y);
  if (!any) continue;
  const last = blocks[blocks.length - 1];
  if (last && y - last[1] <= 12) last[1] = y; else blocks.push([y, y]);
}
if (blocks.length !== 2) throw new Error('ждал два блока — «DC» и подпись, нашёл ' + blocks.length);
function box(y0, y1){
  let x0 = logo.w, x1 = 0;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < logo.w; x++) if (ink(x, y)){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
const mark = box(...blocks[0]);               // «DC»
const full = box(blocks[0][0], blocks[1][1]); // «DC» с подписью

/* ---------- плашка с рисунком ----------
   Рисунок ставится 1:1, а сторона плашки подбирается так, чтобы он занял
   долю fill. Цвета — с умноженной альфой, чтобы края не темнели при уменьшении. */
function tile(crop, fill, radius){
  const S = Math.ceil(Math.max(crop.w, crop.h) / fill), R = S * radius, f = new Float32Array(S * S * 4);
  const ox = Math.round((S - crop.w) / 2), oy = Math.round((S - crop.h) / 2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){
    const dx = Math.max(R - x - .5, x + .5 - (S - R), 0), dy = Math.max(R - y - .5, y + .5 - (S - R), 0);
    const cov = R ? Math.min(1, Math.max(0, R - Math.hypot(dx, dy) + .5)) : 1;   // скруглённые углы
    let rgb = BG.map(v => v / 255);
    const sx = x - ox, sy = y - oy;
    if (sx >= 0 && sy >= 0 && sx < crop.w && sy < crop.h){
      const i = ((crop.y + sy) * logo.w + crop.x + sx) * 4, a = logo.px[i + 3] / 255;
      rgb = rgb.map((v, c) => v * (1 - a) + logo.px[i + c] / 255 * a);
    }
    const o = (y * S + x) * 4;
    f[o] = rgb[0] * cov; f[o + 1] = rgb[1] * cov; f[o + 2] = rgb[2] * cov; f[o + 3] = cov;
  }
  return { w: S, h: S, f };
}
/* уменьшение усреднением по площади: тонкие прорези в «DC» не рябят */
function resize(img, T){
  const spans = n => Array.from({ length: T }, (_, j) => {
    const k = n / T, a = j * k, b = (j + 1) * k, ws = [];
    for (let i = Math.floor(a); i < Math.min(n, Math.ceil(b)); i++) ws.push([i, (Math.min(b, i + 1) - Math.max(a, i)) / k]);
    return ws;
  });
  const wx = spans(img.w), wy = spans(img.h), tmp = new Float32Array(T * img.h * 4), f = new Float32Array(T * T * 4);
  for (let y = 0; y < img.h; y++) for (let j = 0; j < T; j++) for (const [i, k] of wx[j])
    for (let c = 0; c < 4; c++) tmp[(y * T + j) * 4 + c] += img.f[(y * img.w + i) * 4 + c] * k;
  for (let j = 0; j < T; j++) for (const [i, k] of wy[j]) for (let x = 0; x < T; x++)
    for (let c = 0; c < 4; c++) f[(j * T + x) * 4 + c] += tmp[(i * T + x) * 4 + c] * k;
  return { w: T, h: T, f };
}
function bytes({ w, h, f }){
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++){
    const a = f[i * 4 + 3];
    for (let c = 0; c < 3; c++) px[i * 4 + c] = a ? Math.round(Math.min(1, f[i * 4 + c] / a) * 255) : 0;
    px[i * 4 + 3] = Math.round(a * 255);
  }
  return { w, h, px };
}
/* .ico с PNG внутри: так его читают все браузеры, и в одном файле сразу 16, 32 и 48 */
function ico(pngs){
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(([s, d], k) => {
    const e = 6 + 16 * k;
    head[e] = s; head[e + 1] = s;
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(d.length, e + 8); head.writeUInt32LE(off, e + 12);
    off += d.length;
  });
  return Buffer.concat([head, ...pngs.map(p => p[1])]);
}

const tab = tile(mark, 0.86, 0.22);
fs.writeFileSync('favicon.ico', ico([16, 32, 48].map(s => [s, writePNG(bytes(resize(tab, s)))])));
/* iOS сам скругляет углы значка, поэтому здесь квадрат без скругления */
fs.writeFileSync('apple-touch-icon.png', writePNG(bytes(resize(tile(full, 0.62, 0), 180))));
console.log('«DC»:', mark, '\nлоготип целиком:', full, '\nготово: favicon.ico, apple-touch-icon.png');
