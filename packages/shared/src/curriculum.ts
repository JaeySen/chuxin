import type { CourseId } from "./course.js";

export interface Chapter {
  course: CourseId;
  bai: number;
  hanzi: string;
  vi: string;
}

/**
 * HSK1 curriculum — 15 chapters.
 * Lesson YAML files map to a chapter via their `order` field.
 */
export const HSK1_CHAPTERS: Chapter[] = [
  { course: "han1", bai: 1,  hanzi: "AI 小语，你好!",         vi: "Xin chào, AI Tiểu Ngữ" },
  { course: "han1", bai: 2,  hanzi: "我叫李文",                vi: "Tôi tên là Lý Văn" },
  { course: "han1", bai: 3,  hanzi: "我是中国人。",            vi: "Tôi là người Trung Quốc" },
  { course: "han1", bai: 4,  hanzi: "我有两个孩子。",          vi: "Tôi có 2 người con" },
  { course: "han1", bai: 5,  hanzi: "今天我休息。",            vi: "Hôm nay tôi nghỉ ngơi" },
  { course: "han1", bai: 6,  hanzi: "你的手机号是多少？",      vi: "Số điện thoại của bạn là số mấy?" },
  { course: "han1", bai: 7,  hanzi: "我晚上六点半下班。",      vi: "Tôi tan làm lúc 6 giờ 30 phút tối" },
  { course: "han1", bai: 8,  hanzi: "我爸爸也在医院工作。",    vi: "Ba tôi cũng làm việc ở bệnh viện" },
  { course: "han1", bai: 9,  hanzi: "我明天上午在学校学习。",  vi: "Tôi buổi sáng ngày mai học ở trường" },
  { course: "han1", bai: 10, hanzi: "这儿的苹果真便宜。",      vi: "Táo của nơi này thì rất rẻ" },
  { course: "han1", bai: 11, hanzi: "我读大学呢。",            vi: "Tôi đang học đại học" },
  { course: "han1", bai: 12, hanzi: "昨天下雪了。",            vi: "Hôm qua tuyết rơi rồi" },
  { course: "han1", bai: 13, hanzi: "请给我一杯茶。",          vi: "Làm ơn cho tôi 1 tách trà" },
  { course: "han1", bai: 14, hanzi: "我看了一个电影。",        vi: "Tôi đã xem 1 bộ phim" },
  { course: "han1", bai: 15, hanzi: "大兴机场见！",            vi: "Gặp nhau ở sân bay Đại Hưng!" },
];

export const CHAPTERS_BY_COURSE: Record<CourseId, Chapter[]> = {
  han1: HSK1_CHAPTERS,
  han2: [],
  han3: [],
  han4: [],
  han5: [],
  han6: [],
  "thuong-mai": [],
  "tre-em": [],
};
