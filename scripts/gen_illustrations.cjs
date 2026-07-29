const fs = require('fs');
const path = require('path');

const dir = 'e:/FlutterProjects/pharma_now/assets/images/';
const ma = fs.readFileSync(path.join(dir, 'Medicine-amico.svg')).toString('base64');
const mb = fs.readFileSync(path.join(dir, 'Medicine-bro.svg')).toString('base64');
const ph = fs.readFileSync(path.join(dir, 'Public health-amico.svg')).toString('base64');
const ob = fs.readFileSync(path.join(dir, 'on_boarding_image_1.svg')).toString('base64');

const code = `export const BANNER_ILLUSTRATIONS: Record<string, string> = {
  medicine_amico: 'data:image/svg+xml;base64,${ma}',
  medicine_bro: 'data:image/svg+xml;base64,${mb}',
  public_health: 'data:image/svg+xml;base64,${ph}',
  on_boarding: 'data:image/svg+xml;base64,${ob}',
};

export function getBannerIllustration(url?: string): string {
  if (!url) return '';
  if (url.includes('medicine_amico')) return BANNER_ILLUSTRATIONS.medicine_amico;
  if (url.includes('medicine_bro')) return BANNER_ILLUSTRATIONS.medicine_bro;
  if (url.includes('public_health')) return BANNER_ILLUSTRATIONS.public_health;
  if (url.includes('on_boarding')) return BANNER_ILLUSTRATIONS.on_boarding;
  return url;
}
`;

fs.mkdirSync('src/assets', { recursive: true });
fs.writeFileSync('src/assets/bannerIllustrations.ts', code);
console.log('Successfully written bannerIllustrations.ts!');
