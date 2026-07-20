"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  normalizeCategory,
  planData,
  TASK_CATEGORIES,
  type PlanDay,
  type PlanItem,
  type PlanPhase,
  type TaskCategory,
} from "./plan-data";

type StoredDay = { items: PlanItem[] };
type StorageApi = {
  get: (key: string, shared?: boolean) => Promise<unknown>;
};

function storageKey(phaseId: string, dayIndex: number) {
  return `${phaseId}:day:${dayIndex}`;
}

function getStorageApi(): StorageApi | undefined {
  return (window as Window & { storage?: StorageApi }).storage;
}

async function readStoredDay(key: string): Promise<StoredDay | null> {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) return JSON.parse(saved) as StoredDay;
  } catch {
    // Try the legacy storage API below, then migrate its value to localStorage.
  }

  try {
    const api = getStorageApi();
    if (!api || typeof api.get !== "function") return null;
    const result = await api.get(key, false);
    const value = typeof result === "object" && result !== null && "value" in result
      ? (result as { value: unknown }).value
      : result;
    if (!value) return null;
    const stored = typeof value === "string" ? JSON.parse(value) : (value as StoredDay);
    window.localStorage.setItem(key, JSON.stringify(stored));
    return stored;
  } catch {
    return null;
  }
}

function writeStoredDay(key: string, value: StoredDay) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function itemSignature(item: PlanItem) {
  return `${normalizeCategory(String(item.category))}\u0000${item.text.trim()}`;
}

function mergeItems(
  planned: PlanItem[],
  stored?: StoredDay | null,
  preserveStoredById = false,
  matchingPool: PlanItem[] = stored?.items.filter((item) => !item.isCustom) ?? [],
  usedStoredIds: Set<string> = new Set(),
): PlanItem[] {
  if (!stored && matchingPool.length === 0) return planned.map((item) => ({ ...item }));
  const storedItems = stored?.items ?? [];
  const storedOriginal = storedItems.filter((item) => !item.isCustom);
  const storedById = new Map(storedOriginal.map((item) => [item.id, item]));
  const originalItems = planned.map((item) => {
    const savedById = storedById.get(item.id);
    const saved = preserveStoredById
      ? savedById
      : matchingPool.find((candidate) =>
        candidate.id === item.id &&
        !usedStoredIds.has(candidate.id) &&
        itemSignature(candidate) === itemSignature(item),
      ) ?? matchingPool.find((candidate) =>
        !usedStoredIds.has(candidate.id) && itemSignature(candidate) === itemSignature(item),
      );
    if (!saved) return { ...item };
    usedStoredIds.add(saved.id);
    return preserveStoredById
      ? { ...item, ...saved, category: item.category, isCustom: false }
      : { ...item, checked: saved.checked, checkedDate: saved.checkedDate };
  });
  const customItems = storedItems
    .filter((item) => item.isCustom)
    .map((item) => ({ ...item, category: normalizeCategory(String(item.category)) }));
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.8 6.2 4 4" />
    </svg>
  );
}

function ConfirmIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.2 4L19 7" />
    </svg>
  );
}

function Overview({
  phases,
  phase,
  itemsByDay,
  onPhaseChange,
  onOpenDay,
}: {
  phases: PlanPhase[];
  phase: PlanPhase;
  itemsByDay: Record<string, PlanItem[]>;
  onPhaseChange: (phaseId: string) => void;
  onOpenDay: (dayIndex: number) => void;
}) {
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

          return (
            <button
              className={`day-card ${status}`}
              key={day.dayIndex}
              onClick={() => onOpenDay(day.dayIndex)}
              aria-label={`Day ${day.dayIndex}，已完成 ${progress.completed} 项，共 ${progress.total} 项`}
            >
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
  const [newCategory, setNewCategory] = useState<TaskCategory>("基础");
  const [newText, setNewText] = useState("");
  const touchStartX = useRef<number | null>(null);
  const { completed, total } = plannedProgress(items);
  const isFirst = day.dayIndex === 1;
  const isLast = day.dayIndex === phase.days.length;

  const updateItem = (id: string, patch: Partial<PlanItem>) => {
    onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const toggleItem = (item: PlanItem) => {
    updateItem(item.id, {
      checked: !item.checked,
      checkedDate: item.checked ? null : todayIso(),
    });
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
    setNewCategory("基础");
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
        <p>{day.calendarDate && day.weekday ? `${day.calendarDate} · ${day.weekday}` : "按实际学习节奏推进"}</p>
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
              onClick={() => toggleItem(item)}
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
                <button className="task-text" onClick={() => toggleItem(item)}>
                  <span className="category">{item.category}：</span>{item.text}
                </button>
              )}
              <div className="task-meta">
                {item.isCustom && <span className="custom-tag">自建</span>}
                {item.checkedDate && <span>{formatCheckedDate(item.checkedDate)}</span>}
              </div>
            </div>
            <button
              className={`edit-task ${editingId === item.id ? "editing" : ""}`}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => editingId === item.id ? saveEdit() : beginEdit(item)}
              aria-label={editingId === item.id ? "保存任务文字" : `编辑任务：${item.text}`}
            >
              {editingId === item.id ? <ConfirmIcon /> : <PencilIcon />}
            </button>
          </article>
        ))}
      </section>

      <section className="add-section">
        {adding ? (
          <div className="add-form">
            <select value={newCategory} onChange={(event) => setNewCategory(event.target.value as TaskCategory)} aria-label="任务分类">
              {TASK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
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

      {day.materialsNote && (
        <aside className="materials-note">
          <span className="materials-icon" aria-hidden="true">▥</span>
          <div><strong>参考教材</strong><p>{day.materialsNote}</p></div>
        </aside>
      )}

      {day.durationNote && (
        <aside className="materials-note duration-note">
          <span className="materials-icon" aria-hidden="true">时</span>
          <div><strong>预计时长</strong><p>{day.durationNote}</p></div>
        </aside>
      )}

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
  const [storageError, setStorageError] = useState<string | null>(null);
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
      const savedEntries = await Promise.all(planData.phases.flatMap((candidate) =>
        candidate.days.map(async (day) => {
          const key = storageKey(candidate.phaseId, day.dayIndex);
          const saved = await readStoredDay(key);
          return [key, saved] as const;
        }),
      ));
      const savedByDay = Object.fromEntries(savedEntries) as Record<string, StoredDay | null>;
      const loadedEntries = planData.phases.flatMap((candidate) => {
        const matchingPool = candidate.days
          .filter((day) => day.dayIndex > 5)
          .flatMap((day) =>
            (savedByDay[storageKey(candidate.phaseId, day.dayIndex)]?.items ?? [])
              .filter((item) => !item.isCustom),
          );
        const usedStoredIds = new Set<string>();
        return candidate.days.map((day) => {
          const key = storageKey(candidate.phaseId, day.dayIndex);
          return [key, mergeItems(
            day.items,
            savedByDay[key],
            day.dayIndex <= 5,
            matchingPool,
            usedStoredIds,
          )] as const;
        });
      });
      setItemsByDay(Object.fromEntries(loadedEntries));
      try {
        window.localStorage.removeItem("ielts:reminder-window");
      } catch {
        // A write attempt will show a visible warning if storage remains unavailable.
      }
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

  const updateDay = (day: PlanDay, items: PlanItem[]) => {
    const key = storageKey(phase.phaseId, day.dayIndex);
    setItemsByDay((current) => ({ ...current, [key]: items }));
    try {
      writeStoredDay(key, { items });
      setStorageError(null);
    } catch {
      setStorageError("本次修改未保存。请关闭无痕模式，并用 Safari 或主屏幕入口重新打开。");
    }
  };

  const activeDay = activeDayIndex === null ? null : phase.days.find((day) => day.dayIndex === activeDayIndex) || null;

  if (!hydrated) {
    return <main className="loading-page"><span className="loading-mark">✓</span><p>正在翻开今天的计划…</p></main>;
  }

  const content = activeDay ? (() => {
    const key = storageKey(phase.phaseId, activeDay.dayIndex);
    return (
      <Detail
        phase={phase}
        day={activeDay}
        items={itemsByDay[key] || activeDay.items}
        onBack={() => navigate(null)}
        onNavigate={(direction) => navigate(activeDay.dayIndex + direction)}
        onChange={(items) => updateDay(activeDay, items)}
      />
    );
  })() : (
    <Overview
      phases={planData.phases}
      phase={phase}
      itemsByDay={itemsByDay}
      onPhaseChange={(phaseId) => navigate(null, phaseId)}
      onOpenDay={(dayIndex) => navigate(dayIndex)}
    />
  );

  return (
    <>
      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      {content}
    </>
  );
}
