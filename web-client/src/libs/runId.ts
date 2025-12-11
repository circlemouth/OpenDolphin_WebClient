// runId を生成するユーティリティ。ISO 形式をベースに区切り文字を除去し末尾に `Z` を付与する。
export function generateRunId(date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return iso.replace(/[-:]/g, '') + 'Z';
}
