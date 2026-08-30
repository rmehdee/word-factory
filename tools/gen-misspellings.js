/* Regenerates the MISSPELL map in content.js.
   A spelling question is only fair if none of the wrong options is itself a
   real word, so every candidate is checked against the system dictionary and
   rejected if it appears there. Run from the repo root:
     node tools/gen-misspellings.js
   then paste the output over the MISSPELL constant in content.js. */
const fs = require('fs');
const DICT = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8')
  .split('\n').map(w => w.trim().toLowerCase()).filter(Boolean));
const { W } = new Function(fs.readFileSync('content.js', 'utf8') + '; return {W};')();

const words = new Set();
['digraph','blend','rcontrol','finale','vowelteam','diphthong','varteam','twosyll','consle']
  .forEach(k => W[k].forEach(x => words.add(x[0])));
W.sight1.forEach(w => words.add(w));
// the fluency and long-word lists, which live inside their generators
`because through thought enough friend people something different together beautiful
 necessary separate definitely probably especially immediately occasion business February restaurant
 rhythm conscience embarrass privilege recommend accommodate independent maintenance occurrence perseverance
 fantastic important understand everybody telescope photograph
 unbelievable information celebration comfortable experiment
 responsibility communication unfortunately characteristic investigation`
  .split(/\s+/).filter(Boolean).forEach(w => words.add(w));

const SWAPS = [[/ai/,'ay'],[/oa/,'ow'],[/ee/,'ea'],[/ea/,'ee'],[/oo/,'u'],[/ck/,'k'],[/tion/,'shun'],
  [/ph/,'f'],[/kn/,'n'],[/wr/,'r'],[/ie/,'ei'],[/ei/,'ie'],[/le$/,'el'],[/er$/,'ar'],[/or$/,'er'],
  [/ir/,'ur'],[/ur/,'er'],[/ould/,'ude'],[/gh/,''],[/ss/,'s'],[/rr/,'r'],[/mm/,'m'],[/ll/,'l'],
  [/cc/,'c'],[/tt/,'t'],[/ance$/,'ence'],[/ence$/,'ance'],[/able$/,'ible'],[/ary$/,'ery'],[/ent$/,'ant']];

const out = {};
for (const w of [...words].sort()) {
  const c = new Set();
  for (const [rx, rep] of SWAPS) if (rx.test(w)) { const m = w.replace(rx, rep); if (m !== w) c.add(m); }
  for (let i = 1; i < w.length; i++) {
    const ch = w[i];
    if ('aeiou'.includes(ch)) for (const v of 'aeiou') if (v !== ch) c.add(w.slice(0, i) + v + w.slice(i + 1));
    else c.add(w.slice(0, i) + ch + w.slice(i));                       // double a consonant
    c.add(w.slice(0, i) + w.slice(i + 1));                             // drop a letter
    if (i < w.length - 1) c.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));  // transpose
  }
  const good = [...c].filter(m => m !== w && m.length > 1 &&
    !DICT.has(m.toLowerCase()) && Math.abs(m.length - w.length) <= 2);
  out[w] = good.sort((a, b) => Math.abs(a.length - w.length) - Math.abs(b.length - w.length)).slice(0, 5);
  if (out[w].length < 3) console.error(`WARNING: ${w} has only ${out[w].length} safe distractors`);
}
console.log('const MISSPELL = ' + JSON.stringify(out) + ';');
