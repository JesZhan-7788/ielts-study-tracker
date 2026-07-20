export const TASK_CATEGORIES = ["基础", "阅读", "听力", "写作", "口语"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type PlanItem = {
  id: string;
  category: TaskCategory;
  text: string;
  checked: boolean;
  checkedDate: string | null;
  isCustom: boolean;
};

export type PlanDay = {
  dayIndex: number;
  calendarDate: string | null;
  weekday: string | null;
  weekNumber: number;
  items: PlanItem[];
  materialsNote: string | null;
  durationNote: string | null;
};

export type PlanPhase = {
  phaseId: string;
  phaseName: string;
  dateRange: [string, string | null];
  days: PlanDay[];
};

type DaySource = {
  date?: string;
  weekday?: string;
  week: number;
  content: string;
  materials?: string;
  duration?: string;
};

const CATEGORY_MAP: Record<string, TaskCategory> = {
  基础: "基础",
  语法: "基础",
  周复盘: "基础",
  月度复盘: "基础",
  其他: "基础",
  阅读: "阅读",
  听力: "听力",
  精听: "听力",
  王陆语料库: "听力",
  写作: "写作",
  "Task 1 入门": "写作",
  口语: "口语",
};

export function normalizeCategory(category: string, fallback: TaskCategory = "基础"): TaskCategory {
  const normalized = category.trim();
  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
  if (/Task\s*1/i.test(normalized)) return "写作";
  return fallback;
}

const daySources: DaySource[] = [
  { date: "2026-07-08", weekday: "周三", week: 1, content: "语法: 冠词专项；阅读: 《雅思主题阅读法》剩余部分；精听: 重听剑桥17 Test 1 听力错题", materials: "顾家北写作语法知识；雅思主题阅读法；剑17 Test 1" },
  { date: "2026-07-09", weekday: "周四", week: 1, content: "听力: 按 `语料库练习模板(剑19)-2024.8.15` 做 1 个场景听写训练；写作: 用顾家北框架重写 Task 2 开头段", materials: "王陆语料库；语料库练习模板(剑19)-2024.8.15；顾家北写作" },
  { date: "2026-07-10", weekday: "周五", week: 1, content: "语法: 单复数专项；阅读: 剑15-19 中任选一套 TFNG 专项；听力: 王陆语料库精听听写训练", materials: "顾家北写作语法知识；剑15-19；王陆语料库" },
  { date: "2026-07-11", weekday: "周六", week: 1, content: "语法: 动词形式；写作: 顾家北词伙 2.0 版教育/科技话题积累；口语: 慎小嶷《十天突破雅思口语》挑 1 个 Part 1 话题，文字组织答案", materials: "顾家北写作语法知识；顾家北词伙 2.0；十天突破雅思口语" },
  { date: "2026-07-12", weekday: "周日", week: 1, content: "语法: 自查清单；听力: 剑15-19 中任选一套 Section 1+2；王陆语料库: 复盘本周生词/连读难点", materials: "顾家北写作语法知识；剑15-19；王陆语料库" },
  { week: 2, content: "写作: 完整 Task 2 #1（顾家北框架，自选话题）；基础: 虚拟语气形容词触发型专项（已连续 2 次出错，优先）", duration: "~2h" },
  { week: 2, content: "口语: Part 2：Jes 新素材开发——建筑和设施类，构建三层表达库；口语: Part 1：是什么类 → 生活方式话题", duration: "~1.5h" },
  { week: 2, content: "听力: 剑15–19 任意一套 Section 1+2 整套；听力: 王陆语料库本周生词／连读难点复盘（长期欠债，强制项）", duration: "~2h" },
  { week: 2, content: "写作: 教育类词伙首轮产出（仿科技类模式，先自主产出后对照纠错）；基础: 定语从句关系代词专项", duration: "~1.5h" },
  { week: 2, content: "阅读: 剑15–19 任意一套 TFNG 限时专项（非整套）；口语: Part 1：你怎么看类 → 教育话题（配合刚学词伙）", duration: "~1.5h" },
  { week: 2, content: "基础: 周复盘①（Day 6–10）：遗留任务清算 + 口语矩阵覆盖度更新，补齐 Daily Log；口语: Part 3：论证句式专项——原因类 + 方法类", duration: "~1h" },
  { week: 3, content: "写作: 完整 Task 2 #2（环境类话题）；基础: 固定搭配专项", duration: "~2h" },
  { week: 3, content: "阅读: 阅读整套模考 #2（剑15–19 任选，做题 + 精析 + matrix 归类，独占当天）", duration: "~2.5h" },
  { week: 3, content: "口语: Part 2：家乡话题（原计划遗漏项，结合 Jes 素材）；口语: Part 1：为什么类 → 工作话题", duration: "~1.5h" },
  { week: 3, content: "写作: 城市化类词伙首轮产出；基础: 中式英语常见误区专项", duration: "~1.5h" },
  { week: 3, content: "听力: Section 3 专项——转折词 + 多人讨论定位训练；听力: 场景听写（教育或健康场景任选 1 个）", duration: "~1.5h" },
  { week: 3, content: "基础: 周复盘②（Day 11–16）：Jes 素材归档整理；口语: Part 3：论证句式专项——对比类 + 利弊类", duration: "~1h" },
  { week: 4, content: "写作: 完整 Task 2 #3（工作类话题）；基础: 主谓一致专项（不可数名词／动名词作主语）", duration: "~2h" },
  { week: 4, content: "口语: Part 2：物品类 Jes 素材开发；口语: Part 1：童年类话题迁移练习", duration: "~1.5h" },
  { week: 4, content: "阅读: 施正南法精读（剑17／18 任一 Passage，深度模式，独立分支对话）；写作: 科技类词伙第二轮巩固", duration: "~1.5h" },
  { week: 4, content: "听力: 剑15–19 任意一套 Section 1+2 整套 #2；听力: 生词／连读难点复盘", duration: "~2h" },
  { week: 4, content: "基础: 周复盘③（Day 17–21）；口语: Part 3：论证句式专项——展望未来类", duration: "~1h" },
  { week: 5, content: "写作: 完整 Task 2 #4（自选话题，限时完成）；基础: 综合自查清单", duration: "~2h" },
  { week: 5, content: "阅读: 阅读整套模考 #3（独占当天）", duration: "~2.5h" },
  { week: 5, content: "口语: 话题稿朗读 ×2（家乡／健康，成品输出）；口语: Part 1：剩余题型查漏补缺", duration: "~1.5h" },
  { week: 5, content: "写作: 工作类词伙首轮产出；基础: 错题本全面复盘", duration: "~1.5h" },
  { week: 5, content: "基础: 周复盘④（Day 23–26）；口语: Jes 档案：补全建筑设施类 + 物品类三层表达库", duration: "~1h" },
  { week: 6, content: "听力: 综合套题（不看答案，为阶段复盘保留）", duration: "~1h" },
  { week: 6, content: "阅读: 综合套题（不看答案，为阶段复盘保留）", duration: "~1h" },
  { week: 6, content: "基础: 阶段一综合复盘：汇总四项材料、口语 matrix 覆盖度，确定阶段二重点，更正总体实际结束日期", duration: "~1.5–2h" },
];

function parseItems(content: string, dayIndex: number): PlanItem[] {
  let previousCategory: TaskCategory = "基础";

  return content.split("；").map((part, itemIndex) => {
    const separator = part.indexOf(":");
    const text = separator > -1 ? part.slice(separator + 1).trim() : part.trim();
    const category = separator > -1
      ? normalizeCategory(part.slice(0, separator), previousCategory)
      : text.includes("Daily Log") ? "基础" : previousCategory;
    previousCategory = category;

    return {
      id: `p1d${dayIndex}i${itemIndex + 1}`,
      category,
      text,
      checked: false,
      checkedDate: null,
      isCustom: false,
    };
  });
}

export const planData: { phases: PlanPhase[] } = {
  phases: [
    {
      phaseId: "phase1",
      phaseName: "阶段一：恢复手感与建立节奏",
      dateRange: ["2026-07-08", null],
      days: daySources.map((source, index) => ({
        dayIndex: index + 1,
        calendarDate: source.date ?? null,
        weekday: source.weekday ?? null,
        weekNumber: source.week,
        items: parseItems(source.content, index + 1),
        materialsNote: source.materials ?? null,
        durationNote: source.duration ?? null,
      })),
    },
  ],
};
