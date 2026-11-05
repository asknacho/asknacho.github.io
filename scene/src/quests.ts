export interface Quest {
  title: string;
  kind: string;
  bio: string;
  stats: [name: string, value: number][];
  weakTo: string;
  links: [label: string, href: string][];
}

const RECRUIT: [string, string] = ['Recruit Nacho →', 'https://www.linkedin.com/in/ignaciomoralesm'];
const GITHUB: [string, string] = ['GitHub →', 'https://github.com/ignaciomoralesm'];
const SCOREPACE: [string, string] = ['Play Scorepace →', 'https://scorepace.com'];

export const QUESTS = {
  hero: {
    title: "Hola, I'm Nacho", kind: 'Class: Tech Lead, Bard, Dad',
    bio: 'Ignacio Morales. Senior software engineer in Barcelona who loves pizza, coding and helping people challenge themselves.',
    stats: [['Code', 92], ['Curls', 99], ['Sleep', 12]], weakTo: '"Quick question?"', links: [RECRUIT, GITHUB],
  },
  code: {
    title: 'Code', kind: 'Class: Senior Software Engineer',
    bio: '8+ years shipping. Led 8 engineers on a platform for 2M+ users. Cut deploy times by 60%.',
    stats: [['Code', 92], ['Lead', 88], ['Meetings', 21]], weakTo: '"Quick question?"', links: [RECRUIT, GITHUB],
  },
  scorepace: {
    title: 'Scorepace', kind: 'Class: Side Quest',
    bio: 'I built scorepace.com to help myself learn piano, rather than simply practising.',
    stats: [['Useful', 90], ['Piano', 16], ['Excuses', 88]], weakTo: 'Actually practising', links: [SCOREPACE],
  },
  music: {
    title: 'Music', kind: 'Class: Guitarist, Apprentice Pianist',
    bio: 'I play guitar and I am learning piano. The neighbours are being very brave.',
    stats: [['Guitar', 74], ['Piano', 16], ['Rhythm', 60]], weakTo: 'Left hand', links: [SCOREPACE],
  },
  family: {
    title: 'Offline Party', kind: 'Class: Paladin of the Household',
    bio: 'A beautiful wife, a beautiful daughter, and a baby boy joining the party soon.',
    stats: [['Love', 99], ['Patience', 70], ['Sleep', 12]], weakTo: 'One more episode', links: [],
  },
  baby: {
    title: 'New Party Member', kind: 'Class: Unknown (baby boy)',
    bio: 'Joining soon. Patch notes unavailable. Release date set by the customer.',
    stats: [['Cuteness', 99], ['Volume', 95], ['Party Sleep', 2]], weakTo: 'Nothing yet', links: [],
  },
  barcelona: {
    title: 'Barcelona', kind: 'Class: Resident',
    bio: 'Home base. The cathedral and my side projects share a release schedule.',
    stats: [['Sun', 90], ['Views', 95], ['Parking', 3]], weakTo: 'Tourists at 5pm', links: [],
  },
  football: {
    title: 'Football', kind: 'Class: Armchair Scholar',
    bio: 'I live in Barcelona and like football, which here counts as a personality.',
    stats: [['Opinions', 99], ['Tactics', 80], ['Cardio', 19]], weakTo: 'Extra time on a school night', links: [],
  },
  pizza: {
    title: 'Pizza', kind: 'Class: Evaluator, Grade S',
    bio: 'Taken with the seriousness others reserve for system design.',
    stats: [['Cheese', 97], ['Dough', 66], ['Restraint', 8]], weakTo: 'Pineapple', links: [],
  },
  challenge: {
    title: 'Challenge Yourself', kind: 'Class: Coach',
    bio: 'I love helping people challenge themselves. Was that really your best attempt?',
    stats: [['Courage', 90], ['Honesty', 94], ['Chill', 30]], weakTo: 'People saying "I can\'t"', links: [RECRUIT],
  },
  projects: {
    title: 'The Projects', kind: 'Quest log',
    bio: 'Scorepace is the current side quest. Everything else lives on GitHub.',
    stats: [['Curiosity', 95], ['Finished', 40], ['Started', 99]], weakTo: 'One more side project', links: [SCOREPACE, GITHUB],
  },
} satisfies Record<string, Quest>;

export type QuestId = keyof typeof QUESTS;

export interface Spot {
  quest: QuestId;
  label: string;
  /** x, y, width, height in art pixels. */
  box: [number, number, number, number];
  /** Phone only: the slice of art to show as this button. */
  slice?: [number, number, number, number];
}

export const SCENE_SPOTS: Spot[] = [
  { quest: 'hero', label: 'About Nacho', box: [220, 175, 210, 350] },
  { quest: 'family', label: 'The family', box: [495, 320, 300, 200] },
  { quest: 'baby', label: 'The baby boy', box: [800, 330, 170, 190] },
];

export const CITY_SPOT: Spot = { quest: 'barcelona', label: 'Barcelona', box: [1090, 310, 480, 240] };

export const CARD_SPOTS: Spot[] = [
  { quest: 'code', label: 'Code: builds useful things', box: [20, 570, 380, 235], slice: [10, 566, 402, 246] },
  { quest: 'scorepace', label: 'Scorepace: made to help me learn piano', box: [412, 570, 378, 235], slice: [408, 566, 386, 246] },
  { quest: 'music', label: 'Music: guitar and piano practice', box: [802, 570, 368, 235], slice: [796, 566, 380, 246] },
  { quest: 'family', label: 'Offline party: wife, daughter and baby boy soon', box: [1184, 570, 382, 235], slice: [1178, 566, 398, 246] },
];

export const STRIP_SPOTS: Spot[] = [
  { quest: 'barcelona', label: 'Barcelona', box: [50, 862, 195, 70], slice: [50, 862, 195, 70] },
  { quest: 'football', label: 'Football', box: [262, 862, 175, 70], slice: [262, 862, 175, 70] },
  { quest: 'pizza', label: 'Pizza', box: [466, 862, 160, 70], slice: [466, 862, 160, 70] },
  { quest: 'challenge', label: 'Help people challenge themselves', box: [645, 862, 450, 70], slice: [645, 862, 450, 70] },
  { quest: 'projects', label: 'Explore the projects', box: [1135, 852, 415, 92], slice: [1135, 852, 415, 92] },
];
