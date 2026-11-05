// Original hand-authored pixel art. Every character in a row is one pixel, keyed into PAL.
const PAL = {
  k: '#1c1626', h: '#4a2c1c', H: '#74482c', s: '#f2c494', S: '#d49a6a', w: '#ffffff',
  g: '#2f9e5a', G: '#1f6e44', p: '#34406e', P: '#252e52', b: '#6a3e24', B: '#3a2214',
  r: '#d83838', R: '#8e2030', y: '#f8c838', Y: '#c88820', o: '#e87828', O: '#a85018',
  c: '#d8a060', C: '#a87038', m: '#f8e088', t: '#3868d8', T: '#1c3488', n: '#a02850',
  a: '#9aa0b0', A: '#585e70', l: '#dfe4ee', x: '#58d8f8', u: '#8a5a30', U: '#5c3a1c',
  v: '#8a50c8', V: '#5c3090', d: '#58b048', D: '#2c7038',
};

const mirror = rows => rows.map(r => r + [...r].reverse().join(''));

const HEAD_FRONT = mirror([
  '......kk', '....kkhk', '...khHhh', '..khHHHH', '.khHHHHh', '.khhhhhh',
  '.khhshhs', '.khsssss', '.ksskwss', '.ksskwss', '.kSsssss', '..kSsssk', '...kkSSS',
]);
const HEAD_BACK = mirror([
  '......kk', '....kkhk', '...khHhh', '..khHHHH', '.khHHHHh', '.khhhHHh',
  '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.kShhhhh', '..kShhhh', '...kkSSS',
]);
const BODY = mirror([
  '...kgggg', '..kggggg', '..kgGggg', '.ksgkggg', '.ksskggg', '..kkkggg',
  '...kpppp', '...kpPpp',
]);
const LEGS = {
  stand: ['...kppkkkkppk...', '...kbbbkkbbbk...', '...kkkkkkkkkk...'],
  a: ['...kppkkkkbbk...', '...kbbbkkkkkk...', '...kkkkk........'],
  b: ['...kbbkkkkppk...', '...kkkkkkbbbk...', '........kkkkk...'],
};
const HEAD_SIDE = [
  '......kkkk......', '....kkhhhhkk....', '...khHHHHHhhk...', '..khHHHHHHHhhk..',
  '.khHHHHHHHhhhhk.', '.khhhhhhhhhhhhk.', '.khhhhhhshhsshk.', '.khhhhhsssssssk.',
  '.khhhksssskwssk.', '.khhkssssskwssk.', '.kShkSsssssssk..', '..kkkSsssssk....',
  '...kkkSSSkkk....',
];
const BODY_SIDE = [
  '....kggggggk....', '...kgggggggk....', '...kgGgggggk....', '...kgGkssggk....',
  '...kgGksskgk....', '...kkgkkkkgk....', '....kppppppk....', '....kpPpppk.....',
];
const LEGS_SIDE = {
  stand: ['....kppkppk.....', '....kbbbbbbk....', '....kkkkkkkk....'],
  a: ['...kppkkkppk....', '...kbbbkkbbbk...', '...kkkk..kkkk...'],
  b: ['.....kpppk......', '.....kbbbbk.....', '.....kkkkkk.....'],
};

const SPRITES = {
  front: f => [...HEAD_FRONT, ...BODY, ...LEGS[f]],
  back: f => [...HEAD_BACK, ...BODY, ...LEGS[f]],
  side: f => [...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE[f]],

  wife: mirror([
    '......kk', '....kkhk', '...khHhh', '..khHHHH', '.khHHHHh', '.khhhhhh',
    '.khhshhs', '.khsssss', '.khskwss', '.khskwss', '.khSssss', '.khhSssk', '.khhkSSS',
    '.khkvvvv', '..kvvvvv', '..ksvvvv', '.ksskvvv', '..kkvvvv', '...kvvvv', '..kvvvvv',
    '..kVvvvv', '..kkkkkk', '...kssks', '...kkkkk',
  ]),
  kid: mirror([
    '....kk', '..kkhh', '.khHHh', 'kkhHHH', 'khkhhh', 'khkshs', '.kksss', '..ksks',
    '..kSss', '...kSS', '..kyyy', '.ksyyy', '..kyYy', '..kyyy', '...kss', '...kkk',
  ]),
  man: mirror([
    '.....kkk', '...kkaaa', '..kaalla', '..kaalll', '.kalllll', '.kaasssa',
    '.ksskkss', '.kssssss', '..klllll', '.klllsll', '.klllsll', '.klllsss',
    '.ksllkll', '.ksllkll', '..kklkrr', '...krrrr', '..krrrrr', '..krRrrr',
    '..krrrrr', '..kkkkkk', '...kbbbk', '...kkkkk',
  ]),

  pizza: [
    '...cccccccc...', '..cCCCCCCCCc..', '..kmmrmmmmmk..', '...kmmmmrmk...', '...kmrmmmmk...',
    '....kmmmmk....', '....kmmrmk....', '.....kmmk.....', '.....kmmk.....', '......kk......',
  ],
  wholePizza: [
    '.....cccccc.....', '...ccmmmmmmcc...', '..cmmrmmmmrmmc..', '.cmmmmmmmmmmmmc.',
    '.cmrmmmrmmmmrmc.', 'cmmmmmmmmmmmmmmc', 'cmmmrmmmmrmmmmmc', '.cmmmmmmmmmmmmc.',
    '.cmmrmmmrmmmrmc.', '..cmmmmmmmmmmc..', '...ccmmmmmmcc...', '.....cccccc.....',
  ],
  guitar: [
    '...................uu', '..................uuk', '.................uk..',
    '................uk...', '...............uk....', '..............uk.....',
    '.............uk......', '............uk.......', '......kkk..uk........',
    '....kkrrrkuk.........', '...krrrrkkk..........', '...krrkkrrk..........',
    '..krrrkkrrrk.........', '.krrrrrrrrrk.........', '.krrRrrrrrrk.........',
    '..krrRRrrrk..........', '...kkkkkkk...........',
  ],
  ball: ['..kkkkk..', '.kwwwwwk.', 'kwwkkkwwk', 'kwkkkkkwk', 'kwwkkkwwk', 'kkwwwwwkk', '.kkwwwkk.', '..kkkkk..'],
  laptop: [
    '.kkkkkkkkkkkk.', '.kaaaaaaaaaak.', '.katTTTxxTtak.', '.kaxxTTTttTak.', '.katTxxTTTtak.',
    '.kaTTTTxxTtak.', '.kaaaaaaaaaak.', 'kAAAAAAAAAAAAk', 'kkkkkkkkkkkkkk',
  ],
  hat: [
    '...kkkkkkkk...', '..klllllllllk.', '.kllllllllllk.', '.klllllllllllk', '.klllllllllllk',
    '..kllllllllk..', '..kaaaaaaaak..', '..kkkkkkkkkk..',
  ],
  flag: [
    'kk..............', 'krrrrrrrrrrrr...', 'krrwrrrrwwrrr...', 'krwwwrrrrwrrr...', 'krrwrrrrrwrrr...',
    'krrrrrrrwwwrr...', 'krrrrrrrrrrrr...', 'kk..............', 'kk..............', 'kk..............',
    'kk..............', 'kk..............', 'kk..............', 'kk..............', 'kk..............',
    'kk..............', 'kk..............', 'kk..............',
  ],
  heart: ['.kk.kk.', 'krrkrrk', 'krrrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'],
  heartEmpty: ['.kk.kk.', 'kAAkAAk', 'kAAAAAk', 'kAAAAAk', '.kAAAk.', '..kAk..', '...k...'],
  bug: ['.k..k..', '..kk...', '.krrk.k', 'krkrrk.', 'krrkrrk', '.krrrk.', 'k.kk..k'],
  flame: ['...r....', '..rrr...', '..ryr.r.', '.rryrrr.', '.ryyyrr.', 'rrymyyrr', '.rymmyr.', '..rrrr..'],
  pineapple: ['..d.dd..', '...dd...', '..dDd...', '..kkkk..', '.kyYyyk.', '.kYyYyk.', '.kyYyyk.', '.kYyYyk.', '..kkkk..'],
  note: ['...kkkk.', '...kkkk.', '...k..k.', '...k..k.', '.kkk.kkk', 'kkkkkkkk', '.kk...kk'],
  bugIcon: ['.k...k.', '..k.k..', '.kkkkk.', 'kkwkwkk', '.kkkkk.', 'k.kkk.k', '.k.k.k.'],
};

const SPR = {
  draw(ctx, rows, x, y, overrides = {}, flip = false) {
    const w = rows[0].length;
    rows.forEach((row, ry) => {
      for (let i = 0; i < row.length; i++) {
        const key = row[i];
        if (key === '.') continue;
        ctx.fillStyle = overrides[key] || PAL[key];
        ctx.fillRect(x + (flip ? w - 1 - i : i), y + ry, 1, 1);
      }
    });
  },
  canvas(rows, overrides) {
    const c = document.createElement('canvas');
    c.width = Math.max(...rows.map(r => r.length));
    c.height = rows.length;
    SPR.draw(c.getContext('2d'), rows, 0, 0, overrides);
    return c;
  },
  dataURL(rows, overrides) { return SPR.canvas(rows, overrides).toDataURL(); },

  // Each pose is a palette swap of the same Nacho, plus the props for that side of him.
  pose(name) {
    const c = document.createElement('canvas');
    c.width = 44; c.height = 36;
    const g = c.getContext('2d');
    const body = SPRITES.front('stand');
    const X = 14, Y = 11;
    const SHIRTS = {
      dev: {},
      bard: { g: '#c8405a', G: '#8e2848' },
      dad: { g: '#f0b838', G: '#c08820' },
      striker: { g: '#e87828', G: '#a85018', p: '#f4f4f4', P: '#c8c8d8' },
      chef: { g: '#f2f2f6', G: '#c0c4d4', p: '#3a3a44', P: '#26262e' },
      coach: { g: '#3868d8', G: '#1c3488' },
    };
    SPR.draw(g, body, X, Y, SHIRTS[name]);
    if (name === 'dev') SPR.draw(g, SPRITES.laptop, X + 1, Y + 16);
    if (name === 'bard') SPR.draw(g, SPRITES.guitar, X - 3, Y + 6);
    if (name === 'dad') SPR.draw(g, SPRITES.kid, X - 12, Y + 9);
    if (name === 'striker') {
      SPR.draw(g, SPRITES.ball, X + 16, Y + 16);
      g.fillStyle = '#fff'; g.fillRect(X + 6, Y + 15, 1, 3); g.fillRect(X + 8, Y + 15, 2, 3);
    }
    if (name === 'chef') {
      SPR.draw(g, SPRITES.hat, X + 1, Y - 6);
      SPR.draw(g, SPRITES.wholePizza, X + 15, Y + 2);
      g.fillStyle = PAL.s; g.fillRect(X + 15, Y + 14, 4, 2);
    }
    if (name === 'coach') {
      SPR.draw(g, SPRITES.flag, X + 15, Y - 1);
      g.fillStyle = PAL.y; g.fillRect(X + 7, Y + 15, 2, 2);
    }
    return c;
  },
};
