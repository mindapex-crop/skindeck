# 区域风格皮肤 · 生图 Prompt 库（借鉴 Codex-Dream-Skin 设计）

> 用法：每个皮肤给出一段**可直接喂图生图模型（ImageGen / 豆包 / Midjourney 等）的英文 Prompt**，并附带
> 推荐的 `theme.json` 调色板。所有 prompt 都内嵌了 Codex-Dream-Skin 的**构图安全区协议**，从源头保证
> 铺在客户端底下时主体不被侧栏/正文遮挡、文字始终可读。
>
> **通用构图规则（每款必守）**
> - 母版固定 **2560×1440，16:9**；CSS 用 `cover` 铺满（窄窗会裁少量边缘，故关键内容距边 ≥ 8%）。
> - **原生内容安全区** `x=0%–52%`：必须连续低对比环境（天空/雾/纯色渐变/虚化），**不要放脸/手/密集花纹/强光斑**（这里会被左侧栏+正文盖住）。
> - **自然过渡区** `x=45%–62%`：留白自然过渡，不能像矩形面板。
> - **关键主体安全区** `x=62%–88%`：脸/手/主体道具必须在这里；非关键装饰最多到 `x=90%`。
> - **纵向安全区** `y=16%–72%`：脸 `y=20%–52%`，手 `y=30%–70%`。
> - 右侧人物/主体构图配 `safeArea:"left"` + `focusX:0.72`，让左侧留给原生内容、窄窗优先保住右侧主体。
>
> **建议的 `theme.json` 字段**（与本项目 `Theme` 类型对齐）：
> ```json
> {
>   "appearance": "dark | light",
>   "art": { "focusX": 0.72, "focusY": 0.45, "safeArea": "left", "taskMode": "ambient" },
>   "colors": { "background":"#...","panel":"rgba(...)", "accent":"#...","text":"#...","muted":"#...","line":"rgba(...)" }
> }
> ```

---

## 一、中国（China）· 10 款

### 1. 桂林水墨远山（Guilin Ink Mountains）
- **风格**：宋代水墨淡彩，留白意境
- **构图**：左侧大留白低对比；喀斯特山峰置于 x=62–88%、距边≥8%，focusX≈0.72、focusY≈0.45；safeArea:left
- **调色板**：background `#f4f1ea` · panel `rgba(255,255,255,.6)` · accent `#6b8e9e` · text `#2b2b2b` · muted `#7a766c` · line `rgba(107,142,158,.3)`
- **Prompt**:
> "A serene Song-dynasty style ink wash painting of Guilin karst mountains rising from a misty Li River, soft grey-blue gradients, abundant negative space on the left third, a tiny fishing boat and faint distant peaks on the right side, delicate wet-on-wet brush texture, muted earthy monochrome palette, ethereal and calm, masterpiece, 2560x1440, 16:9. Composition must leave the left 0-52% as low-contrast empty mist for UI overlay; place the main mountain mass on the right at x=62-88%."

### 2. 故宫红墙金瓦（Forbidden City Vermilion）
- **风格**：宫廷写实，红金庄严
- **构图**：左侧红墙虚化做低对比底色；右侧角楼/琉璃瓦置于 x=64–86%，focusX≈0.74、focusY≈0.42；safeArea:left
- **调色板**：background `#2a1410` · panel `rgba(40,18,14,.72)` · accent `#d4af37` · text `#f6e7d2` · muted `#c9a98a` · line `rgba(212,175,55,.35)`
- **Prompt**:
> "Majestic Forbidden City vermilion palace wall with golden glazed-tile roof and a corner tower, warm afternoon light, rich imperial red and gold, intricate wooden dougong brackets, soft bokeh on the left side, cinematic symmetry, highly detailed, 2560x1440, 16:9. Keep left 0-52% as a soft out-of-focus red wall gradient for UI; the ornate tower sits on the right at x=64-86%."

### 3. 敦煌飞天藻井（Dunhuang Flying Apsaras）
- **风格**：敦煌壁画，矿物色华丽
- **构图**：左侧暗色洞窟壁低对比；右侧飞天/藻井纹样 x=63–87%，focusX≈0.73、focusY≈0.40；safeArea:left
- **调色板**：background `#1c1208` · panel `rgba(28,18,8,.78)` · accent `#e0a93b` · text `#f3e3c4` · muted `#b89a6a` · line `rgba(224,169,59,.32)`
- **Prompt**:
> "Dunhuang Mogao cave ceiling caisson (藻井) with flying apsaras (飞天) and lotus motifs, mineral pigments of ochre, malachite green and azurite blue, aged fresco texture with crackle, candle-lit mystery, ornate and sacred, 2560x1440, 16:9. Left 0-52% should be a dark muted cave-wall area for UI overlay; the vivid flying figure and mandala occupy the right at x=63-87%."

### 4. 青花瓷纹（Blue-White Porcelain）
- **风格**：青花工笔，素雅
- **构图**：左侧纯白釉面低对比；右侧缠枝莲青花纹 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#eef2f6` · panel `rgba(255,255,255,.66)` · accent `#2f5fa8` · text `#1f2a3a` · muted `#8a9bb3` · line `rgba(47,95,168,.3)`
- **Prompt**:
> "Close-up of a white porcelain vase with classic Chinese blue-and-white (青花) intertwined lotus scroll, crisp cobalt brushwork on a clean white glaze, soft studio light, elegant and refined, minimal background, 2560x1440, 16:9. Left 0-52% is plain white porcelain for UI; the detailed blue floral pattern lives on the right at x=63-87%."

### 5. 江南烟雨（Jiangnan Misty Town）
- **风格**：水乡写实，湿润朦胧
- **构图**：左侧白墙水面低对比；右侧小桥/乌篷船 x=64–86%，focusX≈0.74、focusY≈0.55；safeArea:left
- **调色板**：background `#e9eef0` · panel `rgba(255,255,255,.62)` · accent `#5b7d8c` · text `#33403f` · muted `#8597a0` · line `rgba(91,125,140,.3)`
- **Prompt**:
> "A misty water town in Jiangnan (south of Yangtze) with white-walled houses, arched stone bridge, a small black-awning boat on calm water, soft rain haze, muted blue-grey palette, peaceful and poetic, ink-wash realism, 2560x1440, 16:9. Left 0-52% is a low-contrast misty water surface for UI; the bridge and boat are on the right at x=64-86%."

### 6. 春节灯笼（Spring Festival Lanterns）
- **风格**：喜庆民俗，暖红金
- **构图**：左侧暗红夜色低对比；右侧成串红灯笼/福字 x=63–87%，focusX≈0.73、focusY≈0.45；safeArea:left
- **调色板**：background `#240a0a` · panel `rgba(36,10,10,.74)` · accent `#ff5a3c` · text `#ffe7c2` · muted `#d79a7a` · line `rgba(255,90,60,.34)`
- **Prompt**:
> "A festive Chinese New Year scene with strings of glowing red lanterns, golden 福 characters, warm bokeh lights against a deep night, joyful and warm atmosphere, rich reds and golds, detailed paper-cut texture, 2560x1440, 16:9. Left 0-52% stays dark and calm for UI; the bright lantern cluster sits on the right at x=63-87%."

### 7. 祥云金龙（Auspicious Dragon & Clouds）
- **风格**：工笔重彩，祥瑞
- **构图**：左侧祥云虚化低对比；右侧金龙盘旋 x=62–88%，focusX≈0.72、focusY≈0.42；safeArea:left
- **调色板**：background `#10131c` · panel `rgba(16,19,28,.76)` · accent `#e8b84b` · text `#eef1f7` · muted `#a9b0c4` · line `rgba(232,184,75,.32)`
- **Prompt**:
> "A golden Chinese dragon coiling through stylized auspicious clouds (祥云), traditional gongbi heavy-color style, deep indigo night sky, shimmering gold scales, dynamic and majestic, fine linework, 2560x1440, 16:9. Left 0-52% is soft cloud gradient for UI overlay; the dragon body arcs on the right at x=62-88%."

### 8. 四君子·梅兰竹菊（Four Gentlemen）
- **风格**：文人水墨，清雅
- **构图**：左侧素纸低对比；右侧梅枝/兰竹菊花 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#f3efe6` · panel `rgba(255,255,255,.64)` · accent `#9c6b4f` · text `#2e2a24` · muted `#8c8478` · line `rgba(156,107,79,.3)`
- **Prompt**:
> "Elegant literati ink painting of the Four Gentlemen (四君子) — plum, orchid, bamboo and chrysanthemum — with refined brush strokes on aged rice paper, muted ink and faint color washes, scholarly and serene, 2560x1440, 16:9. Left 0-52% is empty paper for UI; the botanical composition sits on the right at x=63-87%."

### 9. 赛博国潮（Cyber Guochao Neon）
- **风格**：国潮赛博朋克，霓虹
- **构图**：左侧暗巷低对比；右侧霓虹牌楼/像素龙 x=63–87%，focusX≈0.73、focusY≈0.45；safeArea:left
- **调色板**：background `#0c0a16` · panel `rgba(12,10,22,.78)` · accent `#ff3d7f` · text `#e8eaff` · muted `#9a8fd0` · line `rgba(255,61,127,.34)`
- **Prompt**:
> "Cyberpunk guochao (国潮) street with a neon-lit traditional paifang gate and a pixel-art Chinese dragon, magenta and cyan neon reflections on wet pavement, futuristic yet cultural, high contrast, 2560x1440, 16:9. Left 0-52% is a dark alley gradient for UI; the glowing neon gate is on the right at x=63-87%."

### 10. 丝路驼铃（Silk Road Caravan）
- **风格**：大漠暖调，史诗
- **构图**：左侧沙丘虚化低对比；右侧驼队/夕阳 x=62–86%，focusX≈0.72、focusY≈0.58；safeArea:left
- **调色板**：background `#2a1c12` · panel `rgba(42,28,18,.72)` · accent `#e09a3e` · text `#f3e2c4` · muted `#c19a72` · line `rgba(224,154,62,.32)`
- **Prompt**:
> "A Silk Road caravan of camels silhouetted against a giant setting sun over rolling sand dunes, warm amber and dusty rose palette, vast desert, epic and nostalgic, fine grain texture, 2560x1440, 16:9. Left 0-52% is a low-contrast dune haze for UI; the camel silhouettes and sun are on the right at x=62-86%."

---

## 二、日韩（Japan & Korea）· 10 款

### 1. 樱花吹雪（Sakura Blizzard）
- **风格**：唯美写实，粉白
- **构图**：左侧天空虚化低对比；右侧樱花枝/飘瓣 x=63–87%，focusX≈0.73、focusY≈0.4；safeArea:left
- **调色板**：background `#fdeef3` · panel `rgba(255,255,255,.66)` · accent `#e98aa8` · text `#3a2b30` · muted `#b58a98` · line `rgba(233,138,168,.32)`
- **Prompt**:
> "Soft pink cherry blossoms (sakura) drifting in a gentle wind against a pale spring sky, delicate petals, dreamy bokeh, pastel pink and white, romantic and serene, 2560x1440, 16:9. Left 0-52% is a calm pale sky for UI; the blossom-laden branch is on the right at x=63-87%."

### 2. 浮世绘巨浪（Ukiyo-e Great Wave）
- **风格**：浮世绘版画，靛蓝
- **构图**：左侧海面留白低对比；右侧巨浪/渔船 x=62–88%，focusX≈0.72、focusY≈0.45；safeArea:left
- **调色板**：background `#0e1b2a` · panel `rgba(14,27,42,.76)` · accent `#2f6fb0` · text `#eef4fb` · muted `#8fa9c4` · line `rgba(47,111,176,.32)`
- **Prompt**:
> "Hokusai-style ukiyo-e woodblock print of the Great Wave off Kanagawa, stylized indigo curl with foam claws, a tiny boat, flat graphic shapes, Prussian blue and cream, iconic and bold, 2560x1440, 16:9. Left 0-52% is a flat low-contrast sea for UI; the towering wave crest is on the right at x=62-88%."

### 3. 京都苔寺（Kyoto Moss Temple）
- **风格**：枯淡禅意，翠绿
- **构图**：左侧石径虚化低对比；右侧苔庭/灯笼 x=63–87%，focusX≈0.73、focusY≈0.55；safeArea:left
- **调色板**：background `#11180f` · panel `rgba(17,24,15,.76)` · accent `#6f9e4a` · text `#eaf0e2` · muted `#9bb083` · line `rgba(111,158,74,.3)`
- **Prompt**:
> "Saiho-ji moss garden in Kyoto, lush emerald moss, a stone lantern, raked gravel, soft filtered light through maples, tranquil Zen atmosphere, hyper-detailed nature, 2560x1440, 16:9. Left 0-52% is a dim mossy blur for UI; the lantern and moss mound are on the right at x=63-87%."

### 4. 韩屋韩服（Hanok & Hanbok）
- **风格**：韩式温润，柔彩
- **构图**：左侧韩屋木墙虚化低对比；右侧韩服女子/门窗 x=63–87%，focusX≈0.73、focusY≈0.45；safeArea:left
- **调色板**：background `#2a1c16` · panel `rgba(42,28,22,.72)` · accent `#d98b6a` · text `#f5e7d8` · muted `#c2a08c` · line `rgba(217,139,106,.32)`
- **Prompt**:
> "A Korean woman in a pastel hanbok standing by a traditional hanok wooden door with lattice windows (창호), warm interior glow, soft natural light, elegant and cultural, fine texture, 2560x1440, 16:9. Left 0-52% is a soft wooden-wall blur for UI; the figure and door are on the right at x=63-87%."

### 5. 枯山水（Zen Rock Garden）
- **风格**：极简禅意，砂灰
- **构图**：左侧耙纹砂低对比；右侧景石/竹 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#e7e3da` · panel `rgba(255,255,255,.64)` · accent `#7c756a` · text `#2c2a25` · muted `#9a948a` · line `rgba(124,117,106,.3)`
- **Prompt**:
> "A minimalist Japanese zen dry garden (karesansui) with raked white gravel, a single moss-covered rock, a bamboo fence, monochrome serenity, soft shadow, 2560x1440, 16:9. Left 0-52% is smooth raked gravel for UI; the rock and bamboo sit on the right at x=63-87%."

### 6. 首尔霓虹夜（Seoul Neon Night）
- **风格**：韩流都市，冷紫
- **构图**：左侧暗街低对比；右侧霓虹招牌/江景 x=63–87%，focusX≈0.73、focusY≈0.42；safeArea:left
- **调色板**：background `#0b0a14` · panel `rgba(11,10,20,.78)` · accent `#8a5cff` · text `#eceaff` · muted `#9a93c8` · line `rgba(138,92,255,.34)`
- **Prompt**:
> "Seoul at night along the Han River, glowing neon signboards in Korean hangul, reflections on water, purple and electric blue city lights, modern K-wave energy, cinematic, 2560x1440, 16:9. Left 0-52% is a dark street gradient for UI; the neon skyline is on the right at x=63-87%."

### 7. 富士山云海（Fuji Sea of Clouds）
- **风格**：壮丽写实，青白
- **构图**：左侧云海虚化低对比；右侧富士山顶 x=62–86%，focusX≈0.72、focusY≈0.35；safeArea:left
- **调色板**：background `#eaf1f6` · panel `rgba(255,255,255,.66)` · accent `#3f7fb0` · text `#22323d` · muted `#8aa1b3` · line `rgba(63,127,176,.3)`
- **Prompt**:
> "Mount Fuji above a vast sea of clouds at sunrise, snow cap glowing pink, gradient blue sky, dramatic and peaceful, crisp photography, 2560x1440, 16:9. Left 0-52% is a soft cloud ocean for UI; the mountain peak is on the right at x=62-86%."

### 8. 韩纸纹样（Hanji Paper Pattern）
- **风格**：韩纸肌理，暖米
- **构图**：左侧素纸低对比；右侧花鸟韩纸纹 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#efe7d6` · panel `rgba(255,255,255,.64)` · accent `#b07a3c` · text `#33291c` · muted `#9a8a6e` · line `rgba(176,122,60,.3)`
- **Prompt**:
> "Traditional Korean hanji (한지) paper with embossed floral pattern, warm ivory tone, fibrous handmade texture, soft diffuse light, understated elegance, 2560x1440, 16:9. Left 0-52% is plain paper for UI; the embossed motif is on the right at x=63-87%."

### 9. 和风金鱼（Kingyo Goldfish）
- **风格**：夏日治愈，朱白
- **构图**：左侧水面虚化低对比；右侧游动金鱼 x=63–87%，focusX≈0.73、focusY≈0.55；safeArea:left
- **调色板**：background `#fbeef0` · panel `rgba(255,255,255,.66)` · accent `#e8623c` · text `#3a2528` · muted `#bc8e88` · line `rgba(232,98,60,.3)`
- **Prompt**:
> "Elegant red-and-white Japanese goldfish (kingyo) swimming in clear water with floating bubbles, soft summer light, painterly and cute, gentle ripples, 2560x1440, 16:9. Left 0-52% is a calm water blur for UI; the goldfish are on the right at x=63-87%."

### 10. 济州玄武（Jeju Basalt & Oreum）
- **风格**：海岛清透，墨绿
- **构图**：左侧草原虚化低对比；右侧玄武岩/偶来小径 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0f1812` · panel `rgba(15,24,18,.74)` · accent `#4f9e6a` · text `#e7f0e6` · muted `#94ad97` · line `rgba(79,158,106,.3)`
- **Prompt**:
> "Jeju Island oreum (volcanic hill) with black basalt rocks, green grassland and a stone wall, fresh ocean breeze feel, clear light, serene island nature, 2560x1440, 16:9. Left 0-52% is a soft grassy blur for UI; the basalt and hill are on the right at x=63-87%."

---

## 三、欧美（Europe & America）· 10 款

### 1. 巴黎铁塔黄昏（Paris Eiffel Dusk）
- **风格**：浪漫写实，暖金
- **构图**：左侧塞纳河虚化低对比；右侧铁塔/落日 x=62–86%，focusX≈0.72、focusY≈0.4；safeArea:left
- **调色板**：background `#1c1426` · panel `rgba(28,20,38,.74)` · accent `#e0a94b` · text `#f3ecf6` · muted `#b6a4c8` · line `rgba(224,169,75,.32)`
- **Prompt**:
> "The Eiffel Tower at dusk glowing gold against a deep blue-violet sky, Seine reflection, warm street lamps, romantic Parisian atmosphere, cinematic, 2560x1440, 16:9. Left 0-52% is a low-contrast river blur for UI; the tower and sunset are on the right at x=62-86%."

### 2. 托斯卡纳田园（Tuscany Countryside）
- **风格**：油画暖调，赭黄
- **构图**：左侧麦田虚化低对比；右侧农舍/柏树 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#efe6d2` · panel `rgba(255,255,255,.64)` · accent `#c08a2e` · text `#33291a` · muted `#9a885f` · line `rgba(192,138,46,.3)`
- **Prompt**:
> "Rolling Tuscany hills with cypress trees, a rustic stone farmhouse, golden wheat fields under warm Mediterranean light, oil-painting texture, idyllic and warm, 2560x1440, 16:9. Left 0-52% is a soft field gradient for UI; the farmhouse and cypress are on the right at x=63-87%."

### 3. 北欧极光（Nordic Aurora）
- **风格**：冷艳奇幻，绿紫
- **构图**：左侧雪原虚化低对比；右侧极光/木屋 x=62–88%，focusX≈0.72、focusY≈0.35；safeArea:left
- **调色板**：background `#08101a` · panel `rgba(8,16,26,.78)` · accent `#4fe0a8` · text `#eaf6f0` · muted `#8fb6ac` · line `rgba(79,224,168,.32)`
- **Prompt**:
> "A vivid aurora borealis over a snowy Nordic fjord, green and violet light ribbons in a starry sky, a small wooden cabin with warm window glow, magical and cold, 2560x1440, 16:9. Left 0-52% is a dark snowfield for UI; the aurora and cabin are on the right at x=62-88%."

### 4. 纽约天际线（NYC Skyline）
- **风格**：都市硬朗，钢蓝
- **构图**：左侧河面虚化低对比；右侧摩天楼/夜景 x=63–87%，focusX≈0.73、focusY≈0.4；safeArea:left
- **调色板**：background `#0b1018` · panel `rgba(11,16,24,.78)` · accent `#5aa0e0` · text `#eaf1fb` · muted `#90a6c4` · line `rgba(90,160,224,.32)`
- **Prompt**:
> "New York City skyline at blue hour, dense skyscrapers with lit windows, reflection on the East River, crisp modern energy, cinematic wide shot, 2560x1440, 16:9. Left 0-52% is a calm water gradient for UI; the towers are on the right at x=63-87%."

### 5. 加州海岸（California Coast）
- **风格**：明快清透，蔚蓝
- **构图**：左侧沙滩虚化低对比；右侧海崖/浪 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#e7f1f6` · panel `rgba(255,255,255,.66)` · accent `#2f9fd0` · text `#1f3340` · muted `#8aabbb` · line `rgba(47,159,208,.3)`
- **Prompt**:
> "California Pacific coast with turquoise waves crashing on rocky cliffs, golden sand, bright sunny sky, fresh and free, vibrant travel photography, 2560x1440, 16:9. Left 0-52% is a soft sand blur for UI; the cliffs and surf are on the right at x=63-87%."

### 6. 伦敦雾钟楼（London Fog & Big Ben）
- **风格**：复古朦胧，青灰
- **构图**：左侧雾中街虚化低对比；右侧大本钟 x=63–87%，focusX≈0.73、focusY≈0.42；safeArea:left
- **调色板**：background `#1c2230` · panel `rgba(28,34,48,.74)` · accent `#c9a24b` · text `#eef1f7` · muted `#9aa6bc` · line `rgba(201,162,75,.3)`
- **Prompt**:
> "Big Ben and the Houses of Parliament emerging from a soft London fog, warm lamp glow, vintage muted teal-grey palette, moody and timeless, 2560x1440, 16:9. Left 0-52% is a foggy blur for UI; the clock tower is on the right at x=63-87%."

### 7. 圣托里尼蓝白（Santorini Blue-White）
- **风格**：地中海明快，蔚蓝
- **构图**：左侧白墙虚化低对比；右侧蓝顶教堂/海 x=63–87%，focusX≈0.73、focusY≈0.45；safeArea:left
- **调色板**：background `#eef4f8` · panel `rgba(255,255,255,.66)` · accent `#2f7fd0` · text `#22323d` · muted `#8aa6bb` · line `rgba(47,127,208,.3)`
- **Prompt**:
> "Santorini cliffside with white cubic houses and blue-domed churches overlooking the Aegean Sea, bright sunlight, crisp Mediterranean whites and blues, postcard perfect, 2560x1440, 16:9. Left 0-52% is a white wall blur for UI; the blue dome and sea are on the right at x=63-87%."

### 8. 苏格兰高地（Scottish Highlands）
- **风格**：苍茫写实，苔绿
- **构图**：左侧荒原虚化低对比；右侧城堡/湖 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#141a12` · panel `rgba(20,26,18,.76)` · accent `#7a9a4a` · text `#e7ede2` · muted `#9aab8c` · line `rgba(122,154,74,.3)`
- **Prompt**:
> "Scottish Highlands with a remote stone castle by a loch, heather-covered hills, dramatic moody clouds, cool earthy greens and greys, epic wilderness, 2560x1440, 16:9. Left 0-52% is a soft moor blur for UI; the castle and loch are on the right at x=63-87%."

### 9. 66号公路（Route 66 Retro）
- **风格**：美式复古，橙红
- **构图**：左侧公路虚化低对比；右侧老加油站/落日 x=62–86%，focusX≈0.72、focusY≈0.55；safeArea:left
- **调色板**：background `#1e120a` · panel `rgba(30,18,10,.74)` · accent `#e0622e` · text `#f5e3d0` · muted `#c29472` · line `rgba(224,98,46,.32)`
- **Prompt**:
> "A retro Route 66 scene with a vintage neon motel sign and a classic car on an open desert highway at sunset, warm orange and red, nostalgic Americana, film grain, 2560x1440, 16:9. Left 0-52% is a low-contrast road blur for UI; the neon sign and car are on the right at x=62-86%."

### 10. 阿尔卑斯雪山（Alpine Snow）
- **风格**：澄澈壮丽，冰蓝
- **构图**：左侧雪坡虚化低对比；右侧雪峰/缆车 x=63–87%，focusX≈0.73、focusY≈0.38；safeArea:left
- **调色板**：background `#e8f1f6` · panel `rgba(255,255,255,.66)` · accent `#3f8fd0` · text `#21323d` · muted `#8aa6bb` · line `rgba(63,143,208,.3)`
- **Prompt**:
> "Majestic Alpine peaks with fresh snow under a clear blue sky, a cable car and pine forest, crisp clean mountain air, bright and grand, 2560x1440, 16:9. Left 0-52% is a soft snow slope for UI; the summit and cable car are on the right at x=63-87%."

---

## 四、东南亚（Southeast Asia）· 10 款

### 1. 吴哥窟晨雾（Angkor Wat Dawn）
- **风格**：神性写实，金橙
- **构图**：左侧回廊虚化低对比；右侧主塔/晨光 x=62–86%，focusX≈0.72、focusY≈0.4；safeArea:left
- **调色板**：background `#1e160c` · panel `rgba(30,22,12,.74)` · accent `#e0a23e` · text `#f5e7cf` · muted `#c2a06e` · line `rgba(224,162,62,.32)`
- **Prompt**:
> "Angkor Wat temple silhouette at dawn with warm light through mist, ancient Khmer towers reflected in a lotus pond, sacred and golden, fine stone detail, 2560x1440, 16:9. Left 0-52% is a soft colonnade blur for UI; the central tower and sunrise are on the right at x=62-86%."

### 2. 巴厘梯田（Bali Rice Terraces）
- **风格**：翠绿田园，鲜润
- **构图**：左侧田埂虚化低对比；右侧梯田/椰树 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0f1a10` · panel `rgba(15,26,16,.74)` · accent `#5aa83e` · text `#e7f0e2` · muted `#94b086` · line `rgba(90,168,62,.3)`
- **Prompt**:
> "Bali terraced rice paddies with emerald water, coconut palms and a small wooden hut, lush tropical green, soft morning haze, serene and fertile, 2560x1440, 16:9. Left 0-52% is a soft terrace blur for UI; the hut and palms are on the right at x=63-87%."

### 3. 泰国金佛寺（Thai Golden Temple）
- **风格**：华丽宗教，赤金
- **构图**：左侧廊柱虚化低对比；右侧金塔/佛像 x=63–87%，focusX≈0.73、focusY≈0.42；safeArea:left
- **调色板**：background `#1c1408` · panel `rgba(28,20,8,.76)` · accent `#e8b53b` · text `#f7edd0` · muted `#c2a86a` · line `rgba(232,181,59,.32)`
- **Prompt**:
> "A Thai golden chedi and reclining Buddha in a ornate temple, shimmering gold leaf, intricate naga railings, warm candle glow, opulent and spiritual, 2560x1440, 16:9. Left 0-52% is a dark colonnade for UI; the golden stupa is on the right at x=63-87%."

### 4. 下龙湾（Halong Bay）
- **风格**：海上仙境，青绿
- **构图**：左侧海面虚化低对比；右侧石灰岛/帆 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0f1a1c` · panel `rgba(15,26,28,.74)` · accent `#3fa89a` · text `#e2f0ee` · muted `#86b0aa` · line `rgba(63,168,154,.3)`
- **Prompt**:
> "Halong Bay with limestone karsts rising from a misty emerald sea, a wooden junk boat with a sail, tranquil and otherworldly, soft diffuse light, 2560x1440, 16:9. Left 0-52% is a calm sea blur for UI; the islands and boat are on the right at x=63-87%."

### 5. 新加坡滨海湾（Marina Bay）
- **风格**：现代花园城市，蓝紫
- **构图**：左侧水岸虚化低对比；右侧金沙/摩天树 x=63–87%，focusX≈0.73、focusY≈0.42；safeArea:left
- **调色板**：background `#0b1020` · panel `rgba(11,16,32,.78)` · accent `#6a5cff` · text `#eef0fb` · muted `#9a93c8` · line `rgba(106,92,255,.34)`
- **Prompt**:
> "Singapore Marina Bay at night with the ArtScience Museum, Supertrees and city lights reflected on the water, futuristic garden city, violet and cyan glow, 2560x1440, 16:9. Left 0-52% is a dark water gradient for UI; the lit skyline is on the right at x=63-87%."

### 6. 蒲甘热气球（Bagan Balloons）
- **风格**：史诗晨景，暖金
- **构图**：左侧平原虚化低对比；右侧佛塔/热气球 x=62–86%，focusX≈0.72、focusY≈0.45；safeArea:left
- **调色板**：background `#1e160c` · panel `rgba(30,22,12,.74)` · accent `#e08a3e` · text `#f5e7cf` · muted `#c29a6e` · line `rgba(224,138,62,.32)`
- **Prompt**:
> "Thousands of temples in Bagan at sunrise with colorful hot-air balloons floating above, warm golden light over misty plains, magical and vast, 2560x1440, 16:9. Left 0-52% is a soft plain blur for UI; the pagodas and balloons are on the right at x=62-86%."

### 7. 双峰塔夜（KLCC Night）
- **风格**：都市璀璨，金蓝
- **构图**：左侧广场虚化低对比；右侧双塔/喷泉 x=63–87%，focusX≈0.73、focusY≈0.4；safeArea:left
- **调色板**：background `#0a0e1a` · panel `rgba(10,14,26,.78)` · accent `#d8b24b` · text `#eaeefb` · muted `#9aa3c8` · line `rgba(216,178,75,.32)`
- **Prompt**:
> "Kuala Lumpur Petronas Twin Towers at night reflected in the Lake Symphony fountains, golden and blue lights, modern skyline, vibrant and sleek, 2560x1440, 16:9. Left 0-52% is a dark plaza for UI; the twin towers are on the right at x=63-87%."

### 8. 巧克力山（Chocolate Hills）
- **风格**：奇特田园，赭棕
- **构图**：左侧草坡虚化低对比；右侧锥状山丘 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#1a140c` · panel `rgba(26,20,12,.74)` · accent `#b8802e` · text `#f1e6cf` · muted `#bb9a6e` · line `rgba(184,128,46,.3)`
- **Prompt**:
> "The Chocolate Hills of Bohol, rows of perfectly rounded green-brown hills under a clear sky, a few palm trees, surreal and peaceful countryside, 2560x1440, 16:9. Left 0-52% is a soft hillside blur for UI; the conical hills are on the right at x=63-87%."

### 9. 琅勃拉邦（Luang Prabang）
- **风格**：静谧古镇，暖橙
- **构图**：左侧湄公河虚化低对比；右侧寺庙/僧侣 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#1c160e` · panel `rgba(28,22,14,.74)` · accent `#d98a3e` · text `#f5e7cf` · muted `#c29a6e` · line `rgba(217,138,62,.32)`
- **Prompt**:
> "Luang Prabang at sunrise with golden temples, a line of saffron-robed monks on alms round, Mekong River mist, calm and spiritual Laos town, warm tones, 2560x1440, 16:9. Left 0-52% is a soft river blur for UI; the temple and monks are on the right at x=63-87%."

### 10. 科莫多热带（Komodo Tropics）
- **风格**：原始海岛，碧绿
- **构图**：左侧浅滩虚化低对比；右侧火山岛/珊瑚 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0e1a14` · panel `rgba(14,26,20,.74)` · accent `#2fa87e` · text `#e2f0e8` · muted `#86b0a0` · line `rgba(47,168,126,.3)`
- **Prompt**:
> "Komodo National Park with a lush volcanic island, turquoise coral reef shallows and a Komodo dragon silhouette on the shore, pristine wild tropics, vivid greens and blues, 2560x1440, 16:9. Left 0-52% is a soft shallows blur for UI; the island and reef are on the right at x=63-87%."

---

## 五、中东（Middle East）· 10 款

### 1. 哈利法塔夜（Burj Khalifa Night）
- **风格**：奢华都市，金蓝
- **构图**：左侧喷泉虚化低对比；右侧哈利法塔/烟花 x=62–86%，focusX≈0.72、focusY≈0.35；safeArea:left
- **调色板**：background `#0a0e1a` · panel `rgba(10,14,26,.78)` · accent `#e8c24b` · text `#eaeefb` · muted `#9aa3c8` · line `rgba(232,194,75,.32)`
- **Prompt**:
> "Burj Khalifa towering over Dubai at night with fireworks and the Dubai Fountain, golden and electric blue lights, opulent futuristic skyline, 2560x1440, 16:9. Left 0-52% is a dark fountain blur for UI; the spire and fireworks are on the right at x=62-86%."

### 2. 佩特拉古城（Petra Treasury）
- **风格**：砂岩史诗，玫红
- **构图**：左侧峡谷虚化低对比；右侧卡兹尼神殿 x=62–86%，focusX≈0.72、focusY≈0.45；safeArea:left
- **调色板**：background `#1e120c` · panel `rgba(30,18,12,.74)` · accent `#d86a4a` · text `#f5e3cf` · muted `#c29476` · line `rgba(216,106,74,.32)`
- **Prompt**:
> "The Treasury (Al-Khazneh) of Petra carved into a rose-red sandstone canyon, warm sunlight on the façade, ancient Nabatean grandeur, dust and mystery, 2560x1440, 16:9. Left 0-52% is a dim siq corridor for UI; the temple façade is on the right at x=62-86%."

### 3. 沙漠星空（Desert Stargazing）
- **风格**：苍穹奇景，靛紫
- **构图**：左侧沙丘虚化低对比；右侧帐篷/银河 x=62–88%，focusX≈0.72、focusY≈0.35；safeArea:left
- **调色板**：background `#070a16` · panel `rgba(7,10,22,.8)` · accent `#7a5cff` · text `#eaeafb` · muted `#9a93c8` · line `rgba(122,92,255,.34)`
- **Prompt**:
> "A luxury desert camp in the Arabian dunes under a brilliant Milky Way, glowing Bedouin tents, silhouetted palms, deep indigo night with violet stars, magical and vast, 2560x1440, 16:9. Left 0-52% is a dark dune blur for UI; the tents and galaxy are on the right at x=62-88%."

### 4. 伊斯兰几何（Islamic Geometry）
- **风格**：纹样装饰，钴蓝金
- **构图**：左侧素墙低对比；右侧几何镂空纹 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0e1422` · panel `rgba(14,20,34,.76)` · accent `#3f7fd0` · text `#eef3fb` · muted `#8a9ac4` · line `rgba(63,127,208,.32)`
- **Prompt**:
> "Intricate Islamic geometric star pattern (girih) in cobalt blue and gold on cream tile, symmetric eight-point stars and arabesque, ornate and precise, flat decorative, 2560x1440, 16:9. Left 0-52% is plain tile for UI; the dense motif is on the right at x=63-87%."

### 5. 波斯地毯（Persian Carpet）
- **风格**：织物工美，酒红
- **构图**：左侧毯边低对比；右侧中央团花 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#1c0e0e` · panel `rgba(28,14,14,.76)` · accent `#c8443a` · text `#f5e0d6` · muted `#c29284` · line `rgba(200,68,58,.32)`
- **Prompt**:
> "A close-up of an antique Persian carpet with a central medallion, deep ruby red, navy and gold wool knots, fine floral border, rich textile texture, 2560x1440, 16:9. Left 0-52% is a muted border for UI; the central medallion is on the right at x=63-87%."

### 6. 清真寺穹顶（Mosque Dome）
- **风格**：神圣建筑，青金
- **构图**：左侧庭院虚化低对比；右侧穹顶/宣礼塔 x=62–86%，focusX≈0.72、focusY≈0.38；safeArea:left
- **调色板**：background `#0c1622` · panel `rgba(12,22,34,.76)` · accent `#4fb0c8` · text `#eaf3f7` · muted `#8ab0bc` · line `rgba(79,176,200,.32)`
- **Prompt**:
> "A grand blue mosque dome with a towering minaret and Iznik-tile details, sunlight glinting on turquoise faience, serene and majestic, fine architectural detail, 2560x1440, 16:9. Left 0-52% is a soft courtyard for UI; the dome and minaret are on the right at x=62-86%."

### 7. 帆船酒店（Burj Al Arab）
- **风格**：标志建筑，碧海白
- **构图**：左侧海面虚化低对比；右侧风帆楼 x=63–87%，focusX≈0.73、focusY≈0.42；safeArea:left
- **调色板**：background `#e7f1f6` · panel `rgba(255,255,255,.66)` · accent `#2f9fd0` · text `#1f3340` · muted `#8aabbb` · line `rgba(47,159,208,.3)`
- **Prompt**:
> "The sail-shaped Burj Al Arab hotel on its own island, white façade against blue Gulf water, a helicopter pad and fountain, luxurious and iconic, bright daylight, 2560x1440, 16:9. Left 0-52% is a calm sea blur for UI; the sail tower is on the right at x=63-87%."

### 8. 死海晨光（Dead Sea Dawn）
- **风格**：静谧盐湖，暖灰
- **构图**：左侧盐滩虚化低对比；右侧远山/浮人 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#14161a` · panel `rgba(20,22,26,.74)` · accent `#c9a24b` · text `#eef1f5` · muted `#9aa0ac` · line `rgba(201,162,75,.3)`
- **Prompt**:
> "The Dead Sea at dawn with salt-crusted shores, a person floating effortlessly, soft pink-gold light on still water, minimalist and calming, 2560x1440, 16:9. Left 0-52% is a soft salt flat for UI; the figure and horizon are on the right at x=63-87%."

### 9. 阿拉伯马（Arabian Horse）
- **风格**：优雅力量，沙金
- **构图**：左侧沙地虚化低对比；右侧奔马/骑手 x=62–86%，focusX≈0.72、focusY≈0.5；safeArea:left
- **调色板**：background `#1a120a` · panel `rgba(26,18,10,.74)` · accent `#d8a23e` · text `#f5e7cf` · muted `#c2a06e` · line `rgba(216,162,62,.32)`
- **Prompt**:
> "A majestic Arabian horse galloping with a flowing mane in a desert, a cloaked rider, warm golden sand and dramatic light, noble and dynamic, detailed, 2560x1440, 16:9. Left 0-52% is a soft sand blur for UI; the horse and rider are on the right at x=62-86%."

### 10. 绿洲棕榈（Desert Oasis）
- **风格**：生命绿洲，翠金
- **构图**：左侧沙丘虚化低对比；右侧水潭/棕榈 x=63–87%，focusX≈0.73、focusY≈0.5；safeArea:left
- **调色板**：background `#0f1a10` · panel `rgba(15,26,16,.74)` · accent `#5aa83e` · text `#e7f0e2` · muted `#94b086` · line `rgba(90,168,62,.3)`
- **Prompt**:
> "A desert oasis with a clear spring, tall date palms and soft grass surrounded by golden dunes, a few birds, peaceful contrast of green and sand, warm light, 2560x1440, 16:9. Left 0-52% is a low-contrast dune for UI; the palms and water are on the right at x=63-87%."

---

*注：所有 prompt 均按 Codex-Dream-Skin 的"安全区构图协议"编写——左侧留低对比 UI 覆盖区、主体置于右侧 x=62–88%、焦点 focusX≈0.72、距边≥8%。直接用图生图模型生成 2560×1440 即可与本项目 `theme.json` 的 `art`/`colors` 字段完美配合。*
