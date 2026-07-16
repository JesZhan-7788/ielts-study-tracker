"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { planData, type PlanDay, type PlanItem, type PlanPhase } from "./plan-data";

type StoredDay = { items: PlanItem[] };
type StorageApi = {
  get: (key: string, shared?: boolean) => Promise<unknown>;
  set: (key: string, value: string, shared?: boolean) => Promise<unknown>;
};

const REMINDER_CATEGORIES = ["语法", "阅读", "听力", "精听", "写作", "口语", "Task 1 入门"];
const REMINDER_OPTIONS = [3, 5, 7, 10];

function storageKey(phaseId: string, dayIndex: number) {
  return `${phaseId}:day:${dayIndex}`;
}

function getStorageApi(): StorageApi | undefined {
  return (window as Window & { storage?: StorageApi }).storage;
}

async function readStoredDay(key: string): Promise<StoredDay | null> {
  try {
    const api = getStorageApi();
    const result = api ? await api.get(key, false) : window.localStorage.getItem(key);
    const value = typeof result === "object" && result !== null && "value" in result
      ? (result as { value: unknown }).value
      : result;
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) : (value as StoredDay);
  } catch {
    return null;
  }
}

async function writeStoredDay(key: string, value: StoredDay) {
  const serialized = JSON.stringify(value);
  const api = getStorageApi();
  if (api) {
    await api.set(key, serialized, false);
  } else {
    window.localStorage.setItem(key, serialized);
  }
}

function mergeItems(planned: PlanItem[], stored?: StoredDay | null): PlanItem[] {
  if (!stored) return planned.map((item) => ({ ...item }));
  const storedById = new Map(stored.items.map((item) => [item.id, item]));
  const originalItems = planned.map((item) => {
    const saved = storedById.get(item.id);
    return saved ? { ...item, ...saved, isCustom: false } : { ...item };
  });
  const customItems = stored.items.filter((item) => item.isCustom);
  return [...originalItems, ...customItems];
}

function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatCheckedDate(value: string | null) {
  if (!value) return "";
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)} 完成`;
}

function plannedProgress(items: PlanItem[]) {
  const planned = items.filter((item) => !item.isCustom);
  return {
    completed: planned.filter((item) => item.checked).length,
    total: planned.length,
  };
}

function dayStatus(items: PlanItem[]) {
  const { completed, total } = plannedProgress(items);
  if (completed === 0) return "not-started";
  return completed === total ? "complete" : "partial";
}

function currentLocation() {
  const params = new URLSearchParams(window.location.search);
  const phaseId = params.get("phase") || planData.phases[0].phaseId;
  const day = Number(params.get("day"));
  return { phaseId, dayIndex: Number.isFinite(day) && day > 0 ? day : null };
}

function Smiley() {
  return <span className="smiley" aria-hidden="true"><span /></span>;
}

function Overview({
  phases,
  phase,
  itemsByDay,
  reminderWindow,
  onReminderWindowChange,
  onPhaseChange,
  onOpenDay,
}: {
  phases: PlanPhase[];
  phase: PlanPhase;
  itemsByDay: Record<string, PlanItem[]>;
  reminderWindow: number;
  onReminderWindowChange: (value: number) => void;
  onPhaseChange: (phaseId: string) => void;
  onOpenDay: (dayIndex: number) => void;
}) {
  const reminders = useMemo(() => {
    const result = new Map<number, string[]>();

    phase.days.forEach((day, index) => {
      if (index < reminderWindow - 1) return;
      const windowDays = phase.days.slice(index - reminderWindow + 1, index + 1);
      const overdue = REMINDER_CATEGORIES.filter((category) => {
        const matching = windowDays.flatMap((windowDay) =>
          (itemsByDay[storageKey(phase.phaseId, windowDay.dayIndex)] || windowDay.items)
            .filter((item) => !item.isCustom && item.category === category),
        );
        return matching.length > 0 && matching.every((item) => !item.checked);
      });
      if (overdue.length) result.set(day.dayIndex, overdue);
    });

    return result;
  }, [itemsByDay, phase, reminderWindow]);

  const totalItems = phase.days.reduce((sum, day) => {
    const items = itemsByDay[storageKey(phase.phaseId, day.dayIndex)] || day.items;
    return sum + plannedProgress(items).total;
  }, 0);
  const totalCompleted = phase.days.reduce((sum, day) => {
    const items = itemsByDay[storageKey(phase.phaseId, day.dayIndex)] || day.items;
    return sum + plannedProgress(items).completed;
  }, 0);
  const percent = totalItems ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return (
    <main className="page overview-page">
      <header className="hero">
        <div>
          <p className="eyebrow">IELTS · 六个月计划</p>
          <h1>把每一天，轻轻打个勾</h1>
          <p className="hero-copy">{phase.phaseName} · {phase.days.length} 天</p>
        </div>
        <div className="progress-stamp" aria-label={`当前阶段完成 ${percent}%`}>
          <strong>{percent}%</strong>
          <span>计划完成</span>
        </div>
      </header>

      <section className="phase-strip" aria-label="阶段信息">
        {phases.length > 1 ? (
          <label className="phase-selector">
            <span className="label">当前阶段</span>
            <select value={phase.phaseId} onChange={(event) => onPhaseChange(event.target.value)}>
              {phases.map((candidate) => <option key={candidate.phaseId} value={candidate.phaseId}>{candidate.phaseName}</option>)}
            </select>
          </label>
        ) : (
          <div>
            <span className="label">当前阶段</span>
            <strong>{phase.phaseName}</strong>
          </div>
        )}
        <label className="reminder-control">
          <span>连续提醒</span>
          <select value={reminderWindow} onChange={(event) => onReminderWindowChange(Number(event.target.value))}>
            {REMINDER_OPTIONS.map((option) => <option key={option} value={option}>{option} 天</option>)}
          </select>
        </label>
      </section>

      <div className="legend" aria-label="完成状态图例">
        <span><i className="legend-dot not-started" />未开始</span>
        <span><i className="legend-dot partial" />进行中</span>
        <span><i className="legend-dot complete" />已完成</span>
        <span className="legend-note">仅统计原计划任务</span>
      </div>

      <section className="day-grid" aria-label="阶段一每日计划">
        {phase.days.map((day) => {
          const items = itemsByDay[storageKey(phase.phaseId, day.dayIndex)] || day.items;
          const status = dayStatus(items);
          const progress = plannedProgress(items);
          const dayReminders = reminders.get(day.dayIndex) || [];

          return (
            <button
              className={`day-card ${status}`}
              key={day.dayIndex}
              onClick={() => onOpenDay(day.dayIndex)}
              aria-label={`Day ${day.dayIndex}，已完成 ${progress.completed} 项，共 ${progress.total} 项${dayReminders.length ? `，提醒：${dayReminders.join("、")}` : ""}`}
            >
              {dayReminders.length > 0 && (
                <span className="alert-badge" title={`${dayReminders.join("、")}连续 ${reminderWindow} 天未打卡`}>
                  !<small>{dayReminders.length}</small>
                </span>
              )}
              <span className="day-label">Day</span>
              <strong>{day.dayIndex}</strong>
              <span className="item-count">{progress.completed}/{progress.total}</span>
              {status === "complete" && <Smiley />}
            </button>
          );
        })}
      </section>

      <footer className="overview-footer">
        <span>慢一点也没关系</span>
        <span className="footer-line" />
        <span>持续就很了不起</span>
      </footer>
    </main>
  );
}

function Detail({
  phase,
  day,
  items,
  onBack,
  onNavigate,
  onChange,
}: {
  phase: PlanPhase;
  day: PlanDay;
  items: PlanItem[];
  onBack: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onChange: (items: PlanItem[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("其他");
  const [newText, setNewText] = useState("");
  const touchStartX = useRef<number | null>(null);
  const { completed, total } = plannedProgress(items);
  const isFirst = day.dayIndex === 1;
  const isLast = day.dayIndex === phase.days.length;

  const updateItem = (id: string, patch: Partial<PlanItem>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const beginEdit = (item: PlanItem) => {
    setEditingId(item.id);
    setDraft(item.text);
  };

  const saveEdit = () => {
    if (editingId && draft.trim()) updateItem(editingId, { text: draft.trim() });
    setEditingId(null);
  };

  const addItem = () => {
    if (!newText.trim()) return;
    onChange([...items, {
      id: `${phase.phaseId}d${day.dayIndex}custom-${Date.now()}`,
      category: newCategory,
      text: newText.trim(),
      checked: false,
      checkedDate: null,
      isCustom: true,
    }]);
    setNewText("");
    setNewCategory("其他");
    setAdding(false);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if ((event.target as HTMLElement).closest("input, button, select")) return;
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 56) return;
    if (delta < 0 && !isLast) onNavigate(1);
    if (delta > 0 && !isFirst) onNavigate(-1);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).matches("input, select")) return;
      if (event.key === "ArrowLeft" && !isFirst) onNavigate(-1);
      if (event.key === "ArrowRight" && !isLast) onNavigate(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFirst, isLast, onNavigate]);

  return (
    <main className="page detail-page" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header className="detail-header">
        <button className="back-button" onClick={onBack} aria-label="返回总览">← <span>总览</span></button>
        <span className="day-position">{day.dayIndex} / {phase.days.length}</span>
      </header>

      <section className="day-heading">
        <p>{day.calendarDate} · {day.weekday}</p>
        <h1><span>Day</span> {day.dayIndex}</h1>
        <div className="detail-progress">
          <div className="progress-track"><span style={{ width: `${total ? (completed / total) * 100 : 0}%` }} /></div>
          <span>{completed}/{total} 计划任务</span>
        </div>
      </section>

      <section className="task-list" aria-label={`Day ${day.dayIndex} 任务`}>
        {items.map((item) => (
          <article className={`task-row ${item.checked ? "checked" : ""}`} key={item.id}>
            <button
              className="drawn-checkbox"
              onClick={() => updateItem(item.id, {
                checked: !item.checked,
                checkedDate: item.checked ? null : todayIso(),
              })}
              aria-label={`${item.checked ? "取消完成" : "标记完成"}：${item.category} ${item.text}`}
              aria-pressed={item.checked}
            >
              {item.checked && <span>✓</span>}
            </button>
            <div className="task-content">
              {editingId === item.id ? (
                <input
                  className="edit-input"
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") setEditingId(null);
                  }}
                  aria-label="编辑任务文字"
                />
              ) : (
                <button className="task-text" onClick={() => beginEdit(item)}>
                  <span className="category">{item.category}：</span>{item.text}
                </button>
              )}
              <div className="task-meta">
                {item.isCustom && <span className="custom-tag">自建</span>}
                {item.checkedDate && <span>{formatCheckedDate(item.checkedDate)}</span>}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="add-section">
        {adding ? (
          <div className="add-form">
            <select value={newCategory} onChange={(event) => setNewCategory(event.target.value)} aria-label="任务分类">
              {[...REMINDER_CATEGORIES, "其他"].map((category) => <option key={category}>{category}</option>)}
            </select>
            <input
              autoFocus
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addItem();
                if (event.key === "Escape") setAdding(false);
              }}
              placeholder="写下临时替代或加练任务…"
              aria-label="自建任务内容"
            />
            <button className="add-confirm" onClick={addItem}>加入</button>
            <button className="add-cancel" onClick={() => setAdding(false)} aria-label="取消添加">×</button>
          </div>
        ) : (
          <button className="add-button" onClick={() => setAdding(true)}>＋ 添加自建任务</button>
        )}
      </section>

      <aside className="materials-note">
        <span className="materials-icon" aria-hidden="true">▥</span>
        <div><strong>参考教材</strong><p>{day.materialsNote}</p></div>
      </aside>

      <nav className="day-navigation" aria-label="切换日期">
        <button disabled={isFirst} onClick={() => onNavigate(-1)}>← 前一天</button>
        <span>左右滑动切换</span>
        <button disabled={isLast} onClick={() => onNavigate(1)}>后一天 →</button>
      </nav>
    </main>
  );
}

export default function Home() {
  const [activePhaseId, setActivePhaseId] = useState(planData.phases[0].phaseId);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [itemsByDay, setItemsByDay] = useState<Record<string, PlanItem[]>>({});
  const [reminderWindow, setReminderWindow] = useState(7);
  const [hydrated, setHydrated] = useState(false);
  const phase = planData.phases.find((candidate) => candidate.phaseId === activePhaseId) || planData.phases[0];

  useEffect(() => {
    const syncLocation = () => {
      const location = currentLocation();
      setActivePhaseId(planData.phases.some((candidate) => candidate.phaseId === location.phaseId) ? location.phaseId : planData.phases[0].phaseId);
      setActiveDayIndex(location.dayIndex);
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);

  useEffect(() => {
    const load = async () => {
      const loadedEntries = await Promise.all(planData.phases.flatMap((candidate) =>
        candidate.days.map(async (day) => {
          const key = storageKey(candidate.phaseId, day.dayIndex);
          const saved = await readStoredDay(key);
          return [key, mergeItems(day.items, saved)] as const;
        }),
      ));
      setItemsByDay(Object.fromEntries(loadedEntries));
      const savedWindow = Number(window.localStorage.getItem("ielts:reminder-window"));
      if (REMINDER_OPTIONS.includes(savedWindow)) setReminderWindow(savedWindow);
      setHydrated(true);
    };
    void load();
  }, []);

  const navigate = useCallback((dayIndex: number | null, phaseId = activePhaseId) => {
    const params = new URLSearchParams();
    if (phaseId !== planData.phases[0].phaseId) params.set("phase", phaseId);
    if (dayIndex !== null) params.set("day", String(dayIndex));
    const query = params.toString();
    window.history.pushState({}, "", query ? `?${query}` : window.location.pathname);
    setActivePhaseId(phaseId);
    setActiveDayIndex(dayIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePhaseId]);

  const updateDay = async (day: PlanDay, items: PlanItem[]) => {
    const key = storageKey(phase.phaseId, day.dayIndex);
    setItemsByDay((current) => ({ ...current, [key]: items }));
    try {
      await writeStoredDay(key, { items });
    } catch {
      // Keep the optimistic state; the next interaction can retry persistence.
    }
  };

  const activeDay = activeDayIndex === null ? null : phase.days.find((day) => day.dayIndex === activeDayIndex) || null;

  if (!hydrated) {
    return <main className="loading-page"><span className="loading-mark">✓</span><p>正在翻开今天的计划…</p></main>;
  }

  if (activeDay) {
    const key = storageKey(phase.phaseId, activeDay.dayIndex);
    return (
      <Detail
        phase={phase}
        day={activeDay}
        items={itemsByDay[key] || activeDay.items}
        onBack={() => navigate(null)}
        onNavigate={(direction) => navigate(activeDay.dayIndex + direction)}
        onChange={(items) => void updateDay(activeDay, items)}
      />
    );
  }

  return (
    <Overview
      phases={planData.phases}
      phase={phase}
      itemsByDay={itemsByDay}
      reminderWindow={reminderWindow}
      onReminderWindowChange={(value) => {
        setReminderWindow(value);
        window.localStorage.setItem("ielts:reminder-window", String(value));
      }}
      onPhaseChange={(phaseId) => navigate(null, phaseId)}
      onOpenDay={(dayIndex) => navigate(dayIndex)}
    />
  );
}
