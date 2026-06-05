// Icon library for The Seal Press. Each icon is the central debossed
// motif of a seal. The model interprets the `prompt` description into
// a debossed carving. Keywords are used by the LLM oracle to match an
// inscription to a fitting icon.
//
// Two registers mixed deliberately: ARCHAIC (timeless symbols — tree,
// eye, key) and MODERN (the conflict — phone, sneaker, wifi).

export interface IconDef {
  key: string;
  name: string;
  zhName: string;
  category: 'botanical' | 'body' | 'celestial' | 'object' | 'animal' | 'modern' | 'symbol';
  /** Prose used inside the gen-image prompt as the central icon's description. */
  prompt: string;
  /** Loose tags the LLM matches against an inscription. */
  keywords: string[];
}

export const ICONS: IconDef[] = [
  // ─── Botanical ──────────────────────────────────────────────
  { key: 'olive',    name: 'Olive tree',  zhName: '橄榄树', category: 'botanical',
    prompt: 'an olive tree with branches and small leaves, slender trunk',
    keywords: ['peace', 'memory', 'parent', 'home', 'old', 'mother', 'father', 'family'] },
  { key: 'wheat',    name: 'Wheat',       zhName: '麦穗',   category: 'botanical',
    prompt: 'a single wheat stalk with three rows of grain heads, slender upright',
    keywords: ['summer', 'wait', 'patient', 'still', 'work', 'harvest', 'enough'] },
  { key: 'lotus',    name: 'Lotus',       zhName: '莲花',   category: 'botanical',
    prompt: 'a lotus flower fully open with overlapping petals',
    keywords: ['bloom', 'open', 'forgive', 'rebirth', 'serenity', 'spring'] },
  { key: 'rose',     name: 'Rose',        zhName: '玫瑰',   category: 'botanical',
    prompt: 'a single rose flower with leaves on a thorned stem',
    keywords: ['love', 'lover', 'kiss', 'heart', 'romance', 'desire', 'wound'] },
  { key: 'feather',  name: 'Feather',     zhName: '羽毛',   category: 'botanical',
    prompt: 'a single feather with a clean spine and fine barbs',
    keywords: ['quiet', 'soft', 'gone', 'memory', 'gentle', 'fragile', 'unspoken'] },

  // ─── Body ───────────────────────────────────────────────────
  { key: 'eye',      name: 'Open eye',    zhName: '眼',     category: 'body',
    prompt: 'a single human eye, almond-shaped with lashes and a clear pupil',
    keywords: ['saw', 'see', 'witness', 'watch', 'look', 'awake', 'realize'] },
  { key: 'hand',     name: 'Open hand',   zhName: '手',     category: 'body',
    prompt: 'an open right hand palm forward with fingers spread',
    keywords: ['help', 'give', 'reach', 'touch', 'last', 'goodbye', 'hold'] },
  { key: 'heart',    name: 'Heart',       zhName: '心',     category: 'body',
    prompt: 'an anatomical heart with visible veins, simple iconic carving',
    keywords: ['love', 'broken', 'feel', 'mother', 'father', 'ache', 'love'] },

  // ─── Celestial ──────────────────────────────────────────────
  { key: 'moon',     name: 'Moon',        zhName: '月',     category: 'celestial',
    prompt: 'a crescent moon turned to the side, with a small star tucked beside it',
    keywords: ['night', 'sleep', 'dream', '3am', 'insomnia', 'late', 'cycle'] },
  { key: 'sun',      name: 'Sun',         zhName: '太阳',   category: 'celestial',
    prompt: 'a radiant sun with rays alternating straight and wavy',
    keywords: ['morning', 'warm', 'light', 'joy', 'shine', 'finally', 'spring'] },
  { key: 'star',     name: 'Star',        zhName: '星',     category: 'celestial',
    prompt: 'a single eight-pointed star',
    keywords: ['hope', 'pray', 'wish', 'guide', 'someone', 'far', 'birth'] },

  // ─── Object · timeless ──────────────────────────────────────
  { key: 'key',      name: 'Key',         zhName: '钥匙',   category: 'object',
    prompt: 'an old skeleton key with a looped ornamental bow and a stepped bit',
    keywords: ['home', 'door', 'left', 'apartment', 'lost', 'open', 'unlock'] },
  { key: 'anchor',   name: 'Anchor',      zhName: '锚',     category: 'object',
    prompt: 'a ship anchor with thick cross-bar and looped ring at the top',
    keywords: ['stay', 'leave', 'hold', 'sink', 'ground', 'depart', 'travel'] },
  { key: 'lantern',  name: 'Lantern',     zhName: '灯',     category: 'object',
    prompt: 'an old hanging lantern with a small flame inside an ornate metal frame',
    keywords: ['wait', 'alone', 'late', 'lit', 'searching', 'guide'] },
  { key: 'chalice',  name: 'Chalice',     zhName: '圣杯',   category: 'object',
    prompt: 'a tall chalice cup with a stem and a small flame at the rim',
    keywords: ['drink', 'toast', 'wine', 'tonight', 'gift', 'communion'] },
  { key: 'scroll',   name: 'Scroll',      zhName: '卷轴',   category: 'object',
    prompt: 'a half-unrolled scroll with a few inscribed lines',
    keywords: ['letter', 'write', 'unsent', 'page', 'word', 'unsaid'] },

  // ─── Animal ─────────────────────────────────────────────────
  { key: 'swallow',  name: 'Swallow',     zhName: '燕',     category: 'animal',
    prompt: 'a swallow bird in flight, wings spread, forked tail',
    keywords: ['news', 'leave', 'fly', 'far', 'parent', 'home', 'message'] },
  { key: 'wolf',     name: 'Wolf',        zhName: '狼',     category: 'animal',
    prompt: 'a wolf head in profile with mane',
    keywords: ['hunger', 'fear', 'alone', 'stranger', 'wild', 'instinct'] },
  { key: 'fish',     name: 'Fish',        zhName: '鱼',     category: 'animal',
    prompt: 'a fish swimming with scales and a fanned tail',
    keywords: ['silent', 'drift', 'cold', 'swim', 'memory', 'water'] },
  { key: 'bee',      name: 'Bee',         zhName: '蜜蜂',   category: 'animal',
    prompt: 'a bee with delicate wings and a segmented body',
    keywords: ['work', 'busy', 'sting', 'sweet', 'small', 'collective'] },

  // ─── Symbol ─────────────────────────────────────────────────
  { key: 'spiral',   name: 'Spiral',      zhName: '螺旋',   category: 'symbol',
    prompt: 'a tight labyrinthine spiral winding inward in a single continuous line',
    keywords: ['return', 'always', 'cycle', 'pattern', 'lost', 'inward', 'again'] },
  { key: 'mountain', name: 'Mountains',   zhName: '群山',   category: 'symbol',
    prompt: 'three peaks of a mountain range with a small sun behind the centre peak',
    keywords: ['journey', 'climb', 'far', 'old', 'home', 'east', 'past'] },

  // ─── Modern · the conflict ─────────────────────────────────
  { key: 'phone',    name: 'Smartphone',  zhName: '手机',   category: 'modern',
    prompt: 'a modern smartphone, a flat thin rectangle in portrait with a small circular camera lens',
    keywords: ['call', 'text', 'screen', 'message', 'phone', 'ignore', 'read', 'mother'] },
  { key: 'coffee',   name: 'Coffee',      zhName: '咖啡',   category: 'modern',
    prompt: 'a takeaway paper coffee cup with a domed lid and a cardboard sleeve, steam rising',
    keywords: ['morning', 'work', 'tired', 'cup', 'cafe', 'small', 'ritual', 'daily'] },
  { key: 'sneaker',  name: 'Sneaker',     zhName: '球鞋',   category: 'modern',
    prompt: 'a high-top basketball sneaker in side profile with laces and a thick sole',
    keywords: ['street', 'walk', 'run', 'youth', 'go', 'shoe', 'move'] },
  { key: 'headphones', name: 'Headphones', zhName: '耳机', category: 'modern',
    prompt: 'a pair of over-ear headphones in front view with a curved headband connecting two round earcups',
    keywords: ['music', 'song', 'alone', 'cancel', 'tune', 'noise'] },
  { key: 'wifi',     name: 'Signal',      zhName: '信号',   category: 'modern',
    prompt: 'a single WiFi signal symbol — a small dot at the bottom with three concentric arcs fanning upward',
    keywords: ['connect', 'signal', 'reach', 'far', 'remote', 'between', 'cloud'] },
  { key: 'bike',     name: 'Bicycle',     zhName: '自行车', category: 'modern',
    prompt: 'a road bicycle in side view with two equal wheels, diamond frame, drop handlebars',
    keywords: ['ride', 'commute', 'wind', 'speed', 'route', 'forget'] },
];

export function iconByKey(key: string): IconDef {
  return ICONS.find(i => i.key === key) ?? ICONS[0];
}
