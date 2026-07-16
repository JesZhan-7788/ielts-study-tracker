export type PlanItem = {
  id: string;
  category: string;
  text: string;
  checked: boolean;
  checkedDate: string | null;
  isCustom: boolean;
};

export type PlanDay = {
  dayIndex: number;
  calendarDate: string;
  weekday: string;
  weekNumber: number;
  items: PlanItem[];
  materialsNote: string;
};

export type PlanPhase = {
  phaseId: string;
  phaseName: string;
  dateRange: [string, string];
  days: PlanDay[];
};

type DaySource = {
  date: string;
  weekday: string;
  week: number;
  content: string;
  materials: string;
};

const daySources: DaySource[] = [
  { date: "2026-07-08", weekday: "周三", week: 1, content: "语法: 冠词专项；阅读: 《雅思主题阅读法》剩余部分；精听: 重听剑桥17 Test 1 听力错题", materials: "顾家北写作语法知识；雅思主题阅读法；剑17 Test 1" },
  { date: "2026-07-09", weekday: "周四", week: 1, content: "听力: 按 `语料库练习模板(剑19)-2024.8.15` 做 1 个场景听写训练；写作: 用顾家北框架重写 Task 2 开头段", materials: "王陆语料库；语料库练习模板(剑19)-2024.8.15；顾家北写作" },
  { date: "2026-07-10", weekday: "周五", week: 1, content: "语法: 单复数专项；阅读: 剑15-19 中任选一套 TFNG 专项；听力: 王陆语料库精听听写训练", materials: "顾家北写作语法知识；剑15-19；王陆语料库" },
  { date: "2026-07-11", weekday: "周六", week: 1, content: "语法: 动词形式；写作: 顾家北词伙 2.0 版教育/科技话题积累；口语: 慎小嶷《十天突破雅思口语》挑 1 个 Part 1 话题，文字组织答案", materials: "顾家北写作语法知识；顾家北词伙 2.0；十天突破雅思口语" },
  { date: "2026-07-12", weekday: "周日", week: 1, content: "语法: 自查清单；听力: 剑15-19 中任选一套 Section 1+2；王陆语料库: 复盘本周生词/连读难点", materials: "顾家北写作语法知识；剑15-19；王陆语料库" },
  { date: "2026-07-13", weekday: "周一", week: 1, content: "写作: 完整 Task 2 一篇，用顾家北框架搭建结构；阅读: 整套模考", materials: "顾家北写作；剑15-19" },
  { date: "2026-07-14", weekday: "周二", week: 1, content: "口语: 朗读本周话题稿；整理本周错题和生词，补齐 Daily Log", materials: "十天突破雅思口语；王陆语料库；Daily-Logs" },
  { date: "2026-07-15", weekday: "周三", week: 2, content: "语法: 固定搭配专项 1；精听: 王陆语料库 1 个生活场景听写；口语: 家乡 Part 1 答案框架", materials: "王陆语料库；十天突破雅思口语；高频短语速记本" },
  { date: "2026-07-16", weekday: "周四", week: 2, content: "阅读: 剑15-19 任选一套 TFNG 专项；写作: 小任务改写练习 1，重写开头段和主题句", materials: "剑15-19；顾家北写作；顾家北词伙 2.0" },
  { date: "2026-07-17", weekday: "周五", week: 2, content: "语法: 中式英语常见误区 1；精听: 王陆语料库 1 个教育场景听写；口语: 家乡话题补充例子", materials: "顾家北写作语法知识；王陆语料库；十天突破雅思口语" },
  { date: "2026-07-18", weekday: "周六", week: 2, content: "写作: 小任务改写练习 2，改主体段展开；阅读: TFNG 错题复盘", materials: "顾家北写作；剑15-19；雅思主题阅读法" },
  { date: "2026-07-19", weekday: "周日", week: 2, content: "精听: 王陆语料库 1 个健康场景听写；口语: 健康 Part 1 文字稿；语法: 固定搭配专项 2", materials: "王陆语料库；十天突破雅思口语；高频短语速记本" },
  { date: "2026-07-20", weekday: "周一", week: 2, content: "写作: 完整 Task 2 一篇，环境类话题；复盘顾家北话题分类中的环境表达", materials: "顾家北写作；顾家北词伙 2.0" },
  { date: "2026-07-21", weekday: "周二", week: 2, content: "周复盘: 汇总听写错词、TFNG 错因、写作问题；补齐本周 Daily Log", materials: "王陆语料库；Reading-Errors；Weekly-Reviews" },
  { date: "2026-07-22", weekday: "周三", week: 3, content: "听力: 剑15-19 任选一套 Section 1+2；精听错题句", materials: "剑15-19；王陆语料库" },
  { date: "2026-07-23", weekday: "周四", week: 3, content: "听力: 同一套 Section 3 前 5 题；复盘转折词和多人讨论定位", materials: "剑15-19；王陆语料库" },
  { date: "2026-07-24", weekday: "周五", week: 3, content: "写作: 完整 Task 2 一篇，工作类话题；整理可复用观点和例子", materials: "顾家北写作；顾家北词伙 2.0" },
  { date: "2026-07-25", weekday: "周六", week: 3, content: "Task 1 入门: 图表题基础，学习描述趋势、对比和数据选择", materials: "慎小嶷十天突破雅思写作；顾家北写作" },
  { date: "2026-07-26", weekday: "周日", week: 3, content: "口语: 未来打算话题，开始练 Part 2 1 分钟准备+2 分钟输出", materials: "十天突破雅思口语；高频短语速记本" },
  { date: "2026-07-27", weekday: "周一", week: 3, content: "口语: 教育话题 Part 2，整理 1 个可复用人物/经历素材", materials: "十天突破雅思口语；Vocabulary/教育" },
  { date: "2026-07-28", weekday: "周二", week: 3, content: "阅读: 任选一套完整 Passage 1 计时；记录定位词和错因", materials: "剑15-19；雅思主题阅读法；Reading-Errors" },
  { date: "2026-07-29", weekday: "周三", week: 4, content: "听力: 剑15-19 任选一套 Section 1+2，先不看答案，为复盘保留", materials: "剑15-19" },
  { date: "2026-07-30", weekday: "周四", week: 4, content: "写作: 完整 Task 2 一篇，按顾家北框架限时完成", materials: "顾家北写作；顾家北词伙 2.0" },
  { date: "2026-07-31", weekday: "周五", week: 4, content: "口语: 准备 2 个话题文字稿，覆盖家乡和健康", materials: "十天突破雅思口语；高频短语速记本" },
  { date: "2026-08-01", weekday: "周六", week: 4, content: "口语: 准备 3 个话题文字稿，覆盖未来打算、教育和工作", materials: "十天突破雅思口语；高频短语速记本" },
  { date: "2026-08-02", weekday: "周日", week: 4, content: "阅读: 任选一套完整 Reading，先不看答案，为复盘保留", materials: "剑15-19；雅思主题阅读法" },
  { date: "2026-08-03", weekday: "周一", week: 4, content: "语法: 复习冠词、单复数、动词形式、自查清单，做一次综合检测", materials: "顾家北写作语法知识" },
  { date: "2026-08-04", weekday: "周二", week: 4, content: "月度复盘: 汇总听力、阅读、写作、口语材料，确定阶段二重点", materials: "Weekly-Reviews；Dashboard；Materials" },
];

function parseItems(content: string, dayIndex: number): PlanItem[] {
  return content.split("；").map((part, itemIndex) => {
    const separator = part.indexOf(":");
    const category = separator > -1 ? part.slice(0, separator).trim() : "其他";
    const text = separator > -1 ? part.slice(separator + 1).trim() : part.trim();

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
      dateRange: ["2026-07-08", "2026-08-04"],
      days: daySources.map((source, index) => ({
        dayIndex: index + 1,
        calendarDate: source.date,
        weekday: source.weekday,
        weekNumber: source.week,
        items: parseItems(source.content, index + 1),
        materialsNote: source.materials,
      })),
    },
  ],
};
