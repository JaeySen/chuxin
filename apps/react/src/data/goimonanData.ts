// Data ported verbatim from chuxin-teachers-docs/k34/goimonan.html
// (HSK1 restaurant ordering roleplay — Thầy Trung)

export const pinyinDict: Record<string, string> = {
  "你": "nǐ", "想": "xiǎng", "吃": "chī", "什": "shén", "么": "me",
  "请": "qǐng", "问": "wèn", "要": "yào", "碗": "wǎn", "型": "xíng",
  "辣": "là", "度": "dù", "如": "rú", "何": "hé", "是": "shì",
  "打": "dǎ", "包": "bāo", "带": "dài", "走": "zǒu", "还": "hái",
  "在": "zài", "这": "zhè", "儿": "er", "需": "xū", "一": "yī",
  "次": "cì", "性": "xìng", "餐": "cān", "具": "jù", "吗": "ma",
  "对": "duì", "不": "bù", "大": "dà", "小": "xiǎo", "正": "zhèng",
  "常": "cháng", "少": "shǎo", "越": "yuè", "南": "nán", "菜": "cài",
  "中": "zhōng", "国": "guó", "美": "měi", "我": "wǒ", "的": "de",
  "点": "diǎn", "选": "xuǎn", "择": "zé", "就": "jiù", "方": "fāng",
  "式": "shì", "确": "què", "认": "rèn", "饭": "fàn", "米": "mǐ",
  "喝": "hē", "顾": "gù", "客": "kè", "服": "fú", "务": "wù",
  "员": "yuán", "重": "chóng", "新": "xīn", "开": "kāi", "始": "shǐ",
  "下": "xià", "步": "bù", "您": "nín", "谢": "xiè", "光": "guāng",
  "临": "lín", "完": "wán", "成": "chéng", "再": "zài", "见": "jiàn",
  "好": "hǎo", "欢": "huān", "迎": "yíng", "本": "běn", "课": "kè",
  "生": "shēng", "词": "cí", "水": "shuǐ", "平": "píng", "表": "biǎo",
  "情": "qíng", "帮": "bāng", "助": "zhù", "里": "lǐ", "有": "yǒu",
  "可": "kě", "以": "yǐ", "给": "gěi", "看": "kàn", "单": "dān",
  "今": "jīn", "天": "tiān", "特": "tè", "别": "bié", "推": "tuī",
  "荐": "jiàn", "东": "dōng", "西": "xi", "很": "hěn", "味": "wèi",
  "道": "dào", "怎": "zěn", "样": "yàng", "甜": "tián", "酸": "suān",
  "苦": "kǔ", "咸": "xián", "麻": "má", "鲜": "xiān",
  "口": "kǒu", "感": "gǎn", "错": "cuò", "喜": "xǐ", "多": "duō",
  "钱": "qián", "块": "kuài", "元": "yuán", "角": "jiǎo", "分": "fēn",
  "贵": "guì", "便": "pián", "宜": "yi", "合": "hé", "适": "shì",
  "用": "yòng", "气": "qi", "稍": "shāo", "等": "děng", "马": "mǎ",
  "上": "shàng", "来": "lái", "祝": "zhù", "愉": "yú", "快": "kuài",
};

export type GmOption = { id: string; name: string; pinyin: string; emoji: string };

export const vocabulary: { chinese: string; pinyin: string; meaning: string; emoji: string }[] = [
  { chinese: "吃", pinyin: "chī", meaning: "ăn", emoji: "🍽️" },
  { chinese: "想", pinyin: "xiǎng", meaning: "muốn", emoji: "💭" },
  { chinese: "什么", pinyin: "shénme", meaning: "cái gì", emoji: "❓" },
  { chinese: "菜", pinyin: "cài", meaning: "món ăn", emoji: "🥘" },
  { chinese: "大碗", pinyin: "dà wǎn", meaning: "tô lớn", emoji: "🥣" },
  { chinese: "小碗", pinyin: "xiǎo wǎn", meaning: "tô nhỏ", emoji: "🥣" },
  { chinese: "辣", pinyin: "là", meaning: "cay", emoji: "🌶️" },
  { chinese: "打包带走", pinyin: "dǎ bāo dài zǒu", meaning: "gói mang đi", emoji: "🥡" },
  { chinese: "在这儿吃", pinyin: "zài zhè'er chī", meaning: "ăn tại đây", emoji: "📍" },
  { chinese: "一次性餐具", pinyin: "yī cì xìng cān jù", meaning: "dụng cụ ăn xài 1 lần", emoji: "🥢" },
  { chinese: "要", pinyin: "yào", meaning: "muốn,cần,phải", emoji: "✅" },
  { chinese: "不要", pinyin: "bú yào", meaning: "không cần", emoji: "❌" },
  { chinese: "谢谢", pinyin: "xièxie", meaning: "cảm ơn", emoji: "🙏" },
];

export const optionsData: Record<string, GmOption[]> = {
  cuisines: [
    { id: "vietnamese", name: "越南菜", pinyin: "Yuènán cài", emoji: "🇻🇳" },
    { id: "chinese", name: "中国菜", pinyin: "Zhōngguó cài", emoji: "🇨🇳" },
    { id: "american", name: "美国菜", pinyin: "Měiguó cài", emoji: "🇺🇸" },
  ],
  bowlSizes: [
    { id: "bigBowl", name: "大碗", pinyin: "dà wǎn", emoji: "🍚+" },
    { id: "smallBowl", name: "小碗", pinyin: "xiǎo wǎn", emoji: "🍚-" },
  ],
  spicinessLevels: [
    { id: "normalSpicy", name: "正常辣", pinyin: "zhèngcháng là", emoji: "🥵" },
    { id: "lessSpicy", name: "少辣", pinyin: "shǎo là", emoji: "🫑" },
    { id: "notSpicy", name: "不辣", pinyin: "bù là", emoji: "😊" },
  ],
  servingOptions: [
    { id: "takeaway", name: "打包带走", pinyin: "dǎbāo dàizǒu", emoji: "🥡" },
    { id: "dineIn", name: "在这儿吃", pinyin: "zài zhè'er chī", emoji: "🍽️" },
  ],
  utensilOptions: [
    { id: "needUtensils", name: "要", pinyin: "yào", emoji: "👍" },
    { id: "noUtensils", name: "不要", pinyin: "bú yào", emoji: "🫷" },
  ],
};

export const serverDialogues: Record<string, { text: string; emoji: string }> = {
  step1: { text: "请问您要点什么？", emoji: "🤔" },
  step2: { text: "要大碗还是小碗？", emoji: "🥣" },
  step3: { text: "辣度怎么样？", emoji: "🌶️" },
  step4: { text: "打包带走还是在这儿吃？", emoji: "🍽️" },
  step5: { text: "需要一次性餐具吗？", emoji: "🥢" },
  step6: { text: "您点的餐是...，对吗？", emoji: "🧾" },
};

export const stepLabels = ["菜肴", "碗型", "辣度", "就餐", "餐具", "确认"];

export type GmSelectionKey = "cuisine" | "bowlSize" | "spiciness" | "serving" | "utensils";

export const SELECTION_KEYS: (GmSelectionKey | null)[] = [
  "cuisine", "bowlSize", "spiciness", "serving", "utensils", null,
];

export const OPTION_CATEGORY: Record<GmSelectionKey, string> = {
  cuisine: "cuisines",
  bowlSize: "bowlSizes",
  spiciness: "spicinessLevels",
  serving: "servingOptions",
  utensils: "utensilOptions",
};
