import { z } from "zod";
import { CourseIdSchema } from "./course.js";

const HanziToken = z.object({
  hanzi: z.string(),
  pinyin: z.string(),
  vi: z.string(),
});

const Example = HanziToken;

const McqQuestion = z.object({
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(8),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().optional(),
  audioUrl: z.string().url().optional(),
});

const FillBlankItem = z.object({
  prompt: z.string(),
  blanks: z
    .array(
      z.object({
        answer: z.string(),
        alternatives: z.array(z.string()).default([]),
      }),
    )
    .min(1),
  hint: z.string().optional(),
});

const Common = z.object({
  id: z.string().min(1),
  course: CourseIdSchema,
  order: z.number().int().nonnegative(),
  title: z.string(),
  subtitle: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const LessonSchema = z.discriminatedUnion("interactionType", [
  Common.extend({
    interactionType: z.literal("flashcard"),
    cards: z
      .array(HanziToken.extend({ example: Example.optional() }))
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("mcq"),
    questions: z.array(McqQuestion).min(1),
  }),

  Common.extend({
    interactionType: z.literal("fill-blank"),
    items: z.array(FillBlankItem).min(1),
    toneSensitive: z.boolean().default(false),
  }),

  Common.extend({
    interactionType: z.literal("translate"),
    direction: z.enum(["zh-vi", "vi-zh"]).default("zh-vi"),
    pairs: z
      .array(
        z.object({
          zh: z.string(),
          vi: z.string(),
          pinyin: z.string().optional(),
          alternatives: z.array(z.string()).default([]),
        }),
      )
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("match-pairs"),
    pairKind: z.enum(["hanzi-pinyin", "hanzi-vi", "pinyin-vi"]),
    pairs: z.array(z.object({ a: z.string(), b: z.string() })).min(2),
  }),

  Common.extend({
    interactionType: z.literal("listen-pick"),
    items: z
      .array(
        z.object({
          audioUrl: z.string().url(),
          prompt: z.string().optional(),
          options: z.array(z.string()).min(2).max(6),
          correctIndex: z.number().int().nonnegative(),
          transcript: z.string().optional(),
        }),
      )
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("listen-tf"),
    items: z
      .array(
        z.object({
          audioUrl: z.string().url(),
          statement: z.string(),
          correct: z.boolean(),
          transcript: z.string().optional(),
        }),
      )
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("reading-toggle"),
    passage: z.array(HanziToken).min(1),
    vocab: z.array(HanziToken).default([]),
    comprehension: z.array(McqQuestion).default([]),
  }),

  Common.extend({
    interactionType: z.literal("reading-tooltip"),
    passage: z.string().min(1),
    glossary: z
      .array(
        z.object({
          token: z.string(),
          pinyin: z.string(),
          vi: z.string(),
        }),
      )
      .default([]),
    comprehension: z.array(McqQuestion).default([]),
  }),

  Common.extend({
    interactionType: z.literal("counting-grid"),
    cells: z.array(z.string()).min(2),
    gridCols: z.number().int().positive().default(5),
    startIndex: z.number().int().nonnegative().default(0),
    endIndex: z.number().int().nonnegative(),
  }),

  Common.extend({
    interactionType: z.literal("lucky-draw"),
    outcomes: z.array(z.string()).min(1),
    drawCount: z.number().int().positive().default(1),
  }),

  Common.extend({
    interactionType: z.literal("role-play"),
    startScene: z.string(),
    scenes: z
      .array(
        z.object({
          id: z.string(),
          speaker: z.string(),
          line: z.string(),
          pinyin: z.string().optional(),
          vi: z.string().optional(),
          audioUrl: z.string().url().optional(),
          choices: z
            .array(
              z.object({
                text: z.string(),
                vi: z.string().optional(),
                next: z.string(),
                isPreferred: z.boolean().default(false),
              }),
            )
            .default([]),
          end: z.boolean().default(false),
        }),
      )
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("debate"),
    topic: z.string(),
    topicVi: z.string().optional(),
    pro: z.array(z.string()).default([]),
    con: z.array(z.string()).default([]),
    discussionQuestions: z.array(z.string()).default([]),
  }),

  Common.extend({
    interactionType: z.literal("worksheet"),
    intro: z.string().optional(),
    fields: z
      .array(
        z.object({
          name: z.string(),
          label: z.string(),
          hint: z.string().optional(),
          type: z.enum(["text", "textarea"]).default("text"),
        }),
      )
      .min(1),
    submitMode: z.enum(["save", "print"]).default("save"),
  }),

  Common.extend({
    interactionType: z.literal("dialogue"),
    roles: z.array(z.string()).min(2),
    lines: z
      .array(
        z.object({
          speaker: z.string(),
          hanzi: z.string(),
          pinyin: z.string(),
          vi: z.string(),
          audioUrl: z.string().url().optional(),
        }),
      )
      .min(1),
  }),

  Common.extend({
    interactionType: z.literal("grammar-tabs"),
    theory: z
      .array(
        z.object({
          point: z.string(),
          explanation: z.string(),
          examples: z.array(HanziToken).default([]),
        }),
      )
      .min(1),
    vocab: z.array(HanziToken).default([]),
    exercises: z
      .object({
        mcq: z.array(McqQuestion).default([]),
        fillBlank: z.array(FillBlankItem).default([]),
      })
      .default({ mcq: [], fillBlank: [] }),
  }),
]);

export type Lesson = z.infer<typeof LessonSchema>;
export type InteractionType = Lesson["interactionType"];

export const ALL_INTERACTION_TYPES: InteractionType[] = [
  "flashcard",
  "mcq",
  "fill-blank",
  "translate",
  "match-pairs",
  "listen-pick",
  "listen-tf",
  "reading-toggle",
  "reading-tooltip",
  "counting-grid",
  "lucky-draw",
  "role-play",
  "debate",
  "worksheet",
  "dialogue",
  "grammar-tabs",
];

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  flashcard: "Flashcard",
  mcq: "Trắc nghiệm",
  "fill-blank": "Điền vào chỗ trống",
  translate: "Dịch câu",
  "match-pairs": "Ghép cặp",
  "listen-pick": "Nghe & chọn",
  "listen-tf": "Nghe & 对/错",
  "reading-toggle": "Bài đọc (ẩn/hiện)",
  "reading-tooltip": "Bài đọc (tra từ)",
  "counting-grid": "Đếm số",
  "lucky-draw": "Bốc thăm",
  "role-play": "Đóng vai",
  debate: "Tranh luận",
  worksheet: "Phiếu bài tập",
  dialogue: "Hội thoại",
  "grammar-tabs": "Ngữ pháp",
};

export type Progress = {
  firstSeenAt: number;
  lastSeenAt: number;
  attempts: number;
  bestScore: number | null;
  lastScore: number | null;
  completed: boolean;
  scoreHistory: { score: number; durationSec: number; at: number }[];
};
