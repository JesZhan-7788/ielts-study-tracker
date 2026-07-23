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
  { week: 2, content: "口语: Part 2：建筑和设施类 Jes 素材开发；口语: Part 1：是什么类 × 生活方式话题", materials: "十天突破雅思口语；Jes人物档案", duration: "~1.5h" },
  { week: 2, content: "听力: Section 1+2 整套；听力: 本周生词／连读复盘；听力: Ch5 第3组：基础听写 → 变速复测 → 魔鬼跟读", materials: "剑15-19；王陆语料库", duration: "~2h20m–2h25m" },
  { week: 2, content: "写作: 教育类词伙首轮产出；基础: 定语从句关系代词专项；听力: 【滚动复盘 Ch5 #3】+ Ch5 第4组四步法", materials: "顾家北词伙2.0；顾家北写作语法知识；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 2, content: "阅读: TFNG 限时专项；口语: Part 1：你怎么看类 × 教育话题；听力: 【滚动复盘 Ch5 #4】+ Ch5 第5组四步法", materials: "剑15-19；雅思主题阅读法；十天突破雅思口语；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 2, content: "基础: 周复盘①（Day 6–10）+ 遗留清算；口语: Part 3：原因类 + 方法类论证句式", materials: "Weekly-Reviews；十天突破雅思口语", duration: "~1h" },
  { week: 3, content: "写作: 完整 Task 2 #2（环境类）。写作前：精读顾家北 2.2.11 思考观点、2.2.12 开头段和附录 1 观点角度，查阅急救短语环境类搭配，参考观点库环境类论点。写作后：自主分轮校对一遍再发我批改，批改后更新写作错题本；基础: 固定搭配专项 1；听力: 【滚动复盘 Ch5 #5】+ Ch5 第6组四步法", materials: "顾家北手把手教你雅思写作（2.2.11／2.2.12／附录1）；慎小嶷急救短语和速查短语；慎小嶷议论文观点库；顾家北写作语法知识；王陆语料库", duration: "~2h50m–2h55m" },
  { week: 3, content: "阅读: 阅读整套模考 #2（独占）", materials: "剑15-19", duration: "~2.5h" },
  { week: 3, content: "口语: Part 2：家乡话题；口语: Part 1：为什么类 × 工作话题；听力: 【滚动复盘 Ch5 #6】+ Ch5 第7组四步法", materials: "十天突破雅思口语；Jes档案；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 3, content: "写作: 城市化类词伙首轮产出；基础: 中式英语常见误区专项；听力: 【滚动复盘 Ch5 #7】+ Ch5 第8组四步法", materials: "顾家北词伙2.0；顾家北写作语法知识；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 3, content: "听力: Section 3 专项；听力: 【滚动复盘 Ch5 #8】+ Ch5 第9组四步法", materials: "剑15-19；王陆语料库", duration: "~1.5h" },
  { week: 3, content: "基础: 周复盘②（Day 11–16）+ Jes 素材归档；口语: Part 3：对比类 + 利弊类论证句式", materials: "Weekly-Reviews；十天突破雅思口语", duration: "~1h" },
  { week: 4, content: "写作: 完整 Task 2 #3（工作类）。写作前：精读顾家北 2.2.14 结尾段、2.2.19 句式变化和 2.2.18 减少中式英文，查阅急救短语工作类搭配，参考观点库工作类论点。写作后：自主分轮校对并更新错题本；基础: 主谓一致专项（不可数名词／动名词主语）", materials: "顾家北手把手教你雅思写作（2.2.14／2.2.19／2.2.18）；慎小嶷急救短语；慎小嶷议论文观点库；顾家北写作语法知识", duration: "~2.5h" },
  { week: 4, content: "口语: Part 2：物品类 Jes 素材开发；口语: Part 1：童年类话题迁移；听力: 【滚动复盘 Ch5 #9】+ Ch5 第10组四步法", materials: "十天突破雅思口语；Jes档案；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 4, content: "阅读: 施正南法精读（独立分支）；写作: 生活方式类词伙首轮产出（替换原“科技第二轮巩固”，优先补新话题）；听力: 【滚动复盘 Ch5 #10】+ Ch5 第11组四步法", materials: "雅思主题阅读法；顾家北词伙2.0；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 4, content: "听力: Section 1+2 整套 #2；听力: 【滚动复盘 Ch5 #11】+ Ch5 第12组四步法（Ch5 全部完成）", materials: "剑15-19；王陆语料库", duration: "~2h" },
  { week: 4, content: "基础: 周复盘③（Day 17–21）；口语: Part 3：展望未来类论证句式", materials: "Weekly-Reviews；十天突破雅思口语", duration: "~1h" },
  { week: 5, content: "写作: 完整 Task 2 #4（自选话题，限时）。写作前：精读顾家北 2.2.17 换词、2.2.21 标点与常见语法错误和附录 6／7／9（冠词单复数／词性／句子结构错误）。写作后：自主分轮校对并更新错题本；基础: 综合自查清单（个人定制版，非通用版）；听力: 【滚动复盘 Ch5 #12】+ Ch3 第1组四步法（转入 Ch3）", materials: "顾家北手把手教你雅思写作（2.2.17／2.2.21／附录6／7／9）；顾家北写作语法知识；王陆语料库", duration: "~2h50m–2h55m" },
  { week: 5, content: "阅读: 阅读整套模考 #3（独占）", materials: "剑15-19", duration: "~2.5h" },
  { week: 5, content: "口语: 话题稿朗读 ×2（家乡 + 健康）；口语: Part 1：剩余题型查漏补缺；听力: 【滚动复盘 Ch3 #1】+ Ch3 第2组四步法", materials: "十天突破雅思口语；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 5, content: "写作: 工作类词伙首轮产出；基础: 错题本全面复盘；听力: 【滚动复盘 Ch3 #2】+ Ch3 第3组四步法", materials: "顾家北词伙2.0；顾家北写作语法知识；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 5, content: "基础: 周复盘④（Day 23–26）；口语: Jes 档案：补全建筑设施 + 物品类三层表达库；听力: 【滚动复盘 Ch3 #3】+ Ch3 第4组四步法", materials: "Weekly-Reviews；Jes档案；王陆语料库", duration: "~1h20m–1h25m" },
  { week: 6, content: "写作: 政府类词伙首轮产出（新增，补覆盖率）；听力: 【滚动复盘 Ch3 #4】+ Ch3 第5组四步法", materials: "顾家北词伙2.0；王陆语料库", duration: "~1.5h" },
  { week: 6, content: "听力: 综合套题（不看答案，为复盘保留）", materials: "剑15-19", duration: "~1h" },
  { week: 6, content: "阅读: 综合套题（不看答案，为复盘保留）", materials: "剑15-19", duration: "~1h" },
  { week: 6, content: "写作: 环境类词伙首轮产出（新增，补覆盖率）；口语: Part 1：爱好类补漏；听力: 【滚动复盘 Ch3 #5】+ Ch3 第6组四步法", materials: "顾家北词伙2.0；十天突破雅思口语；王陆语料库", duration: "~1h50m–1h55m" },
  { week: 6, content: "基础: 阶段一综合复盘：汇总四项材料 + 口语 matrix 覆盖度 + 写作错题本高频类型，确定阶段二重点；听力: 【滚动复盘 Ch3 #6】+ Ch3 第7组四步法", materials: "Weekly-Reviews；Dashboard；写作错题本；王陆语料库", duration: "~1h50m–2h25m" },
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
