import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const petsDir = path.resolve(__dirname, '../pets');

function petSvg(primary, secondary, accent, ears = 'round', tail = 'short', extras = []) {
  const earPath = ears === 'pointy'
    ? `<ellipse cx="45" cy="40" rx="12" ry="22" fill="${primary}" transform="rotate(-20 45 40)"/>
       <ellipse cx="105" cy="40" rx="12" ry="22" fill="${primary}" transform="rotate(20 105 40)"/>
       <ellipse cx="47" cy="45" rx="6" ry="14" fill="${secondary}" transform="rotate(-20 47 45)"/>
       <ellipse cx="103" cy="45" rx="6" ry="14" fill="${secondary}" transform="rotate(20 103 45)"/>`
    : ears === 'floppy'
    ? `<ellipse cx="40" cy="55" rx="14" ry="25" fill="${primary}" transform="rotate(-30 40 55)"/>
       <ellipse cx="110" cy="55" rx="14" ry="25" fill="${primary}" transform="rotate(30 110 55)"/>
       <ellipse cx="42" cy="60" rx="7" ry="16" fill="${secondary}" transform="rotate(-30 42 60)"/>
       <ellipse cx="108" cy="60" rx="7" ry="16" fill="${secondary}" transform="rotate(30 108 60)"/>`
    : `<ellipse cx="48" cy="35" rx="14" ry="14" fill="${primary}"/>
       <ellipse cx="102" cy="35" rx="14" ry="14" fill="${primary}"/>
       <ellipse cx="50" cy="37" rx="8" ry="8" fill="${secondary}"/>
       <ellipse cx="100" cy="37" rx="8" ry="8" fill="${secondary}"/>`;

  const tailPath = tail === 'long'
    ? `<path d="M 125 100 Q 150 80 140 55" stroke="${primary}" stroke-width="10" fill="none" stroke-linecap="round"/>`
    : tail === 'bushy'
    ? `<ellipse cx="135" cy="90" rx="18" ry="12" fill="${primary}" transform="rotate(20 135 90)"/>
       <ellipse cx="138" cy="88" rx="8" ry="5" fill="${secondary}" transform="rotate(20 138 88)"/>`
    : tail === 'curly'
    ? `<path d="M 120 95 Q 140 90 135 110 Q 130 120 115 115" stroke="${primary}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="128" cy="100" rx="8" ry="6" fill="${primary}"/>`;

  const extraPaths = extras.map(e => {
    if (e === 'blush') return `<ellipse cx="55" cy="80" rx="6" ry="3" fill="${accent}" opacity="0.5"/><ellipse cx="95" cy="80" rx="6" ry="3" fill="${accent}" opacity="0.5"/>`;
    if (e === 'bow') return `<path d="M 75 38 L 65 32 L 65 44 Z" fill="${accent}"/><path d="M 75 38 L 85 32 L 85 44 Z" fill="${accent}"/><circle cx="75" cy="38" r="3" fill="${secondary}"/>`;
    if (e === 'collar') return `<rect x="60" y="92" width="30" height="5" rx="2" fill="${accent}"/><circle cx="75" cy="97" r="3" fill="${secondary}"/>`;
    if (e === 'bandana') return `<path d="M 55 90 L 95 90 L 88 100 L 75 105 L 62 100 Z" fill="${accent}"/><circle cx="70" cy="95" r="2" fill="${secondary}"/><circle cx="80" cy="95" r="2" fill="${secondary}"/>`;
    if (e === 'scarf') return `<rect x="58" y="88" width="34" height="8" rx="3" fill="${accent}"/><rect x="82" y="92" width="10" height="20" rx="2" fill="${accent}"/>`;
    if (e === 'hat') return `<ellipse cx="75" cy="28" rx="22" ry="5" fill="${accent}"/><path d="M 60 28 Q 75 5 90 28" fill="${accent}"/><rect x="60" y="26" width="30" height="4" fill="${secondary}"/>`;
    if (e === 'glasses') return `<circle cx="60" cy="68" r="10" stroke="${accent}" stroke-width="2.5" fill="none"/><circle cx="90" cy="68" r="10" stroke="${accent}" stroke-width="2.5" fill="none"/><line x1="70" y1="68" x2="80" y2="68" stroke="${accent}" stroke-width="2.5"/>`;
    if (e === 'patch') return `<ellipse cx="95" cy="75" rx="10" ry="8" fill="${secondary}" opacity="0.6"/>`;
    if (e === 'stripes') return `<line x1="60" y1="50" x2="90" y2="50" stroke="${secondary}" stroke-width="3" stroke-linecap="round" opacity="0.7"/><line x1="58" y1="58" x2="92" y2="58" stroke="${secondary}" stroke-width="3" stroke-linecap="round" opacity="0.7"/><line x1="60" y1="66" x2="90" y2="66" stroke="${secondary}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`;
    if (e === 'spots') return `<circle cx="60" cy="55" r="5" fill="${secondary}" opacity="0.6"/><circle cx="85" cy="60" r="6" fill="${secondary}" opacity="0.6"/><circle cx="70" cy="70" r="4" fill="${secondary}" opacity="0.6"/><circle cx="92" cy="78" r="3" fill="${secondary}" opacity="0.6"/>`;
    if (e === 'panda-eyes') return `<ellipse cx="60" cy="70" rx="12" ry="15" fill="${secondary}" transform="rotate(-10 60 70)"/><ellipse cx="90" cy="70" rx="12" ry="15" fill="${secondary}" transform="rotate(10 90 70)"/>`;
    return '';
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
  <!-- Tail -->
  ${tailPath}
  <!-- Body -->
  <ellipse cx="75" cy="110" rx="45" ry="30" fill="${primary}"/>
  <ellipse cx="75" cy="115" rx="30" ry="20" fill="${secondary}"/>
  <!-- Feet -->
  <ellipse cx="55" cy="135" rx="10" ry="6" fill="${primary}"/>
  <ellipse cx="95" cy="135" rx="10" ry="6" fill="${primary}"/>
  <!-- Ears -->
  ${earPath}
  <!-- Head -->
  <circle cx="75" cy="70" r="40" fill="${primary}"/>
  <ellipse cx="75" cy="78" rx="28" ry="22" fill="${secondary}"/>
  <!-- Extras (behind face) -->
  ${extras.includes('panda-eyes') || extras.includes('stripes') || extras.includes('spots') || extras.includes('patch') ? extraPaths : ''}
  <!-- Eyes -->
  <circle cx="62" cy="68" r="5" fill="#222"/>
  <circle cx="88" cy="68" r="5" fill="#222"/>
  <circle cx="64" cy="66" r="2" fill="#fff"/>
  <circle cx="90" cy="66" r="2" fill="#fff"/>
  <!-- Nose -->
  <ellipse cx="75" cy="78" rx="4" ry="3" fill="#333"/>
  <!-- Mouth -->
  <path d="M 75 81 Q 70 87 65 84" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M 75 81 Q 80 87 85 84" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <!-- Extras (front) -->
  ${extras.includes('panda-eyes') || extras.includes('stripes') || extras.includes('spots') || extras.includes('patch') ? '' : extraPaths}
  ${extras.includes('blush') ? `<ellipse cx="52" cy="80" rx="6" ry="3" fill="${accent}" opacity="0.5"/><ellipse cx="98" cy="80" rx="6" ry="3" fill="${accent}" opacity="0.5"/>` : ''}
  ${extras.includes('glasses') ? `<circle cx="62" cy="68" r="10" stroke="${accent}" stroke-width="2.5" fill="none"/><circle cx="88" cy="68" r="10" stroke="${accent}" stroke-width="2.5" fill="none"/><line x1="72" y1="68" x2="78" y2="68" stroke="${accent}" stroke-width="2.5"/>` : ''}
  ${extras.includes('bow') ? `<path d="M 75 36 L 62 28 L 62 44 Z" fill="${accent}"/><path d="M 75 36 L 88 28 L 88 44 Z" fill="${accent}"/><circle cx="75" cy="36" r="3" fill="${secondary}"/>` : ''}
  ${extras.includes('hat') ? `<ellipse cx="75" cy="32" rx="25" ry="5" fill="${accent}"/><path d="M 58 32 Q 75 5 92 32" fill="${accent}"/><rect x="58" y="30" width="34" height="4" fill="${secondary}"/>` : ''}
  ${extras.includes('collar') ? `<rect x="58" y="100" width="34" height="6" rx="3" fill="${accent}"/><circle cx="75" cy="106" r="4" fill="${secondary}"/>` : ''}
  ${extras.includes('bandana') ? `<path d="M 55 100 L 95 100 L 88 112 L 75 118 L 62 112 Z" fill="${accent}"/><circle cx="68" cy="106" r="2.5" fill="${secondary}"/><circle cx="82" cy="106" r="2.5" fill="${secondary}"/>` : ''}
  ${extras.includes('scarf') ? `<rect x="55" y="96" width="40" height="10" rx="4" fill="${accent}"/><rect x="80" y="102" width="12" height="24" rx="3" fill="${accent}"/>` : ''}
</svg>`;
}

const pets = [
  { id: 'pet-orange-cat', name: '橘猫', desc: '圆滚滚的橘猫，吃了睡睡了吃', primary: '#f4a460', secondary: '#ffe4c4', accent: '#ff6b6b', ears: 'pointy', tail: 'long', extras: ['stripes', 'collar'], mood: 'idle' },
  { id: 'pet-black-cat', name: '黑猫', desc: '神秘的小黑猫，夜晚的精灵', primary: '#333333', secondary: '#555555', accent: '#ffd700', ears: 'pointy', tail: 'long', extras: ['collar'], mood: 'idle' },
  { id: 'pet-calico-cat', name: '三花猫', desc: '花花的三花猫，性格傲娇', primary: '#f5deb3', secondary: '#ffffff', accent: '#8b4513', ears: 'pointy', tail: 'long', extras: ['spots', 'patch', 'bow'], mood: 'idle' },
  { id: 'pet-siamese-cat', name: '暹罗猫', desc: '蓝眼睛的优雅暹罗猫', primary: '#f5f5dc', secondary: '#e6d5a8', accent: '#4682b4', ears: 'pointy', tail: 'long', extras: ['blush'], mood: 'idle' },
  { id: 'pet-shiba-inu', name: '柴犬', desc: '微笑的小柴犬，表情包担当', primary: '#d2691e', secondary: '#fff8dc', accent: '#ffffff', ears: 'pointy', tail: 'curly', extras: ['blush', 'collar'], mood: 'happy' },
  { id: 'pet-corgi', name: '柯基', desc: '小短腿大屁股的柯基宝宝', primary: '#f4a460', secondary: '#ffffff', accent: '#ff6347', ears: 'floppy', tail: 'short', extras: ['blush', 'bandana'], mood: 'happy' },
  { id: 'pet-husky', name: '哈士奇', desc: '二哈，拆家小能手', primary: '#808080', secondary: '#ffffff', accent: '#4169e1', ears: 'pointy', tail: 'bushy', extras: ['glasses'], mood: 'curious' },
  { id: 'pet-golden-retriever', name: '金毛', desc: '温柔的大金毛，人见人爱', primary: '#daa520', secondary: '#fffacd', accent: '#cd853f', ears: 'floppy', tail: 'bushy', extras: ['scarf'], mood: 'happy' },
  { id: 'pet-pomeranian', name: '博美', desc: '毛茸茸的小博美，像棉花糖', primary: '#ffa500', secondary: '#ffe4b5', accent: '#ff69b4', ears: 'pointy', tail: 'bushy', extras: ['bow'], mood: 'excited' },
  { id: 'pet-pug', name: '巴哥', desc: '一脸委屈的小巴哥', primary: '#8b7355', secondary: '#d2b48c', accent: '#000000', ears: 'floppy', tail: 'curly', extras: ['blush'], mood: 'sad' },
  { id: 'pet-rabbit-white', name: '小白兔', desc: '雪白雪白的小兔子，爱吃胡萝卜', primary: '#ffffff', secondary: '#fff5ee', accent: '#ffb6c1', ears: 'long', tail: 'short', extras: ['blush', 'bow'], mood: 'idle' },
  { id: 'pet-rabbit-brown', name: '棕兔', desc: '棕色的小野兔，蹦蹦跳跳', primary: '#d2691e', secondary: '#f5deb3', accent: '#ffa07a', ears: 'long', tail: 'short', extras: ['scarf'], mood: 'curious' },
  { id: 'pet-holland-lop', name: '垂耳兔', desc: '耳朵软软的垂耳兔', primary: '#e6e6fa', secondary: '#ffffff', accent: '#dda0dd', ears: 'floppy', tail: 'short', extras: ['blush', 'hat'], mood: 'sleepy' },
  { id: 'pet-panda', name: '熊猫', desc: '国宝小熊猫，滚来滚去', primary: '#ffffff', secondary: '#000000', accent: '#228b22', ears: 'round', tail: 'short', extras: ['panda-eyes', 'blush'], mood: 'sleepy' },
  { id: 'pet-red-panda', name: '小熊猫', desc: '红棕色的小熊猫，超级萌', primary: '#cd5c5c', secondary: '#f5deb3', accent: '#ffffff', ears: 'pointy', tail: 'bushy', extras: ['stripes'], mood: 'curious' },
  { id: 'pet-hamster-gold', name: '金丝熊', desc: '胖嘟嘟的金丝熊，爱囤粮', primary: '#ffd700', secondary: '#fffacd', accent: '#ff6347', ears: 'round', tail: 'short', extras: ['blush', 'scarf'], mood: 'happy' },
  { id: 'pet-hamster-grey', name: '一线仓鼠', desc: '灰色的小仓鼠，胆小敏感', primary: '#a9a9a9', secondary: '#e0e0e0', accent: '#ffb6c1', ears: 'round', tail: 'short', extras: ['blush'], mood: 'surprised' },
  { id: 'pet-guinea-pig', name: '荷兰猪', desc: '圆滚滚的豚鼠，叫声可爱', primary: '#deb887', secondary: '#fff8dc', accent: '#8b4513', ears: 'floppy', tail: 'short', extras: ['blush', 'bandana'], mood: 'happy' },
  { id: 'pet-chinchilla', name: '龙猫', desc: '柔软蓬松的龙猫，爱干净', primary: '#708090', secondary: '#f5f5f5', accent: '#b0c4de', ears: 'round', tail: 'bushy', extras: ['blush'], mood: 'curious' },
  { id: 'pet-fennec-fox', name: '耳廓狐', desc: '大耳朵的沙漠小精灵', primary: '#f5deb3', secondary: '#fff8dc', accent: '#d2691e', ears: 'pointy', tail: 'bushy', extras: ['blush'], mood: 'excited' },
  { id: 'pet-arctic-fox', name: '北极狐', desc: '雪白的北极狐，冬天更美', primary: '#f0f8ff', secondary: '#ffffff', accent: '#87ceeb', ears: 'pointy', tail: 'bushy', extras: ['scarf'], mood: 'sleepy' },
  { id: 'pet-emperor-penguin', name: '帝企鹅', desc: '穿西装的绅士企鹅', primary: '#000000', secondary: '#ffffff', accent: '#ffd700', ears: 'round', tail: 'short', extras: ['scarf'], mood: 'idle' },
  { id: 'pet-little-penguin', name: '小蓝企鹅', desc: '蓝色的小企鹅，萌萌哒', primary: '#4682b4', secondary: '#ffffff', accent: '#ffa500', ears: 'round', tail: 'short', extras: ['hat'], mood: 'happy' },
  { id: 'pet-snow-owl', name: '雪鸮', desc: '优雅的白色猫头鹰', primary: '#f5f5f5', secondary: '#e0e0e0', accent: '#ffd700', ears: 'pointy', tail: 'short', extras: ['glasses'], mood: 'curious' },
  { id: 'pet-parrot', name: '鹦鹉', desc: '色彩斑斓的小话痨', primary: '#32cd32', secondary: '#ffff00', accent: '#ff4500', ears: 'round', tail: 'long', extras: [], mood: 'excited' },
  { id: 'pet-cockatiel', name: '玄凤鹦鹉', desc: '头上有呆毛的小可爱', primary: '#fffacd', secondary: '#ffffff', accent: '#ff8c00', ears: 'round', tail: 'long', extras: ['blush'], mood: 'happy' },
  { id: 'pet-turtle', name: '小乌龟', desc: '慢悠悠的小乌龟，活得久', primary: '#556b2f', secondary: '#8fbc8f', accent: '#daa520', ears: 'round', tail: 'short', extras: ['glasses'], mood: 'sleepy' },
  { id: 'pet-hedgehog', name: '刺猬', desc: '扎手但可爱的小刺猬', primary: '#8b7355', secondary: '#f5deb3', accent: '#ff6b6b', ears: 'round', tail: 'short', extras: ['blush', 'scarf'], mood: 'surprised' },
  { id: 'pet-frog', name: '小青蛙', desc: '呱呱呱，雨天更活跃', primary: '#228b22', secondary: '#90ee90', accent: '#ff6347', ears: 'round', tail: 'short', extras: ['blush'], mood: 'curious' },
  { id: 'pet-capybara', name: '水豚', desc: '佛系水豚，情绪稳定', primary: '#8b7355', secondary: '#deb887', accent: '#228b22', ears: 'round', tail: 'short', extras: ['hat'], mood: 'idle' },
];

for (const pet of pets) {
  const dir = path.join(petsDir, pet.id);
  await fs.mkdir(dir, { recursive: true });

  const config = {
    schemaVersion: 1,
    id: pet.id,
    name: pet.name,
    description: pet.desc,
    renderType: 'image',
    image: 'pet.svg',
    width: 150,
    height: 150,
    defaultMood: pet.mood,
    interactions: [
      { trigger: 'click', action: 'click', duration: 500, moodChange: 'happy', message: '开心！' },
      { trigger: 'double-click', action: 'talk', duration: 1500, moodChange: 'excited', message: '好喜欢你呀~' },
      { trigger: 'hover', action: 'hover', duration: 0, moodChange: 'curious', message: '' },
      { trigger: 'right-click', action: 'sleep', duration: 3000, moodChange: 'sleepy', message: '困了...' },
    ],
  };

  await fs.writeFile(
    path.join(dir, 'pet.json'),
    JSON.stringify(config, null, 2) + '\n'
  );

  await fs.writeFile(
    path.join(dir, 'pet.svg'),
    petSvg(pet.primary, pet.secondary, pet.accent, pet.ears, pet.tail, pet.extras)
  );
}

console.log(`生成了 ${pets.length} 款桌宠`);
