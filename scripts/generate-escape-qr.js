import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import QRCode from 'qrcode';
import { ESCAPE_CLUES } from '../shared/escape.js';

const destination = resolve('output/escape-qr');
await mkdir(destination, { recursive: true });
const cards = [];
for (const [index, { token }] of ESCAPE_CLUES.entries()) {
  const filename = `qr-${index + 1}.png`;
  await QRCode.toFile(resolve(destination, filename), token, { type: 'png', errorCorrectionLevel: 'H', margin: 4, scale: 16 });
  cards.push(`<section><h2>QR ${index + 1}</h2><img src="${filename}" alt="QR ${index + 1}"></section>`);
}
await writeFile(resolve(destination, 'print.html'), `<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>자마르 방탈출 QR 카드</title>
<style>@page{size:A4;margin:16mm}body{font-family:system-ui,sans-serif;margin:0;color:#111;background:white}h1{text-align:center;font-size:22px;margin:0 0 20px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}section{break-inside:avoid;border:1px dashed #999;padding:16px;text-align:center}h2{font-size:18px;margin:0 0 8px}img{display:block;width:100%;max-width:300px;height:auto;margin:auto}</style>
<h1>자마르 방탈출</h1><main>${cards.join('')}</main></html>\n`);
console.log('Created four QR PNGs and print.html in output/escape-qr');
