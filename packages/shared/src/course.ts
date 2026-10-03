import { z } from "zod";

export const CourseIdSchema = z.enum(["han1", "han2", "han3", "han4", "han5", "han6", "thuong-mai", "tre-em", "1-1"]);
export type CourseId = z.infer<typeof CourseIdSchema>;

export type CourseStatus = "ongoing" | "opening-soon" | "enrolling" | "full" | "coming-soon";

export const CourseSchema = z.object({
  id: CourseIdSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  order: z.number().int().nonnegative(),
  color: z.string(),
  status: z.custom<CourseStatus>().optional(),
  image: z.string().optional(),
  lessonIds: z.array(z.string()).default([]),
  brochureUrl: z.string().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const COURSES: Course[] = [
  { 
    id: "1-1", 
    title: "Lớp học 1-1 & 1-2", 
    subtitle: "Khóa học được thiết kế linh hoạt theo mục tiêu, trình độ và nhu cầu của học viên. Thời gian học chủ động, giáo viên theo sát quá trình học tập, kịp thời hỗ trợ và điều chỉnh phương pháp phù hợp.", 
    order: 0, 
    color: "#a855f7",
    image: "/chuxin-logo.webp",
    lessonIds: [] 
  },
  { 
    id: "han1", 
    title: "HSK1 (Sơ cấp)", 
    subtitle: "Làm quen với Pinyin và chữ Hán, xây dựng nền tảng tiếng Trung vững chắc.", 
    order: 1, 
    color: "#c64a1f", 
    image: "/cover-hsk1.webp",
    lessonIds: [], 
    brochureUrl: "/brochure-hsk1-2.webp" 
  },
  { 
    id: "han2", 
    title: "HSK2 (Sơ cấp)", 
    subtitle: "Mở rộng vốn từ, luyện giao tiếp qua các chủ đề thường ngày.", 
    order: 2, 
    color: "#d97a1b", 
    image: "/cover-hsk2.webp",
    lessonIds: [], 
    brochureUrl: "/brochure-hsk1-2.webp" 
  },
  { 
    id: "han3", 
    title: "HSK3 (Sơ cấp)", 
    subtitle: "Tự tin giao tiếp, vững nền tảng – sẵn sàng chinh phục trình độ trung cấp.",         
    order: 3, 
    color: "#d97a1b", 
    image: "/cover-hsk3.webp",
    lessonIds: [] 
  },
  { 
    id: "han4", 
    title: "HSK4 (Trung cấp)", 
    subtitle: "Hơn 3.000 từ vựng – tự tin giao tiếp với người bản xứ, chủ động sử dụng tiếng Trung trong học tập, du lịch và đời sống.", 
    order: 4, 
    color: "#e6a316", 
    image: "/cover-hsk4.webp",
    lessonIds: [] 
  },
  { 
    id: "han5", 
    title: "HSK5 (Cao cấp)", 
    subtitle: "Hơn 4.000 từ vựng – tự tin xem phim, đọc truyện và khám phá thế giới tiếng Trung.",               
    order: 5, 
    color: "#ffc60b", 
    image: "/cover-hsk5.webp",
    lessonIds: [] 
  },
  { 
    id: "han6", 
    title: "HSK6 (Cao cấp)", 
    subtitle: "Hơn 5.000 từ vựng – tự tin du học và làm việc trong môi trường sử dụng tiếng Trung.",             
    order: 6, 
    color: "#8a6900", 
    image: "/cover-hsk6.webp",
    lessonIds: [] 
  },
  { 
    id: "tre-em",     
    title: "Tiếng Trung trẻ em",    
    subtitle: "Khơi mở ngôn ngữ, nuôi dưỡng tương lai. Giúp trẻ hình thành phản xạ ngôn ngữ từ sớm.",  
    order: 7, 
    color: "#16a34a", 
    image: "/tieng-trung-tre-em.webp",
    lessonIds: [] 
  },
  { 
    id: "thuong-mai", 
    title: "Tiếng Trung thương mại", 
    subtitle: "Học tiếng Trung qua các tình huống công việc thực tế, từ giao tiếp với khách hàng đến trao đổi và đàm phán thương mại.", 
    order: 8, 
    color: "#2563eb", 
    image: "/tieng-trung-thuong-mai.webp",
    lessonIds: [] 
  }
];