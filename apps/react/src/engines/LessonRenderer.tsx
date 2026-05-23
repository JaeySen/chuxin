import type { Lesson } from "@hanai/shared";
import { Flashcard } from "./Flashcard";
import { Mcq } from "./Mcq";
import { FillBlank } from "./FillBlank";
import { Translate } from "./Translate";
import { MatchPairs } from "./MatchPairs";
import { ListenPick } from "./ListenPick";
import { ListenTf } from "./ListenTf";
import { ReadingToggle } from "./ReadingToggle";
import { ReadingTooltip } from "./ReadingTooltip";
import { CountingGrid } from "./CountingGrid";
import { LuckyDraw } from "./LuckyDraw";
import { RolePlay } from "./RolePlay";
import { Debate } from "./Debate";
import { Worksheet } from "./Worksheet";
import { Dialogue } from "./Dialogue";
import { GrammarTabs } from "./GrammarTabs";

export function LessonRenderer({ lesson }: { lesson: Lesson }) {
  switch (lesson.interactionType) {
    case "flashcard": return <Flashcard lesson={lesson} />;
    case "mcq": return <Mcq lesson={lesson} />;
    case "fill-blank": return <FillBlank lesson={lesson} />;
    case "translate": return <Translate lesson={lesson} />;
    case "match-pairs": return <MatchPairs lesson={lesson} />;
    case "listen-pick": return <ListenPick lesson={lesson} />;
    case "listen-tf": return <ListenTf lesson={lesson} />;
    case "reading-toggle": return <ReadingToggle lesson={lesson} />;
    case "reading-tooltip": return <ReadingTooltip lesson={lesson} />;
    case "counting-grid": return <CountingGrid lesson={lesson} />;
    case "lucky-draw": return <LuckyDraw lesson={lesson} />;
    case "role-play": return <RolePlay lesson={lesson} />;
    case "debate": return <Debate lesson={lesson} />;
    case "worksheet": return <Worksheet lesson={lesson} />;
    case "dialogue": return <Dialogue lesson={lesson} />;
    case "grammar-tabs": return <GrammarTabs lesson={lesson} />;
  }
}
