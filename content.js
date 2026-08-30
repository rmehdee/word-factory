/* Word Factory content.
   Every topic maps to a Florida B.E.S.T. ELA benchmark, taken from the
   official standards document. Spelling items are generated from real word
   lists with realistic misspellings, so a child meets fresh words rather than
   a memorised set.
   A generator returns: { q, a, choices[], why, sub?, visual? }             */

const R = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

function fromPool(pool) {
  const it = pick(pool);
  const ch = shuffle([it.a, ...it.w]).slice(0, 4);
  if (!ch.includes(it.a)) ch[0] = it.a;
  return { q: it.q, a: it.a, choices: shuffle(ch), why: it.why, sub: it.sub, visual: it.vis ? it.vis() : undefined };
}

/* Four options with no accidental duplicates. */
function opts(answer, wrongs) {
  const set = [String(answer)];
  for (const w of wrongs) {
    const s = String(w);
    if (!set.includes(s)) set.push(s);
    if (set.length === 4) break;
  }
  return shuffle(set);
}

/* --------------------------------------------------------------- pictures */
function svgWrap(inner, w, h, maxW) {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${maxW || w}px;height:auto" role="img" aria-hidden="true">${inner}</svg>`;
}
const PHONE_W = 258;
function sf(vbw, px) { return Math.max(px, Math.round(px * vbw / PHONE_W)); }

/* A word broken into its parts, so a child sees prefix + root + suffix. */
function svgWordParts(parts) {
  const COL = { prefix: '#7C3AED', root: '#0E9F6E', suffix: '#C6274B', base: '#2563EB' };
  const pad = 8, gap = 8, chW = 13, h = 78;
  const widths = parts.map(p => Math.max(46, p.text.length * chW + 18));
  const w = widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1) + pad * 2;
  let x = pad, out = '';
  parts.forEach((p, i) => {
    const c = COL[p.kind] || COL.base;
    out += `<rect x="${x}" y="10" width="${widths[i]}" height="34" rx="9" fill="${c}1A" stroke="${c}" stroke-width="2.5"/>`;
    out += `<text x="${x + widths[i] / 2}" y="33" font-size="${sf(w, 16)}" font-weight="800" fill="${c}" text-anchor="middle">${p.text}</text>`;
    out += `<text x="${x + widths[i] / 2}" y="62" font-size="${sf(w, 11)}" font-weight="700" fill="#5A6683" text-anchor="middle">${p.kind}</text>`;
    x += widths[i] + gap;
  });
  return svgWrap(out, w, h, Math.min(380, Math.round(w * 1.5)));
}

/* Syllable split, for the decoding benchmarks. */
function svgSyllables(sylls) {
  const chW = 13, gap = 16, pad = 8, h = 62;
  const widths = sylls.map(s => Math.max(42, s.length * chW + 16));
  const w = widths.reduce((a, b) => a + b, 0) + gap * (sylls.length - 1) + pad * 2;
  let x = pad, out = '';
  sylls.forEach((s, i) => {
    out += `<rect x="${x}" y="12" width="${widths[i]}" height="36" rx="10" fill="#EEF3FF" stroke="#2563EB" stroke-width="2.5"/>`;
    out += `<text x="${x + widths[i] / 2}" y="37" font-size="${sf(w, 17)}" font-weight="800" fill="#2563EB" text-anchor="middle">${s}</text>`;
    if (i < sylls.length - 1) out += `<text x="${x + widths[i] + gap / 2}" y="37" font-size="${sf(w, 15)}" fill="#A9803A" text-anchor="middle">•</text>`;
    x += widths[i] + gap;
  });
  return svgWrap(out, w, h, Math.min(360, Math.round(w * 1.5)));
}

/* The spelling pattern under a word, highlighting the letters that matter. */
function svgPattern(word, from, len, label) {
  const chW = 17, pad = 12, h = 74;
  const w = word.length * chW + pad * 2;
  let out = '';
  for (let i = 0; i < word.length; i++) {
    const hot = i >= from && i < from + len;
    out += `<text x="${pad + i * chW + chW / 2}" y="34" font-size="${sf(w, 22)}" font-weight="800" fill="${hot ? '#C6274B' : '#17203A'}" text-anchor="middle">${word[i]}</text>`;
  }
  out += `<rect x="${pad + from * chW}" y="42" width="${len * chW}" height="4" rx="2" fill="#C6274B"/>`;
  if (label) out += `<text x="${pad + (from + len / 2) * chW}" y="64" font-size="${sf(w, 12)}" font-weight="800" fill="#C6274B" text-anchor="middle">${label}</text>`;
  return svgWrap(out, w, h, Math.min(320, Math.round(w * 1.5)));
}

/* ------------------------------------------------------------ word banks
   Real words, grouped by the pattern each benchmark names. Misspellings are
   the ones children actually make: the wrong vowel team, the missing double
   letter, the -s plural where -ies belongs.                               */

const W = {
  digraph: [['ship','sh'],['chin','ch'],['thin','th'],['when','wh'],['shop','sh'],['chop','ch'],['bath','th'],['whale','wh'],['fish','sh'],['much','ch']],
  blend: [['stop','st'],['frog','fr'],['clap','cl'],['grin','gr'],['swim','sw'],['plan','pl'],['drum','dr'],['skip','sk'],['bring','br'],['flag','fl']],
  rcontrol: [['car','ar'],['bird','ir'],['fern','er'],['corn','or'],['turn','ur'],['star','ar'],['girl','ir'],['herd','er'],['fork','or'],['hurt','ur']],
  finale: [['cake','a_e'],['bike','i_e'],['home','o_e'],['cute','u_e'],['note','o_e'],['ride','i_e'],['game','a_e'],['tube','u_e']],
  vowelteam: [['rain','ai'],['boat','oa'],['team','ea'],['tree','ee'],['pie','ie'],['play','ay'],['snow','ow'],['blue','ue']],
  diphthong: [['coin','oi'],['toy','oy'],['cloud','ou'],['cow','ow'],['point','oi'],['boy','oy'],['round','ou'],['now','ow']],
  varteam: [['moon','oo'],['book','oo'],['bread','ea'],['soup','ou'],['spoon','oo'],['head','ea'],['group','ou'],['food','oo']],
  twosyll: [['rabbit',['rab','bit']],['napkin',['nap','kin']],['sunset',['sun','set']],['basket',['bas','ket']],['muffin',['muf','fin']],['picnic',['pic','nic']],['helmet',['hel','met']],['magnet',['mag','net']]],
  openclosed: [['tiger',['ti','ger'],'open'],['robot',['ro','bot'],'open'],['music',['mu','sic'],'open'],['rabbit',['rab','bit'],'closed'],['napkin',['nap','kin'],'closed'],['basket',['bas','ket'],'closed']],
  consle: [['table',['ta','ble']],['apple',['ap','ple']],['little',['lit','tle']],['purple',['pur','ple']],['candle',['can','dle']],['bubble',['bub','ble']]],
  plural_ies: [['baby','babies'],['story','stories'],['puppy','puppies'],['city','cities'],['penny','pennies'],['candy','candies'],['pony','ponies'],['family','families']],
  irregular_plural: [['child','children'],['foot','feet'],['tooth','teeth'],['mouse','mice'],['goose','geese'],['man','men'],['woman','women'],['leaf','leaves'],['wolf','wolves'],['knife','knives']],
  irregular_past: [['go','went'],['eat','ate'],['run','ran'],['see','saw'],['come','came'],['take','took'],['write','wrote'],['bring','brought'],['catch','caught'],['teach','taught']],
  contraction: [['do not',"don't"],['can not',"can't"],['it is',"it's"],['I am',"I'm"],['we are',"we're"],['they are',"they're"],['did not',"didn't"],['you will',"you'll"],['she is',"she's"],['have not',"haven't"]],
  prefix: [['un','not','unhappy','happy'],['re','again','rewrite','write'],['pre','before','preview','view'],['dis','not or opposite','disagree','agree'],['mis','wrongly','misread','read'],['non','not','nonstop','stop']],
  suffix: [['-ful','full of','joyful','joy'],['-less','without','fearless','fear'],['-er','more','faster','fast'],['-est','most','fastest','fast'],['-ly','in that way','slowly','slow'],['-able','able to be','washable','wash'],['-ness','the state of','kindness','kind'],['-ment','the act of','payment','pay']],
  root: [['port','carry','transport, portable, export'],['tract','pull or drag','tractor, attract, subtract'],['dict','say or speak','dictate, predict, dictionary'],['scrib','write','scribble, describe, prescription'],['aud','hear','audio, audience, auditorium'],['spect','look','inspect, spectator, telescope'],['photo','light','photograph, photosynthesis'],['graph','write or draw','autograph, paragraph, graphic'],['bio','life','biology, biography'],['geo','earth','geography, geology'],['therm','heat','thermometer, thermal'],['meter','measure','thermometer, perimeter, diameter']],
  multimean: [['bark','the outside of a tree','the sound a dog makes'],['bat','a flying animal','a stick used in baseball'],['ring','a circle you wear','the sound a bell makes'],['light','not heavy','brightness you can see by'],['trunk','the main stem of a tree','an elephant’s long nose'],['spring','a season of the year','a coil that bounces back']],
  synonym: [['happy','glad','sad','angry','tired'],['big','large','tiny','soft','loud'],['fast','quick','slow','heavy','quiet'],['cold','chilly','warm','bright','sweet'],['begin','start','finish','forget','carry']],
  antonym: [['hot','cold','warm','boiling','sunny'],['up','down','over','above','high'],['full','empty','heavy','open','round'],['early','late','soon','quick','morning'],['brave','afraid','strong','bold','loud']],
  sight1: ['said','come','they','were','been','from','have','some','what','there','little','again'],
  academic3: [['observe','to watch carefully','to ignore','to shout','to hide'],['compare','to look for how things are alike and different','to make a copy','to throw away','to count'],['describe','to tell what something is like','to guess','to erase','to hurry'],['explain','to make something clear','to keep secret','to break','to draw']],
  academic5: [['analyze','to examine something closely, part by part','to glance at quickly','to memorise','to decorate'],['summarize','to give the main points briefly','to add extra detail','to argue against','to copy exactly'],['evidence','facts that support an idea','a personal opinion','a made-up story','a wild guess'],['conclude','to decide something after looking at the facts','to begin a task','to ask a question','to change the subject']],
};

/* Misspellings, checked against a dictionary at build time.
   A spelling question is only fair if the wrong options are not themselves
   real words. Generating these live produced "been" against "bean" and "come"
   against "came", which gives a child two defensible answers. Every entry
   below was generated by swapping spelling patterns, doubling, dropping and
   transposing letters, then REJECTED if the result appears in the system
   dictionary. Regenerate with tools/gen-misspellings.js.                   */
const MISSPELL = {"ship":["sihp","shep","shup","shpi","shiip"],"chin":["cihn","chan","chon","chni","cin"],"thin":["tihn","thun","thni","thiin","thn"],"when":["wehn","whon","whne","whn","whe"],"shop":["sohp","shep","shup","shpo","shp"],"chop":["cohp","chep","chup","chpo","chp"],"bath":["bith","buth","btah","baath","bth"],"whale":["whael","wahle","whele","whule","whlae"],"fish":["fesh","fush","fsih","fihs","fiish"],"much":["mach","mech","mich","moch","mcuh"],"stop":["sotp","stip","stup","stpo","stp"],"frog":["forg","frag","freg","frug","frgo"],"clap":["clup","clpa","claap","clp","cla"],"grin":["gran","gren","gron","grni","griin"],"swim":["siwm","swem","swmi","swiim","swm"],"plan":["paln","plen","plin","plon","plun"],"drum":["durm","drem","drim","drom","drmu"],"skip":["sikp","skap","skop","skup","skpi"],"bring":["birng","brang","breng","brong","brung"],"flag":["falg","fleg","flig","flug","flga"],"car":["cer","cir","cra","caar","cr"],"bird":["berd","brid","bidr","biird","brd"],"fern":["farn","forn","furn","fren","fenr"],"corn":["carn","cirn","cron","conr","coorn"],"turn":["tirn","tunr","tuurn","trn"],"star":["satr","ster","stor","stur","staar"],"girl":["garl","gerl","gorl","gril","gilr"],"herd":["hird","hord","hurd","hred","hedr"],"fork":["fark","furk","frok","fokr","foork"],"hurt":["hert","hirt","hort","hrut","hutr"],"cake":["ceke","cike","ckae","caek","caka"],"bike":["beke","buke","bkie","biek","bika"],"home":["hime","hmoe","hoem","homa","homi"],"cute":["ctue","cuet","cuta","cuti","cuto"],"note":["nite","nute","ntoe","noet","nota"],"ride":["rade","rdie","ried","rida","ridi"],"game":["geme","gime","gome","gume","gmae"],"tube":["tabe","tebe","tibe","tbue","tueb"],"rain":["rayn","riin","roin","rian","raan"],"boat":["bowt","baat","biat","buat","baot"],"team":["taam","toam","tuam","taem","teim"],"tree":["trea","tere","trae","trie","troe"],"pie":["pei","pae","pue","pii","pio"],"play":["pley","pliy","pluy","plya","plaay"],"snow":["sonw","sniw","snuw","snwo","snoow"],"blue":["bule","blie","bloe","bleu","blua"],"coin":["cein","ciin","cuin","coen","coun"],"toy":["tey","tiy","tuy","tyo","tooy"],"cloud":["colud","claud","cleud","cliud","cluud"],"cow":["cew","ciw","cuw","cwo","coow"],"point":["peint","piint","puint","piont","poant"],"boy":["biy","byo","booy"],"round":["raund","reund","riund","ruund","ruond"],"now":["niw","nuw","nwo","noow","nw"],"moon":["maon","meon","mion","muon","moen"],"book":["baok","beok","biok","buok","boak"],"bread":["berad","braad","briad","bruad","braed"],"soup":["saup","seup","siup","suup","suop"],"spoon":["sopon","spaon","speon","spion","spuon"],"head":["haad","hiad","hoad","huad","haed"],"group":["gorup","graup","greup","griup","gruup"],"food":["faod","fiod","fuod","foad","foed"],"rabbit":["rebbit","ribbit","robbit","rubbit","rbabit"],"napkin":["nepkin","nipkin","nopkin","nupkin","npakin"],"sunset":["sanset","senset","sinset","sonset","snuset"],"basket":["besket","bisket","bsaket","bakset","basekt"],"muffin":["maffin","meffin","miffin","moffin","mfufin"],"picnic":["pacnic","pecnic","pocnic","pucnic","pcinic"],"helmet":["halmet","hilmet","holmet","hulmet","hlemet"],"magnet":["megnet","mignet","mognet","mugnet","mganet"],"table":["tabel","tible","teble","toble","tuble"],"apple":["appel","aplpe","appla","appli","applo"],"little":["littel","lattle","lettle","lottle","luttle"],"purple":["purpel","perple","parple","pirple","porple"],"candle":["candel","cendle","cindle","condle","cundle"],"bubble":["bubbel","bebble","bbuble","bublbe","bubbla"],"said":["sayd","siid","soid","siad","saed"],"come":["ceme","cime","cume","cmoe","coem"],"they":["tehy","thay","thiy","thoy","thuy"],"were":["wure","wree","weer","wera","wero"],"been":["baen","boen","buen","bein","beon"],"from":["frem","frum","frmo","fom","frm"],"have":["heve","huve","hvae","haev","hava"],"some":["sume","smoe","soem","somi","somo"],"what":["waht","whot","whut","whta","whaat"],"there":["tehre","thare","thire","thure","thera"],"again":["agayn","aagin","agein","agiin","agoin"],"because":["bacause","bicause","bocause","bucause","bceause"],"through":["trhough","thorugh","thraugh","threugh","thriugh"],"thought":["tohught","theught","thiught","thuught","thuoght"],"enough":["eonugh","enaugh","eniugh","enuugh","enuogh"],"friend":["freind","firend","fraend","freend","froend"],"people":["peopel","paople","piople","poople","puople"],"something":["samething","semething","simething","sumething","smoething"],"different":["differant","dafferent","defferent","dofferent","dufferent"],"together":["togethar","tagether","tegether","tigether","tugether"],"beautiful":["beeutiful","baautiful","biautiful","boautiful","buautiful"],"necessary":["necessery","nacessary","nicessary","nocessary","nucessary"],"separate":["saparate","siparate","soparate","suparate","spearate"],"definitely":["dafinitely","difinitely","dofinitely","dufinitely","dfeinitely"],"probably":["porbably","prabably","prebably","pribably","prubably"],"especially":["epsecially","esepcially","espacially","espicially","espocially"],"immediately":["imemdiately","immadiately","immidiately","immodiately","immudiately"],"occasion":["ocacsion","occesion","occision","occosion","occusion"],"business":["basiness","besiness","bisiness","bosiness","bsuiness"],"February":["Februery","Fabruary","Fibruary","Fobruary","Fubruary"],"restaurant":["restaerant","rastaurant","ristaurant","rostaurant","rustaurant"],"rhythm":["ryhthm","rhtyhm","rhyhtm","rhytmh","rythm"],"conscience":["consceince","consciance","canscience","censcience","cinscience"],"embarrass":["ebmarrass","emabrrass","emberrass","embirrass","emborrass"],"privilege":["pirvilege","pravilege","previlege","provilege","pruvilege"],"recommend":["racommend","ricommend","rocommend","rucommend","rceommend"],"accommodate":["acocmmodate","accammodate","accemmodate","accimmodate","accummodate"],"independent":["independant","idnependent","inedpendent","indapendent","indipendent"],"maintenance":["mayntenance","maintenence","meintenance","miintenance","mointenance"],"occurrence":["occerrence","occurrance","ocucrrence","occarrence","occirrence"],"perseverance":["perseverence","parseverance","pirseverance","porseverance","purseverance"],"fantastic":["fentastic","fintastic","fontastic","funtastic","fnatastic"],"important":["ipmortant","imoprtant","impartant","impertant","impirtant"],"understand":["udnerstand","unedrstand","undarstand","undirstand","undorstand"],"everybody":["eevrybody","evarybody","evirybody","evorybody","evurybody"],"telescope":["talescope","tilescope","tolescope","tulescope","tleescope"],"photograph":["pohtograph","phatograph","phetograph","phitograph","phutograph"],"unbelievable":["unbeleivable","unbelievabel","unbelievible","ubnelievable","uneblievable"],"information":["informashun","ifnormation","inofrmation","infarmation","infermation"],"celebration":["celebrashun","calebration","cilebration","colebration","culebration"],"comfortable":["comfortabel","comfortible","camfortable","cemfortable","cimfortable"],"experiment":["experimant","epxeriment","exepriment","expariment","expiriment"],"responsibility":["rasponsibility","risponsibility","rosponsibility","rusponsibility","rseponsibility"],"communication":["communicashun","cammunication","cemmunication","cimmunication","cummunication"],"unfortunately":["ufnortunately","unofrtunately","unfartunately","unfertunately","unfirtunately"],"characteristic":["cahracteristic","cheracteristic","chiracteristic","choracteristic","churacteristic"],"investigation":["investigashun","ivnestigation","inevstigation","invastigation","invistigation"]};

function misspell(word, n) {
  const list = MISSPELL[word];
  if (!list || list.length < n) return (list || []).slice(0, n);
  return shuffle(list.slice()).slice(0, n);
}

/* ---------------------------------------------------------------- grade 1 */
const G1 = [
  { id: 'w1-decode', t: 'Sounds and spelling patterns', b: 'ELA.1.F.1.3', gen() {
      const mode = pick(['digraph', 'blend', 'rcontrol', 'finale', 'vowelteam']);
      const [word, pat] = pick(W[mode]);
      const kind = { digraph: 'two letters making one sound', blend: 'two letters you hear blended together',
        rcontrol: 'a vowel changed by the letter r', finale: 'a silent e making the vowel say its name',
        vowelteam: 'two vowels working together' }[mode];
      if (Math.random() < 0.5) {
        const at = mode === 'finale' ? word.indexOf(pat[0]) : word.indexOf(pat);
        const len = mode === 'finale' ? word.length - at : pat.length;
        return { q: `Which spelling pattern is in <b>${word}</b>?`, a: pat,
          choices: opts(pat, shuffle(W[mode].map(x => x[1]).filter(p => p !== pat)).slice(0, 3)),
          why: `${word} has ${pat}, which is ${kind}.`, visual: svgPattern(word, Math.max(0, at), Math.max(1, len), pat) };
      }
      const wrongs = misspell(word, 3);
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, wrongs),
        why: `${word} is right. It uses ${pat}, ${kind}.`, visual: svgPattern(word, Math.max(0, word.indexOf(pat[0])), pat.replace('_', '').length, pat) };
    } },
  { id: 'w1-sight', t: 'Sight words', b: 'ELA.1.F.1.4', gen() {
      const word = pick(W.sight1);
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is a sight word. It does not follow the usual sound rules, so it is learned by sight.` };
    } },
  { id: 'w1-vocab', t: 'Everyday words', b: 'ELA.1.V.1.1', gen: () => fromPool([
    { q: 'What does <b>enormous</b> mean?', a: 'Very big', w: ['Very small', 'Very fast', 'Very quiet'], why: 'Enormous means extremely large.' },
    { q: 'What does <b>gather</b> mean?', a: 'To bring things together', w: ['To throw away', 'To break apart', 'To fall asleep'], why: 'When you gather, you collect things into one place.' },
    { q: 'What does <b>beneath</b> mean?', a: 'Under something', w: ['Above something', 'Beside something', 'Inside something'], why: 'Beneath means below or under.' },
    { q: 'What does <b>silent</b> mean?', a: 'Making no sound', w: ['Very loud', 'Very bright', 'Very cold'], why: 'Silent means completely quiet.' },
    { q: 'What does <b>rapid</b> mean?', a: 'Very fast', w: ['Very slow', 'Very heavy', 'Very old'], why: 'Rapid means moving or happening quickly.' },
  ]) },
  { id: 'w1-endings', t: 'Word endings', b: 'ELA.1.V.1.2', gen() {
      const base = pick(['jump', 'walk', 'play', 'help', 'look', 'talk', 'paint', 'clean']);
      const mode = pick(['ed', 'ing', 's']);
      const form = base + (mode === 'ed' ? 'ed' : mode === 'ing' ? 'ing' : 's');
      if (Math.random() < 0.5) return { q: `What is the base word in <b>${form}</b>?`, a: base,
        choices: opts(base, [form, base + 'e', base.slice(0, -1)]),
        why: `Take off the ending -${mode} and the base word ${base} is left.`,
        visual: svgWordParts([{ text: base, kind: 'base' }, { text: '-' + mode, kind: 'suffix' }]) };
      const meaning = mode === 'ed' ? 'it already happened' : mode === 'ing' ? 'it is happening now' : 'one person does it';
      return { q: `<b>${form}</b> tells you that what?`, a: meaning,
        choices: opts(meaning, ['it will happen tomorrow', 'it never happens', 'it happens on Sundays']),
        why: `The ending -${mode} on ${base} means ${meaning}.`,
        visual: svgWordParts([{ text: base, kind: 'base' }, { text: '-' + mode, kind: 'suffix' }]) };
    } },
  { id: 'w1-clues', t: 'Working out a new word', b: 'ELA.1.V.1.3', gen: () => fromPool([
    { q: 'The puppy was <b>timid</b> and hid behind the chair. What does timid mean?', a: 'Shy', w: ['Angry', 'Hungry', 'Noisy'], why: 'Hiding behind a chair is a clue that timid means shy.' },
    { q: 'The soup was <b>scalding</b>, so Dad let it cool. What does scalding mean?', a: 'Very hot', w: ['Very cold', 'Very sweet', 'Very thick'], why: 'Letting it cool is the clue that scalding means very hot.' },
    { q: 'She was <b>weary</b> after the long walk and went straight to bed. What does weary mean?', a: 'Very tired', w: ['Very happy', 'Very hungry', 'Very cold'], why: 'Going straight to bed after a long walk tells you weary means tired.' },
    { q: 'The room was <b>vacant</b>, so we walked right in. What does vacant mean?', a: 'Empty', w: ['Full', 'Locked', 'Dark'], why: 'Being able to walk right in is the clue that vacant means empty.' },
  ]) },
  { id: 'w1-rules', t: 'Capital letters and sentences', b: 'ELA.1.C.3.1', gen: () => fromPool([
    { q: 'Which sentence is written correctly?', a: 'My friend Sara lives in Miami.', w: ['my friend Sara lives in Miami.', 'My friend sara lives in miami.', 'My Friend Sara Lives In Miami.'], why: 'Start a sentence with a capital, and capitalise names of people and places.' },
    { q: 'Which shows the past tense of <b>walk</b>?', a: 'walked', w: ['walking', 'walks', 'walk'], why: 'Adding -ed to a regular verb shows it already happened.' },
    { q: 'Which one is a complete sentence?', a: 'The dog ran fast.', w: ['The big brown dog.', 'Ran very fast.', 'Under the table.'], why: 'A complete sentence needs someone or something AND what they did.' },
    { q: 'Which shows that the book belongs to Sam?', a: "Sam's book", w: ['Sams book', "Sams' book", 'Sam book'], why: 'An apostrophe and s show that something belongs to one person.' },
    { q: 'Which sentence uses the right verb?', a: 'The cat sleeps on the mat.', w: ['The cat sleep on the mat.', 'The cats sleeps on the mat.', 'The cat sleeping on the mat.'], why: 'One cat takes the verb sleeps. The subject and verb must agree.' },
  ]) },
];

/* ---------------------------------------------------------------- grade 2 */
const G2 = [
  { id: 'w2-decode', t: 'Vowel teams and syllables', b: 'ELA.2.F.1.3', gen() {
      const mode = pick(['varteam', 'diphthong', 'twosyll', 'consle']);
      if (mode === 'twosyll' || mode === 'consle') {
        const [word, sylls] = pick(W[mode]);
        return { q: `How many syllables are in <b>${word}</b>?`, a: String(sylls.length),
          choices: opts(String(sylls.length), ['1', '3', '4'].filter(x => x !== String(sylls.length))),
          why: `${word} breaks into ${sylls.join(' • ')}, which is ${sylls.length} syllables.`, visual: svgSyllables(sylls) };
      }
      const [word, pat] = pick(W[mode]);
      if (Math.random() < 0.5) return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. The ${pat} team makes its sound here.`, visual: svgPattern(word, word.indexOf(pat), pat.length, pat) };
      return { q: `Which vowel team is in <b>${word}</b>?`, a: pat,
        choices: opts(pat, shuffle(W[mode].map(x => x[1]).filter(p => p !== pat)).slice(0, 3)),
        why: `${word} contains ${pat}.`, visual: svgPattern(word, word.indexOf(pat), pat.length, pat) };
    } },
  { id: 'w2-fluency', t: 'Reading words smoothly', b: 'ELA.2.F.1.4', gen() {
      const [word, sylls] = pick(W.twosyll.concat(W.consle));
      if (Math.random() < 0.5) return { q: `Where does <b>${word}</b> split into syllables?`, a: sylls.join(' • '),
        choices: opts(sylls.join(' • '), [word[0] + ' • ' + word.slice(1), sylls.join('') + ' • ', sylls.slice().reverse().join(' • ')]),
        why: `${word} splits as ${sylls.join(' • ')}. Breaking a word into syllables makes it easier to read smoothly.`,
        visual: svgSyllables(sylls) };
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. Read it in parts: ${sylls.join(' • ')}.`, visual: svgSyllables(sylls) };
    } },
  { id: 'w2-vocab', t: 'Words for school and books', b: 'ELA.2.V.1.1', gen: () => fromPool([
    { q: 'What does <b>predict</b> mean?', a: 'To say what you think will happen next', w: ['To remember what happened', 'To read out loud', 'To copy something'], why: 'When you predict, you use clues to say what will happen.' },
    { q: 'What does <b>author</b> mean?', a: 'The person who wrote the book', w: ['The person who reads it', 'The person who sells it', 'The person in the story'], why: 'The author is the writer.' },
    { q: 'What does <b>illustrate</b> mean?', a: 'To draw pictures for a story', w: ['To write the words', 'To read aloud', 'To print the pages'], why: 'An illustrator draws the pictures.' },
    { q: 'What does <b>describe</b> mean?', a: 'To tell what something is like', w: ['To hide something', 'To count something', 'To throw something'], why: 'Describing means giving details so someone can picture it.' },
  ]) },
  { id: 'w2-affix', t: 'Base words and affixes', b: 'ELA.2.V.1.2', gen() {
      const useP = Math.random() < 0.5;
      if (useP) {
        const [pre, mean, word, base] = pick(W.prefix);
        return { q: `<b>${word}</b> means what?`, a: `${mean} ${base}`,
          choices: opts(`${mean} ${base}`, [`very ${base}`, `${base} again and again`, `before ${base}`].filter(x => x !== `${mean} ${base}`)),
          why: `The prefix ${pre}- means "${mean}", so ${pre} + ${base} = ${word}.`,
          visual: svgWordParts([{ text: pre, kind: 'prefix' }, { text: base, kind: 'base' }]) };
      }
      const [suf, mean, word, base] = pick(W.suffix);
      return { q: `What does the suffix <b>${suf}</b> mean in ${word}?`, a: mean,
        choices: opts(mean, shuffle(W.suffix.map(s => s[1]).filter(m => m !== mean)).slice(0, 3)),
        why: `${suf} means "${mean}", so ${base} + ${suf} = ${word}.`,
        visual: svgWordParts([{ text: base, kind: 'base' }, { text: suf, kind: 'suffix' }]) };
    } },
  { id: 'w2-clues', t: 'Context clues', b: 'ELA.2.V.1.3', gen: () => fromPool([
    { q: 'The bridge was <b>sturdy</b>, so the heavy truck crossed safely. What does sturdy mean?', a: 'Strong', w: ['Weak', 'Narrow', 'Old'], why: 'A heavy truck crossing safely tells you sturdy means strong.' },
    { q: 'Ana was <b>reluctant</b> to jump in, so she waited on the edge. What does reluctant mean?', a: 'Unwilling', w: ['Eager', 'Excited', 'Ready'], why: 'Waiting on the edge is the clue that reluctant means unwilling.' },
    { q: 'The instructions were <b>simple</b>, so everyone finished quickly. What does simple mean?', a: 'Easy', w: ['Hard', 'Long', 'Missing'], why: 'Everyone finishing quickly shows the instructions were easy.' },
    { q: 'The path was <b>narrow</b>, so we walked in single file. What does narrow mean?', a: 'Not wide', w: ['Very wide', 'Very steep', 'Very wet'], why: 'Walking single file tells you the path was not wide.' },
  ]) },
  { id: 'w2-rules', t: 'Plurals, contractions and possessives', b: 'ELA.2.C.3.1', gen() {
      const mode = pick(['ies', 'contraction', 'possessive', 'commas']);
      if (mode === 'ies') {
        const [sing, plur] = pick(W.plural_ies);
        return { q: `What is the plural of <b>${sing}</b>?`, a: plur,
          choices: opts(plur, [sing + 's', sing + 'es', sing.slice(0, -1) + 'ys']),
          why: `A word ending in a consonant + y changes the y to i and adds -es: ${sing} becomes ${plur}.` };
      }
      if (mode === 'contraction') {
        const [full, short] = pick(W.contraction);
        if (Math.random() < 0.5) return { q: `Which contraction means <b>${full}</b>?`, a: short,
          choices: opts(short, [short.replace("'", ''), full.split(' ')[0] + "'" + full.split(' ')[1], short.replace("'", "'" + ' ')]),
          why: `${full} shortens to ${short}. The apostrophe stands for the missing letters.` };
        return { q: `What two words make <b>${short}</b>?`, a: full,
          choices: opts(full, shuffle(W.contraction.map(c => c[0]).filter(f => f !== full)).slice(0, 3)),
          why: `${short} is short for ${full}.` };
      }
      if (mode === 'possessive') {
        const who = pick(['the girls', 'the dogs', 'the boys', 'the teachers']);
        const thing = pick(['coats', 'bowls', 'bikes', 'desks']);
        const right = who.replace('the ', 'the ') + "' " + thing;
        return { q: `How do you show that the ${thing} belong to ${who}?`, a: `${who}' ${thing}`,
          choices: opts(`${who}' ${thing}`, [`${who}s ${thing}`, `${who}'s ${thing}`, `${who} ${thing}'`]),
          why: `${who} is already plural and ends in s, so the apostrophe goes after the s.` };
      }
      return { q: 'Which sentence uses commas correctly?', a: 'I packed apples, grapes, and cheese.',
        choices: opts('I packed apples, grapes, and cheese.', ['I packed apples grapes and cheese.', 'I packed, apples grapes and cheese.', 'I, packed apples, grapes and, cheese.']),
        why: 'Commas separate the items in a list.' };
    } },
];

/* ---------------------------------------------------------------- grade 3 */
const G3 = [
  { id: 'w3-decode', t: 'Roots, suffixes and long words', b: 'ELA.3.F.1.3', gen() {
      const mode = pick(['root', 'deriv', 'multi']);
      if (mode === 'root') {
        const [root, mean] = pick(W.root);
        return { q: `The root <b>${root}</b> means what?`, a: mean,
          choices: opts(mean, shuffle(W.root.map(r => r[1]).filter(m => m !== mean)).slice(0, 3)),
          why: `${root} means "${mean}". Knowing the root helps you decode and understand long words.`,
          visual: svgWordParts([{ text: root, kind: 'root' }]) };
      }
      if (mode === 'deriv') {
        const [suf, mean, word, base] = pick(W.suffix.filter(s => ['-ful', '-less', '-est'].includes(s[0])));
        const pos = suf === '-est' ? 'an adjective that compares' : 'an adjective';
        return { q: `Adding <b>${suf}</b> to ${base} makes ${word}. What kind of word is ${word}?`, a: pos,
          choices: opts(pos, ['a verb', 'a plural noun', 'a question word']),
          why: `The suffix ${suf} means "${mean}" and turns ${base} into ${pos}.`,
          visual: svgWordParts([{ text: base, kind: 'base' }, { text: suf, kind: 'suffix' }]) };
      }
      const [word, sylls] = pick([['fantastic', ['fan','tas','tic']], ['important', ['im','por','tant']], ['understand', ['un','der','stand']], ['everybody', ['ev','ery','bod','y']], ['telescope', ['tel','e','scope']], ['photograph', ['pho','to','graph']]]);
      return { q: `How many syllables are in <b>${word}</b>?`, a: String(sylls.length),
        choices: opts(String(sylls.length), ['2', '3', '4', '5'].filter(x => x !== String(sylls.length))),
        why: `${word} breaks into ${sylls.join(' • ')}, which is ${sylls.length} syllables.`, visual: svgSyllables(sylls) };
    } },
  { id: 'w3-fluency', t: 'Reading longer words', b: 'ELA.3.F.1.4', gen() {
      const words = ['because', 'through', 'thought', 'enough', 'friend', 'people', 'something', 'different', 'together', 'beautiful'];
      const word = pick(words);
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. Words like this come up so often that reading them instantly makes you a smoother reader.` };
    } },
  { id: 'w3-vocab', t: 'Academic words', b: 'ELA.3.V.1.1', gen() {
      const [word, right, ...wrong] = pick(W.academic3);
      return { q: `What does <b>${word}</b> mean?`, a: right, choices: opts(right, wrong),
        why: `${word} means ${right.toLowerCase()}. These are the words teachers use in every subject.` };
    } },
  { id: 'w3-roots', t: 'Greek and Latin roots', b: 'ELA.3.V.1.2', gen() {
      const [root, mean, egs] = pick(W.root);
      if (Math.random() < 0.5) return { q: `Words with the root <b>${root}</b> have something to do with what?`, a: mean,
        choices: opts(mean, shuffle(W.root.map(r => r[1]).filter(m => m !== mean)).slice(0, 3)),
        why: `${root} means "${mean}". You can see it in ${egs}.`, visual: svgWordParts([{ text: root, kind: 'root' }]) };
      return { q: `Which words share the root <b>${root}</b>, meaning "${mean}"?`, a: egs,
        choices: opts(egs, shuffle(W.root.map(r => r[2]).filter(e => e !== egs)).slice(0, 3)),
        why: `${egs} all contain ${root}, which means "${mean}".` };
    } },
  { id: 'w3-meaning', t: 'Words with more than one meaning', b: 'ELA.3.V.1.3', gen() {
      const [word, m1, m2] = pick(W.multimean);
      const use = Math.random() < 0.5;
      const sentence = { bark: [ 'The rough bark protected the tree.', 'We heard the dog bark at the postman.' ],
        bat: ['A bat flew out of the dark cave.', 'She swung the bat and hit the ball.'],
        ring: ['She wore a gold ring on her finger.', 'I heard the school bell ring.'],
        light: ['The box was light enough to carry.', 'Turn on the light so we can see.'],
        trunk: ['The trunk of the oak was very wide.', 'The elephant lifted water with its trunk.'],
        spring: ['Flowers bloom in the spring.', 'The spring in the toy made it bounce.'] }[word];
      const idx = use ? 0 : 1, right = use ? m1 : m2, other = use ? m2 : m1;
      return { q: `Read the sentence. What does <b>${word}</b> mean here?`, sub: sentence[idx], a: right,
        choices: opts(right, [other, 'a kind of food', 'a place to sleep']),
        why: `The sentence is the clue. Here ${word} means ${right.toLowerCase()}.` };
    } },
  { id: 'w3-rules', t: 'Irregular plurals and past tense', b: 'ELA.3.C.3.1', gen() {
      const mode = pick(['plural', 'past', 'tense']);
      if (mode === 'plural') {
        const [sing, plur] = pick(W.irregular_plural);
        return { q: `What is the plural of <b>${sing}</b>?`, a: plur,
          choices: opts(plur, [sing + 's', sing + 'es', plur + 's']),
          why: `${sing} does not just add -s. Its plural is ${plur}, which has to be learned.` };
      }
      if (mode === 'past') {
        const [base, past] = pick(W.irregular_past);
        return { q: `What is the past tense of <b>${base}</b>?`, a: past,
          choices: opts(past, [base + 'ed', base + 'd', base + 'ted']),
          why: `${base} is an irregular verb. Its past tense is ${past}, not ${base}ed.` };
      }
      return { q: 'Which sentence keeps the same verb tense all the way through?',
        a: 'She opened the door and walked inside.',
        choices: opts('She opened the door and walked inside.', ['She opened the door and walks inside.', 'She opens the door and walked inside.', 'She open the door and walking inside.']),
        why: 'Both verbs are in the past: opened and walked. Do not switch tense halfway through a sentence.' };
    } },
];

/* ---------------------------------------------------------------- grade 4 */
const G4 = [
  { id: 'w4-decode', t: 'Breaking apart long words', b: 'ELA.4.F.1.3', gen() {
      const list = [['unbelievable',['un','be','liev','a','ble']],['information',['in','for','ma','tion']],['celebration',['cel','e','bra','tion']],['independent',['in','de','pend','ent']],['comfortable',['com','fort','a','ble']],['experiment',['ex','per','i','ment']]];
      const [word, sylls] = pick(list);
      if (Math.random() < 0.5) return { q: `How many syllables are in <b>${word}</b>?`, a: String(sylls.length),
        choices: opts(String(sylls.length), ['3', '4', '5', '6'].filter(x => x !== String(sylls.length))),
        why: `${word} breaks into ${sylls.join(' • ')}.`, visual: svgSyllables(sylls) };
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. Break a long word into parts to spell it: ${sylls.join(' • ')}.`, visual: svgSyllables(sylls) };
    } },
  { id: 'w4-fluency', t: 'Tricky spellings', b: 'ELA.4.F.1.4', gen() {
      const word = pick(['necessary', 'separate', 'definitely', 'probably', 'especially', 'immediately', 'occasion', 'business', 'February', 'restaurant']);
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. These are the words most often misspelled, so they are worth learning by sight.` };
    } },
  { id: 'w4-vocab', t: 'Academic vocabulary', b: 'ELA.4.V.1.1', gen: () => fromPool([
    { q: 'What does <b>determine</b> mean?', a: 'To work out or decide', w: ['To forget', 'To copy', 'To hurry'], why: 'When you determine something you figure it out from what you know.' },
    { q: 'What does <b>identify</b> mean?', a: 'To recognise and name', w: ['To hide', 'To destroy', 'To imagine'], why: 'Identifying means picking something out and naming it.' },
    { q: 'What does <b>support</b> mean in "support your answer"?', a: 'Give reasons or evidence for it', w: ['Hold it up with your hands', 'Say it louder', 'Write it neatly'], why: 'In school work, to support an answer is to back it with evidence.' },
    { q: 'What does <b>contrast</b> mean?', a: 'To show how things are different', w: ['To show how things are alike', 'To count things', 'To put things in order'], why: 'Compare looks at similarities; contrast looks at differences.' },
  ]) },
  { id: 'w4-roots', t: 'Roots and affixes together', b: 'ELA.4.V.1.2', gen() {
      const built = [['transport','trans','port','across','carry','to carry across'],
        ['predict','pre','dict','before','say','to say before it happens'],
        ['inspect','in','spect','into','look','to look into something'],
        ['autograph','auto','graph','self','write','something you write yourself'],
        ['thermometer','thermo','meter','heat','measure','a tool that measures heat'],
        ['telescope','tele','scope','far','look','a tool for looking far away']];
      const [word, p, r, pm, rm, mean] = pick(built);
      if (Math.random() < 0.5) return { q: `<b>${word}</b> is built from ${p} (${pm}) and ${r} (${rm}). What does it mean?`, a: mean,
        choices: opts(mean, shuffle(built.map(b => b[5]).filter(m => m !== mean)).slice(0, 3)),
        why: `${p} means "${pm}" and ${r} means "${rm}", so ${word} means ${mean}.`,
        visual: svgWordParts([{ text: p, kind: 'prefix' }, { text: r, kind: 'root' }]) };
      return { q: `Which part of <b>${word}</b> carries the meaning "${rm}"?`, a: r,
        choices: opts(r, [p, word, word.slice(-3)]),
        why: `${r} is the root and means "${rm}". ${p} is the prefix and means "${pm}".`,
        visual: svgWordParts([{ text: p, kind: 'prefix' }, { text: r, kind: 'root' }]) };
    } },
  { id: 'w4-figurative', t: 'Figurative language and word choice', b: 'ELA.4.V.1.3', gen: () => fromPool([
    { q: 'What does "the classroom was a zoo" mean?', a: 'It was noisy and chaotic', w: ['There were animals in it', 'It was very quiet', 'It was outdoors'], why: 'That is a metaphor. It compares the room to a zoo to say it was wild, not that animals were there.' },
    { q: 'What does "she was as quiet as a mouse" mean?', a: 'She made almost no sound', w: ['She was small', 'She liked cheese', 'She was grey'], why: 'That is a simile. "As quiet as a mouse" means extremely quiet.' },
    { q: 'What does "he is drowning in homework" mean?', a: 'He has far too much of it', w: ['He dropped it in water', 'He finished it all', 'He lost it'], why: 'Drowning is used figuratively to mean overwhelmed.' },
    { q: 'Which pair are synonyms?', a: 'enormous and gigantic', w: ['enormous and tiny', 'enormous and quiet', 'enormous and early'], why: 'Synonyms mean nearly the same thing. Both words mean very big.' },
    { q: 'Which pair are antonyms?', a: 'ancient and modern', w: ['ancient and old', 'ancient and dusty', 'ancient and stone'], why: 'Antonyms are opposites. Ancient means very old; modern means new.' },
  ]) },
  { id: 'w4-rules', t: 'Sentences, agreement and conjunctions', b: 'ELA.4.C.3.1', gen: () => fromPool([
    { q: 'Which is a complete sentence, not a fragment?', a: 'The players on the team practised all week.', w: ['The players on the team.', 'Practised all week.', 'On the team every day.'], why: 'A fragment is missing the subject or the verb. This one has both.' },
    { q: 'Which sentence is a run-on that needs fixing?', a: 'I finished my work I went outside.', w: ['I finished my work, so I went outside.', 'I finished my work. I went outside.', 'After I finished my work, I went outside.'], why: 'Two complete sentences joined with nothing between them is a run-on.' },
    { q: 'Which sentence uses the right verb?', a: 'The box of books is heavy.', w: ['The box of books are heavy.', 'The box of books were heavy.', 'The box of books being heavy.'], why: 'The subject is box, not books, so the verb is is. Ignore the phrase in between.' },
    { q: 'Which conjunction fits? "It rained ___ we still played."', a: 'but', w: ['because', 'so', 'or'], why: 'But joins two ideas that contrast with each other.' },
    { q: 'Which sentence uses the right verb?', a: 'The group of students walks to the library.', w: ['The group of students walk to the library.', 'The group of students walking to the library.', 'The group of students have walk to the library.'], why: 'Group is the subject and is singular, so it takes walks.' },
  ]) },
];

/* ---------------------------------------------------------------- grade 5 */
const G5 = [
  { id: 'w5-decode', t: 'Morphology in long words', b: 'ELA.5.F.1.3', gen() {
      const list = [['responsibility',['re','spon','si','bil','i','ty']],['communication',['com','mu','ni','ca','tion']],['unfortunately',['un','for','tu','nate','ly']],['characteristic',['char','ac','ter','is','tic']],['investigation',['in','ves','ti','ga','tion']]];
      const [word, sylls] = pick(list);
      if (Math.random() < 0.5) return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. Spell a long word by its parts: ${sylls.join(' • ')}.`, visual: svgSyllables(sylls) };
      return { q: `How many syllables are in <b>${word}</b>?`, a: String(sylls.length),
        choices: opts(String(sylls.length), ['4', '5', '6', '7'].filter(x => x !== String(sylls.length))),
        why: `${word} breaks into ${sylls.join(' • ')}.`, visual: svgSyllables(sylls) };
    } },
  { id: 'w5-fluency', t: 'Words people misspell', b: 'ELA.5.F.1.4', gen() {
      const word = pick(['rhythm', 'conscience', 'embarrass', 'privilege', 'recommend', 'accommodate', 'independent', 'maintenance', 'occurrence', 'perseverance']);
      return { q: 'Which word is spelled correctly?', a: word, choices: opts(word, misspell(word, 3)),
        why: `${word} is right. These are the spellings that trip up adults too, so they repay careful attention.` };
    } },
  { id: 'w5-vocab', t: 'Academic vocabulary', b: 'ELA.5.V.1.1', gen() {
      const [word, right, ...wrong] = pick(W.academic5);
      return { q: `What does <b>${word}</b> mean?`, a: right, choices: opts(right, wrong),
        why: `${word} means ${right.toLowerCase()}.` };
    } },
  { id: 'w5-roots', t: 'Affixes and parts of speech', b: 'ELA.5.V.1.2', gen() {
      const rows = [['-tion','noun','celebrate','celebration','an action or its result'],
        ['-ment','noun','argue','argument','the act or result of doing it'],
        ['-ly','adverb','quick','quickly','how something is done'],
        ['-able','adjective','predict','predictable','able to be done'],
        ['-ous','adjective','danger','dangerous','full of'],
        ['-ify','verb','simple','simplify','to make it so']];
      const [suf, pos, base, word, mean] = pick(rows);
      if (Math.random() < 0.5) return { q: `Adding <b>${suf}</b> to ${base} gives ${word}. What part of speech is ${word}?`, a: pos,
        choices: opts(pos, ['noun', 'verb', 'adjective', 'adverb'].filter(p => p !== pos)),
        why: `${suf} means "${mean}" and turns the word into ${pos === 'adverb' ? 'an' : 'a'} ${pos}.`,
        visual: svgWordParts([{ text: base, kind: 'base' }, { text: suf, kind: 'suffix' }]) };
      return { q: `Which suffix would turn <b>${base}</b> into ${pos === 'adverb' ? 'an' : 'a'} ${pos}?`, a: suf,
        choices: opts(suf, shuffle(rows.map(r => r[0]).filter(s => s !== suf)).slice(0, 3)),
        why: `${base} + ${suf} = ${word}, which is ${pos === 'adverb' ? 'an' : 'a'} ${pos}.`,
        visual: svgWordParts([{ text: base, kind: 'base' }, { text: suf, kind: 'suffix' }]) };
    } },
  { id: 'w5-meaning', t: 'Shades of meaning', b: 'ELA.5.V.1.3', gen: () => fromPool([
    { q: 'Which word suggests the strongest feeling?', a: 'furious', w: ['annoyed', 'bothered', 'irritated'], why: 'All four mean angry, but furious is the most intense.' },
    { q: 'Which word suggests the smallest amount of light?', a: 'glimmer', w: ['blaze', 'glare', 'beam'], why: 'A glimmer is faint; a blaze, glare and beam are all much brighter.' },
    { q: 'What does "the deadline is looming" suggest?', a: 'It is close and a bit worrying', w: ['It has already passed', 'It is far away', 'It has been cancelled'], why: 'Looming carries a sense of something large approaching, so it hints at pressure.' },
    { q: 'Which is the best word for someone who saves money carefully?', a: 'thrifty', w: ['stingy', 'greedy', 'wasteful'], why: 'Thrifty is positive. Stingy and greedy are negative, and wasteful is the opposite.' },
    { q: 'What does "a mountain of paperwork" mean?', a: 'A very large amount of it', w: ['Paperwork about mountains', 'Paperwork on a hill', 'Very little paperwork'], why: 'It is a metaphor: the size of a mountain stands for a huge quantity.' },
  ]) },
  { id: 'w5-rules', t: 'Clauses, modals and tense', b: 'ELA.5.C.3.1', gen: () => fromPool([
    { q: 'Which sentence keeps tense and number consistent?', a: 'The students finished their projects and presented them.', w: ['The students finished their projects and presents them.', 'The student finished their projects and present it.', 'The students finishes their projects and presented them.'], why: 'Both verbs are past and both agree with the plural subject.' },
    { q: 'Which modal shows something is possible but not certain?', a: 'might', w: ['must', 'will', 'shall'], why: 'Might shows possibility. Must and will express certainty or obligation.' },
    { q: 'Which sentence uses an appositive correctly?', a: 'My teacher, Mrs Lopez, reads to us daily.', w: ['My teacher Mrs Lopez, reads to us daily.', 'My teacher, Mrs Lopez reads to us daily.', 'My, teacher Mrs Lopez reads to us daily.'], why: 'An appositive renames the noun and is set off by commas on both sides.' },
    { q: 'Which part of "Because it rained, we stayed inside" is the subordinate clause?', a: 'Because it rained', w: ['we stayed inside', 'it rained, we', 'stayed inside'], why: 'A subordinate clause cannot stand alone. "Because it rained" needs the main clause to complete it.' },
    { q: 'Which conjunction correctly joins these? "She studied hard ___ she passed the test."', a: 'so', w: ['but', 'or', 'nor'], why: 'So shows the result. Studying hard caused her to pass.' },
  ]) },
];

const GRADES = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5 };

/* ------------------------------------------------------------ the climb
   Six benchmarks per grade, so levels follow the strands: decoding and
   fluency first, then vocabulary and word parts, then the conventions
   benchmark that carries the grade's spelling and grammar skills.       */

const LEVELS = {
  1: [
    { n: 1, name: 'Sounds and Patterns', topics: ['w1-decode'] },
    { n: 2, name: 'Sight Words', topics: ['w1-sight'] },
    { n: 3, name: 'Word Meanings', topics: ['w1-vocab', 'w1-clues'] },
    { n: 4, name: 'Word Endings', topics: ['w1-endings'] },
    { n: 5, name: 'Capitals and Sentences', topics: ['w1-rules'] },
    { n: 6, name: 'Champion Round', topics: '*', boss: true },
  ],
  2: [
    { n: 1, name: 'Vowel Teams', topics: ['w2-decode'] },
    { n: 2, name: 'Reading Smoothly', topics: ['w2-fluency'] },
    { n: 3, name: 'Word Meanings', topics: ['w2-vocab', 'w2-clues'] },
    { n: 4, name: 'Base Words and Affixes', topics: ['w2-affix'] },
    { n: 5, name: 'Plurals and Contractions', topics: ['w2-rules'] },
    { n: 6, name: 'Champion Round', topics: '*', boss: true },
  ],
  3: [
    { n: 1, name: 'Roots and Long Words', topics: ['w3-decode'] },
    { n: 2, name: 'Tricky Words', topics: ['w3-fluency'] },
    { n: 3, name: 'Academic Words', topics: ['w3-vocab'] },
    { n: 4, name: 'Greek and Latin Roots', topics: ['w3-roots'] },
    { n: 5, name: 'Many Meanings', topics: ['w3-meaning'] },
    { n: 6, name: 'Irregular Plurals and Verbs', topics: ['w3-rules'] },
    { n: 7, name: 'Champion Round', topics: '*', boss: true },
  ],
  4: [
    { n: 1, name: 'Long Word Workshop', topics: ['w4-decode'] },
    { n: 2, name: 'Tricky Spellings', topics: ['w4-fluency'] },
    { n: 3, name: 'Academic Words', topics: ['w4-vocab'] },
    { n: 4, name: 'Roots and Affixes', topics: ['w4-roots'] },
    { n: 5, name: 'Figurative Language', topics: ['w4-figurative'] },
    { n: 6, name: 'Sentences and Agreement', topics: ['w4-rules'] },
    { n: 7, name: 'Champion Round', topics: '*', boss: true },
  ],
  5: [
    { n: 1, name: 'Morphology', topics: ['w5-decode'] },
    { n: 2, name: 'Words People Misspell', topics: ['w5-fluency'] },
    { n: 3, name: 'Academic Words', topics: ['w5-vocab'] },
    { n: 4, name: 'Affixes and Parts of Speech', topics: ['w5-roots'] },
    { n: 5, name: 'Shades of Meaning', topics: ['w5-meaning'] },
    { n: 6, name: 'Clauses and Tense', topics: ['w5-rules'] },
    { n: 7, name: 'Champion Round', topics: '*', boss: true },
  ],
};

function topicsFor(grade, L) {
  const all = GRADES[grade];
  if (L.topics === '*') return all;
  return all.filter(t => L.topics.includes(t.id));
}

/* --------------------------------------------------------------- how to */
const HOW = {
  'w1-decode': { steps: ['Say the word slowly and listen for each sound.', 'Two letters can make one sound (sh, ch, th, wh) or blend (st, fr, cl).', 'A silent e at the end makes the vowel say its own name.'], eg: 'cake has a_e, so the a says its name. shop starts with the digraph sh.' },
  'w1-sight': { steps: ['Some words do not follow the sound rules.', 'They come up so often that you learn them by sight.', 'Look at the whole shape of the word, not just the letters.'], eg: 'said looks like it should rhyme with paid, but it does not. It is learned by sight.' },
  'w1-vocab': { steps: ['Think about where you have heard the word before.', 'Try each choice inside a sentence.', 'Pick the one that still makes sense.'], eg: 'Enormous fits "an enormous elephant", so it means very big.' },
  'w1-endings': { steps: ['Cover the ending and look at the word that is left.', 'That is the base word.', '-ed means it already happened, -ing means it is happening now.'], eg: 'jumped is jump + ed, so it already happened.' },
  'w1-clues': { steps: ['Read the whole sentence, not just the hard word.', 'Look for what the person did or how they felt.', 'That clue tells you what the word means.'], eg: 'The puppy hid, so timid must mean shy.' },
  'w1-rules': { steps: ['Sentences start with a capital, and so do names of people and places.', 'A complete sentence tells who AND what they did.', 'An apostrophe and s show that something belongs to someone.'], eg: 'My friend Sara lives in Miami. Capital M, capital S, capital M.' },
  'w2-decode': { steps: ['Two vowels together often make one sound: oo, ea, ou.', 'Diphthongs glide from one sound to another: oi, oy, ow.', 'Clap the word to count its syllables.'], eg: 'rabbit claps twice: rab • bit.' },
  'w2-fluency': { steps: ['Break a longer word into syllables before you read it.', 'Read each part, then push them together.', 'The more you do it, the less you need to stop.'], eg: 'basket reads as bas • ket.' },
  'w2-vocab': { steps: ['These are the words used when talking about books and school.', 'Match the word to what a person actually does.', 'The author writes; the illustrator draws.'], eg: 'To predict is to say what you think will happen next.' },
  'w2-affix': { steps: ['A prefix goes on the front and changes the meaning.', 'A suffix goes on the end.', 'Take the affix off and the base word is left.'], eg: 'un- means not, so unhappy means not happy.' },
  'w2-clues': { steps: ['The rest of the sentence is the clue.', 'Ask what happened because of the word.', 'Test your guess by putting it in place of the word.'], eg: 'The heavy truck crossed safely, so sturdy means strong.' },
  'w2-rules': { steps: ['A word ending in consonant + y changes y to i and adds -es.', 'An apostrophe stands for the letters left out of a contraction.', 'For a plural already ending in s, the apostrophe goes after the s.'], eg: 'baby becomes babies. do not becomes don’t.' },
  'w3-decode': { steps: ['Long words are built from parts you already know.', 'Find the root first, then the prefix and suffix.', '-ful, -less and -est change what kind of word it is.'], eg: 'joy + -ful = joyful, an adjective meaning full of joy.' },
  'w3-fluency': { steps: ['Some very common words are spelled oddly.', 'Look carefully at the middle letters, which is where mistakes happen.', 'Write it out a few times to fix the pattern.'], eg: 'because, through and friend all break the usual rules.' },
  'w3-vocab': { steps: ['Academic words appear in every subject, not just reading.', 'Think about what the teacher asks you to DO.', 'Observe means watch, compare means look for likenesses.'], eg: 'To describe is to tell what something is like.' },
  'w3-roots': { steps: ['A root is the core of a word and carries its meaning.', 'Many roots come from Greek and Latin.', 'One root unlocks a whole family of words.'], eg: 'port means carry, which is why transport, portable and export are related.' },
  'w3-meaning': { steps: ['Some words have more than one meaning.', 'The sentence around the word tells you which one.', 'Try each meaning and keep the one that fits.'], eg: 'Bark is tree covering in one sentence and a dog sound in another.' },
  'w3-rules': { steps: ['Some plurals do not just add -s.', 'Some past tenses do not just add -ed.', 'These have to be learned one by one.'], eg: 'child becomes children. go becomes went.' },
  'w4-decode': { steps: ['Split a long word into syllables to read or spell it.', 'Every syllable has one vowel sound.', 'Say the parts, then join them.'], eg: 'information is in • for • ma • tion.' },
  'w4-fluency': { steps: ['These words are misspelled more than any others.', 'Watch the double letters and the quiet vowels.', 'Say the word the way it is spelled to help remember it.'], eg: 'necessary has one c and two s letters.' },
  'w4-vocab': { steps: ['Academic words tell you what a task is asking.', 'Identify means name it; determine means work it out.', 'Support means give evidence, not hold something up.'], eg: 'Contrast asks for differences; compare asks for likenesses.' },
  'w4-roots': { steps: ['Split the word into prefix and root.', 'Work out what each part means.', 'Put the meanings together to get the whole word.'], eg: 'trans (across) + port (carry) = transport, to carry across.' },
  'w4-figurative': { steps: ['Figurative language does not mean exactly what it says.', 'A simile uses like or as; a metaphor says one thing IS another.', 'Ask what picture the writer is painting.'], eg: '"The classroom was a zoo" means it was wild, not full of animals.' },
  'w4-rules': { steps: ['A sentence needs a subject and a verb to be complete.', 'Two sentences joined with nothing between them is a run-on.', 'Match the verb to the real subject, ignoring the phrase in between.'], eg: '"The box of books is heavy": the subject is box, so the verb is is.' },
  'w5-decode': { steps: ['Even the longest words are built from familiar parts.', 'Find the root, then peel off prefixes and suffixes.', 'Spell it part by part rather than letter by letter.'], eg: 'responsibility is re • spon • si • bil • i • ty.' },
  'w5-fluency': { steps: ['These spellings catch adults out too.', 'Watch for double letters and silent letters.', 'Learn them in small groups rather than all at once.'], eg: 'embarrass has two r letters and two s letters.' },
  'w5-vocab': { steps: ['These words describe thinking itself.', 'Analyze means take apart, summarize means boil down.', 'Evidence is fact, not opinion.'], eg: 'To conclude is to decide after looking at the facts.' },
  'w5-roots': { steps: ['Suffixes change what kind of word it is, not just the meaning.', '-tion and -ment make nouns; -ly makes adverbs.', '-able and -ous make adjectives; -ify makes verbs.'], eg: 'celebrate is a verb; celebration is a noun.' },
  'w5-meaning': { steps: ['Words that mean nearly the same thing differ in strength.', 'Think about how strong the feeling is.', 'Think too about whether the word is positive or negative.'], eg: 'Annoyed, irritated and furious all mean angry, but furious is strongest.' },
  'w5-rules': { steps: ['Keep tense and number consistent across a sentence.', 'Modals such as might, must and will show how certain something is.', 'An appositive renames a noun and takes commas on both sides.'], eg: 'My teacher, Mrs Lopez, reads to us daily.' },
};
