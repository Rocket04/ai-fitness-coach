# PNG Icon Generation (Node.js, No Image Tools)

When `sharp`, `imagemagick`, or `canvas` aren't available, generate minimal valid
PNG files using Node.js core modules (`fs`, `zlib`).

## One-liner for solid-color square PNG

```javascript
const fs = require('fs');
const zlib = require('zlib');
function crc32(buf){let c=0xFFFFFFFF;for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xEDB88320:0);}return(c^0xFFFFFFFF)>>>0;}
function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length,0);const tb=Buffer.from(t,'ascii');const c=Buffer.alloc(4);c.writeUInt32BE(crc32(Buffer.concat([tb,d])),0);return Buffer.concat([l,tb,d,c]);}
function png(w){const s=Buffer.from([137,80,78,71,13,10,26,10]);const h=Buffer.alloc(13);h.writeUInt32BE(w,0);h.writeUInt32BE(w,4);h.writeUInt8(8,8);h.writeUInt8(2,9);const raw=Buffer.alloc(w*(1+w*3));for(let y=0;y<w;y++){raw[y*(1+w*3)]=0;for(let x=0;x<w;x++){const o=y*(1+w*3)+1+x*3;raw[o]=79;raw[o+1]=124;raw[o+2]=68;}}return Buffer.concat([s,chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
fs.writeFileSync('public/icons/icon-192.png',png(192));
fs.writeFileSync('public/icons/icon-512.png',png(512));
```

Adjust RGB values in the inner loop (`raw[o]`, `raw[o+1]`, `raw[o+2]`) for your brand color.

## Gotchas
- PNG signature must be exact: `[137,80,78,71,13,10,26,10]`
- IHDR color type 2 = RGB (no alpha), bit depth 8
- Each scanline starts with filter byte `0` (no filter)
- CRC32 covers type + data bytes
- Works for any square size (16, 192, 512, etc.)