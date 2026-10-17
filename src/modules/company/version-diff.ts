/** Version diff: line-level + field-level. */

import { createHash } from "node:crypto";

function diffLines(a: string, b: string) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const lcs: number[][] = Array.from({ length: aLines.length + 1 }, () => new Array(bLines.length + 1).fill(0));
  for (let i = aLines.length - 1; i >= 0; i--) {
    for (let j = bLines.length - 1; j >= 0; j--) {
      lcs[i][j] = aLines[i] === bLines[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0, j = 0;
  while (i < aLines.length && j < bLines.length) {
    if (aLines[i] === bLines[j]) {
      out.push("  " + aLines[i]);
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push("- " + aLines[i++]);
    } else {
      out.push("+ " + bLines[j++]);
    }
  }
  while (i < aLines.length) out.push("- " + aLines[i++]);
  while (j < bLines.length) out.push("+ " + bLines[j++]);
  return out;
}

const KEY_FIELDS = ["unlockSchedule", "tokenRights", "revenue", "vesting", "supply", "circulating", "team"];

export function diffVersions(oldV: { version: string; content: string; contentHash: string; changes: Record<string, any> }, newV: { version: string; content: string; contentHash: string; changes: Record<string, any> }) {
  const diff = diffLines(oldV.content, newV.content);
  let added = 0, removed = 0;
  for (const ln of diff) {
    if (ln.startsWith("+ ")) added++;
    else if (ln.startsWith("- ")) removed++;
  }
  const oldChanges = oldV.changes ?? {};
  const newChanges = newV.changes ?? {};
  const allFields = new Set([...Object.keys(oldChanges), ...Object.keys(newChanges)]);
  const fieldChanges: { field: string; old: any; new: any }[] = [];
  for (const f of allFields) {
    if (oldChanges[f] !== newChanges[f]) {
      fieldChanges.push({ field: f, old: oldChanges[f], new: newChanges[f] });
    }
  }
  if (fieldChanges.length === 0) {
    for (const f of KEY_FIELDS) {
      if (oldChanges[f] !== newChanges[f] && (oldChanges[f] !== undefined || newChanges[f] !== undefined)) {
        fieldChanges.push({ field: f, old: oldChanges[f], new: newChanges[f] });
      }
    }
  }
  return {
    unifiedDiff: diff.slice(0, 200).join("\n"),
    addedLines: added,
    removedLines: removed,
    fieldChanges,
    oldVersion: oldV.version,
    newVersion: newV.version,
    oldHash: oldV.contentHash,
    newHash: newV.contentHash,
  };
}
