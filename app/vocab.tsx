"use client";

import { useMemo, useRef, useState } from "react";
import type { VocabCategory } from "./vocab-data";

export type VocabMastery = Record<string, boolean>;

export function VocabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5c2.4 0 4.2.7 7 2.2v11c-2.8-1.5-4.6-2.2-7-2.2v-11Z" />
      <path d="M19 5.5c-2.4 0-4.2.7-7 2.2v11c2.8-1.5 4.6-2.2 7-2.2v-11Z" />
    </svg>
  );
}

function masteryCount(category: VocabCategory, mastery: VocabMastery) {
  return category.phrases.filter((phrase) => mastery[phrase.id]).length;
}

function progressStatus(completed: number, total: number) {
  if (completed === 0) return "not-started";
  if (completed === total) return "complete";
  return "partial";
}

function MasteryIcon({ mastered }: { mastered: boolean }) {
  return <span aria-hidden="true">{mastered ? "✓" : "○"}</span>;
}

export function VocabOverview({
  categories,
  masteryByCategory,
  onBack,
  onOpenCategory,
}: {
  categories: VocabCategory[];
  masteryByCategory: Record<string, VocabMastery>;
  onBack: () => void;
  onOpenCategory: (categoryId: string) => void;
}) {
  const totalPhrases = categories.reduce((sum, category) => sum + category.phrases.length, 0);
  const totalMastered = categories.reduce(
    (sum, category) => sum + masteryCount(category, masteryByCategory[category.categoryId] ?? {}),
    0,
  );

  return (
    <main className="page vocab-page">
      <header className="vocab-page-header">
        <button className="back-button" onClick={onBack} aria-label="返回打卡总览">← <span>总览</span></button>
        <div className="vocab-title-row">
          <div>
            <p className="eyebrow">Vocabulary Quick Review</p>
            <h1>词伙速记</h1>
            <p>十类主题 · 中文回想英文</p>
          </div>
          <div className="vocab-total-progress" aria-label={`总掌握进度 ${totalMastered}/${totalPhrases}`}>
            <strong>{totalMastered}</strong>
            <span>/ {totalPhrases}</span>
          </div>
        </div>
      </header>

      <section className="vocab-category-grid" aria-label="词伙分类">
        {categories.map((category, index) => {
          const mastered = masteryCount(category, masteryByCategory[category.categoryId] ?? {});
          const status = progressStatus(mastered, category.phrases.length);
          return (
            <button
              className={`vocab-category-card ${status}`}
              key={category.categoryId}
              onClick={() => onOpenCategory(category.categoryId)}
              aria-label={`${category.categoryName}，已掌握 ${mastered}/${category.phrases.length}`}
            >
              <span className="vocab-category-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{category.categoryName}</strong>
              <span>已掌握 {mastered}/{category.phrases.length}</span>
              <i><span style={{ width: `${(mastered / category.phrases.length) * 100}%` }} /></i>
            </button>
          );
        })}
      </section>
    </main>
  );
}

export function VocabReview({
  category,
  mastery,
  onBack,
  onMasteryChange,
}: {
  category: VocabCategory;
  mastery: VocabMastery;
  onBack: () => void;
  onMasteryChange: (phraseId: string, mastered: boolean) => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const sortedPhrases = useMemo(() => [...category.phrases].sort((left, right) =>
    Number(Boolean(mastery[left.id])) - Number(Boolean(mastery[right.id])),
  ), [category.phrases, mastery]);
  const [cardQueue, setCardQueue] = useState(() => sortedPhrases.map((phrase) => phrase.id));
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const phrasesById = useMemo(
    () => new Map(category.phrases.map((phrase) => [phrase.id, phrase])),
    [category.phrases],
  );
  const currentPhrase = phrasesById.get(cardQueue[cardIndex]);
  const mastered = masteryCount(category, mastery);

  const toggleReveal = (phraseId: string) => {
    setRevealedIds((current) => {
      const next = new Set(current);
      if (next.has(phraseId)) next.delete(phraseId);
      else next.add(phraseId);
      return next;
    });
  };

  const markCard = (value: boolean) => {
    if (!currentPhrase) return;
    onMasteryChange(currentPhrase.id, value);
    setFlipped(false);
    setDragX(0);
    setCardIndex((current) => current + 1);
  };

  const restartCards = () => {
    const nextQueue = [...category.phrases]
      .sort((left, right) => Number(Boolean(mastery[left.id])) - Number(Boolean(mastery[right.id])))
      .map((phrase) => phrase.id);
    setCardQueue(nextQueue);
    setCardIndex(0);
    setFlipped(false);
    setDragX(0);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    didSwipe.current = false;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    setDragX(event.touches[0].clientX - touchStartX.current);
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    if (dragX >= 70) {
      didSwipe.current = true;
      markCard(true);
      return;
    }
    if (dragX <= -70) {
      didSwipe.current = true;
      markCard(false);
      return;
    }
    setDragX(0);
  };

  return (
    <main className="page vocab-page vocab-review-page">
      <header className="vocab-review-header">
        <button className="back-button" onClick={onBack} aria-label="返回词伙分类">← <span>词伙</span></button>
        <span>{mastered}/{category.phrases.length} 已掌握</span>
      </header>

      <section className="vocab-review-heading">
        <p className="eyebrow">Vocabulary Quick Review</p>
        <h1>{category.categoryName}</h1>
        <div className="view-switch" aria-label="视图切换">
          <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>列表</button>
          <button className={viewMode === "card" ? "active" : ""} onClick={() => setViewMode("card")}>卡片</button>
        </div>
      </section>

      {viewMode === "list" ? (
        <section className="vocab-phrase-list" aria-label={`${category.categoryName}词条列表`}>
          {sortedPhrases.map((phrase) => {
            const isRevealed = revealedIds.has(phrase.id);
            const isMastered = Boolean(mastery[phrase.id]);
            return (
              <article className={`vocab-phrase-row ${isMastered ? "mastered" : ""}`} key={phrase.id}>
                <button className="vocab-phrase-main" onClick={() => toggleReveal(phrase.id)} aria-expanded={isRevealed}>
                  <strong>{phrase.chinese}</strong>
                  <span className={isRevealed ? "revealed" : "hidden-english"}>
                    {isRevealed ? phrase.english : "点击查看英文"}
                  </span>
                </button>
                <button
                  className="vocab-mastery-button"
                  onClick={() => onMasteryChange(phrase.id, !isMastered)}
                  aria-label={`${isMastered ? "标记为未掌握" : "标记为已掌握"}：${phrase.chinese}`}
                  aria-pressed={isMastered}
                >
                  <MasteryIcon mastered={isMastered} />
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="vocab-card-mode" aria-label={`${category.categoryName}卡片复习`}>
          {currentPhrase ? (
            <>
              <div className="vocab-card-position">{cardIndex + 1} / {cardQueue.length}</div>
              <button
                className={`vocab-flashcard ${flipped ? "flipped" : ""}`}
                style={{ transform: `translateX(${dragX}px) rotate(${dragX / 22}deg)` }}
                onClick={() => {
                  if (didSwipe.current) {
                    didSwipe.current = false;
                    return;
                  }
                  setFlipped((current) => !current);
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                aria-label={`${flipped ? "英文" : "中文"}：${flipped ? currentPhrase.english : currentPhrase.chinese}，点击翻面`}
              >
                <span className={`swipe-cue mastered-cue ${dragX > 16 ? "visible" : ""}`}>✓ 已掌握</span>
                <span className={`swipe-cue learning-cue ${dragX < -16 ? "visible" : ""}`}>↺ 未掌握</span>
                <small>{flipped ? "ENGLISH" : "中文释义"}</small>
                <strong>{flipped ? currentPhrase.english : currentPhrase.chinese}</strong>
                <span className="flip-hint">轻触翻面</span>
              </button>
              <div className="vocab-card-actions">
                <button className="mark-learning" onClick={() => markCard(false)}>← 未掌握</button>
                <button className="mark-mastered" onClick={() => markCard(true)}>已掌握 →</button>
              </div>
              <p className="swipe-hint">左滑未掌握 · 右滑已掌握</p>
            </>
          ) : (
            <div className="vocab-round-complete">
              <VocabIcon />
              <h2>本轮浏览完成</h2>
              <p>当前已掌握 {mastered}/{category.phrases.length}</p>
              <button onClick={restartCards}>重新浏览</button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
