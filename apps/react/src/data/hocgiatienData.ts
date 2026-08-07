// Data ported verbatim from chuxin-teachers-docs/k34/hocgiatien.html
// (HSK1 Taobao-style shop chat simulator — 淘小铺)

export const pinyinDB: Record<string, string> = {
  "你": "nǐ", "好": "hǎo", "欢": "huān", "迎": "yíng", "光": "guāng", "临": "lín",
  "想": "xiǎng", "买": "mǎi", "什": "shén", "么": "me", "我": "wǒ", "看": "kàn",
  "这": "zhè", "个": "ge", "多": "duō", "少": "shǎo", "钱": "qián", "块": "kuài",
  "太": "tài", "贵": "guì", "了": "le", "便": "pián", "宜": "yi", "一": "yí", "点": "diǎn",
  "儿": "er", "那": "nà", "吧": "ba", "要": "yào", "几": "jǐ",
  "二": "èr", "两": "liǎng", "三": "sān", "四": "sì", "五": "wǔ", "六": "liù",
  "手": "shǒu", "表": "biǎo", "套": "tào", "镯": "zhuó", "书": "shū", "杯": "bēi", "子": "zi",
  "碗": "wǎn", "机": "jī", "部": "bù", "双": "shuāng", "本": "běn",
  "还": "hái", "别": "bié", "的": "de", "没": "méi", "有": "yǒu",
  "结": "jié", "账": "zhàng", "共": "gòng",
  "支": "zhī", "付": "fù", "宝": "bǎo", "微": "wēi", "信": "xìn", "现": "xiàn", "金": "jīn",
  "扫": "sǎo", "码": "mǎ", "给": "gěi", "找": "zhǎo", "您": "nín", "谢": "xiè", "再": "zài", "见": "jiàn",
  "确": "què", "认": "rèn", "对": "duì", "不": "bú", "是": "shì",
  "包": "bāo", "邮": "yóu", "款": "kuǎn",
  "淘": "táo", "小": "xiǎo", "铺": "pù", "店": "diàn",
  "搜": "sōu", "索": "suǒ", "贝": "bèi",
  "客": "kè", "服": "fú", "拼": "pīn", "词": "cí", "汇": "huì",
  "热": "rè", "销": "xiāo", "新": "xīn", "推": "tuī", "荐": "jiàn",
  "特": "tè", "价": "jià", "正": "zhèng", "品": "pǐn",
  "人": "rén", "成": "chéng", "功": "gōng", "次": "cì",
  "已": "yǐ", "选": "xuǎn", "订": "dìng", "单": "dān",
  "很": "hěn", "错": "cuò", "问": "wèn", "题": "tí",
  "请": "qǐng", "怎": "zěn", "用": "yòng", "收": "shōu", "下": "xià",
};

export type TbProduct = { id: number; emoji: string; name: string; price: number; unit: string; sales: string; tag: string };

export const vocabularyList: { ch: string; py: string; vn: string }[] = [
  { ch: "你好", py: "nǐ hǎo", vn: "Xin chào" },
  { ch: "欢迎光临", py: "huān yíng guāng lín", vn: "Chào mừng quý khách" },
  { ch: "买", py: "mǎi", vn: "Mua" },
  { ch: "什么", py: "shén me", vn: "Cái gì" },
  { ch: "多少钱", py: "duō shao qián", vn: "Bao nhiêu tiền" },
  { ch: "块", py: "kuài", vn: "Đồng (tệ)" },
  { ch: "结账", py: "jié zhàng", vn: "Thanh toán" },
  { ch: "一共", py: "yí gòng", vn: "Tổng cộng" },
  { ch: "支付宝", py: "zhī fù bǎo", vn: "Alipay" },
  { ch: "微信", py: "wēi xìn", vn: "WeChat" },
  { ch: "现金", py: "xiàn jīn", vn: "Tiền mặt" },
  { ch: "确认", py: "què rèn", vn: "Xác nhận" },
  { ch: "手镯", py: "shǒu zhuó", vn: "Vòng tay" },
  { ch: "手套", py: "shǒu tào", vn: "Găng tay" },
  { ch: "手表", py: "shǒu biǎo", vn: "Đồng hồ" },
  { ch: "书", py: "shū", vn: "Sách" },
  { ch: "杯子", py: "bēi zi", vn: "Cái cốc" },
  { ch: "碗", py: "wǎn", vn: "Cái bát" },
  { ch: "手机", py: "shǒu jī", vn: "Điện thoại" },
];

export const products: TbProduct[] = [
  { id: 1, emoji: "💍", name: "手镯", price: 100, unit: "个", sales: "200+", tag: "包邮" },
  { id: 2, emoji: "🧤", name: "手套", price: 20, unit: "双", sales: "500+", tag: "热销" },
  { id: 3, emoji: "⌚", name: "手表", price: 80, unit: "块", sales: "100+", tag: "新款" },
  { id: 4, emoji: "📚", name: "书", price: 35, unit: "本", sales: "1k+", tag: "包邮" },
  { id: 5, emoji: "🥛", name: "杯子", price: 28, unit: "个", sales: "300+", tag: "推荐" },
  { id: 6, emoji: "🥣", name: "碗", price: 15, unit: "个", sales: "800+", tag: "特价" },
  { id: 7, emoji: "📱", name: "手机", price: 1500, unit: "部", sales: "50+", tag: "正品" },
];

export const NUM_MAP: Record<number, string> = { 1: "一", 2: "两", 3: "三", 4: "四", 5: "五" };
