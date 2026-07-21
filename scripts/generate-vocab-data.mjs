import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = process.argv.slice(2).find((argument) => argument !== "--");

if (!sourcePath) {
  throw new Error("Usage: node scripts/generate-vocab-data.mjs <source-markdown-path>");
}

const categoryIds = [
  "tech",
  "government",
  "urbanisation",
  "society-values",
  "lifestyle",
  "work",
  "environment",
  "media",
  "globalisation",
  "education",
];

const markdown = await readFile(resolve(sourcePath), "utf8");
const categories = [];
let currentCategory = null;
let currentSubtopic = "";

for (const line of markdown.split(/\r?\n/)) {
  const categoryMatch = line.match(/^##\s+\d+\.\s+(.+)$/);
  if (categoryMatch) {
    const categoryId = categoryIds[categories.length];
    if (!categoryId) throw new Error(`Unexpected extra category: ${categoryMatch[1]}`);
    currentCategory = {
      categoryId,
      categoryName: categoryMatch[1].trim(),
      phrases: [],
    };
    categories.push(currentCategory);
    currentSubtopic = "";
    continue;
  }

  const subtopicMatch = line.match(/^###\s+\d+\.\s+(.+)$/);
  if (subtopicMatch && currentCategory) {
    currentSubtopic = subtopicMatch[1].replaceAll("==", "").trim();
    continue;
  }

  const phraseMatch = line.match(/^-\s+(.+)$/);
  if (!phraseMatch || !currentCategory || !currentSubtopic) continue;

  const rawPhrase = phraseMatch[1].trim();
  const isPriority = rawPhrase.includes("==");
  const cleanPhrase = rawPhrase.replaceAll("==", "").trim();
  const boundary = cleanPhrase.search(/\s+(?=[…—]*[\u3400-\u9fff])/u);
  if (boundary < 0) throw new Error(`Cannot split English and Chinese: ${rawPhrase}`);

  const english = cleanPhrase.slice(0, boundary).trim();
  const chinese = cleanPhrase.slice(boundary).trim();
  const phraseNumber = String(currentCategory.phrases.length + 1).padStart(3, "0");
  currentCategory.phrases.push({
    id: `${currentCategory.categoryId}-${phraseNumber}`,
    subtopic: currentSubtopic,
    english,
    chinese,
    isPriority,
    mastered: false,
  });
}

if (categories.length !== categoryIds.length) {
  throw new Error(`Expected ${categoryIds.length} categories, found ${categories.length}`);
}

const phraseCount = categories.reduce((sum, category) => sum + category.phrases.length, 0);
const priorityCount = categories.reduce(
  (sum, category) => sum + category.phrases.filter((phrase) => phrase.isPriority).length,
  0,
);
const output = `// Generated from the Obsidian vocabulary summary. Do not edit by hand.\n\n` +
`export type VocabPhrase = {\n` +
`  id: string;\n` +
`  subtopic: string;\n` +
`  english: string;\n` +
`  chinese: string;\n` +
`  isPriority: boolean;\n` +
`  mastered: boolean;\n` +
`};\n\n` +
`export type VocabCategory = {\n` +
`  categoryId: string;\n` +
`  categoryName: string;\n` +
`  phrases: VocabPhrase[];\n` +
`};\n\n` +
`export const vocabCategories: VocabCategory[] = ${JSON.stringify(categories, null, 2)};\n`;

await writeFile(new URL("../app/vocab-data.ts", import.meta.url), output, "utf8");
console.log(`Generated ${categories.length} categories, ${phraseCount} phrases, ${priorityCount} priority phrases.`);
