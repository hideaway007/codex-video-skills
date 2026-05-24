#!/usr/bin/env python3
"""Lightweight style-shape evaluator for "假如你成为 X" drafts.

This does not prove content quality. It checks measurable shape against the
36-reference corpus metrics and gives revision hints.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


CONNECTIVES = ["说实话", "很显然", "事实上", "然而", "于是", "最终", "很遗憾", "直到"]
REVERSALS = ["你以为", "然而", "但问题是", "很遗憾", "事实上", "你不知道"]
STRUCTURE_HINTS = [
    "本期",
    "你出生",
    "你以为",
    "第一次",
    "然而",
    "最终",
    "这就是",
    "一生",
]
TWELVE_BEATS = {
    "观众幻想入口": ["很多人", "以为", "幻想", "看起来", "听起来", "第一反应"],
    "幻想升级": ["但问题", "说实话", "事实上", "离谱", "奇幻", "副作用", "反噬"],
    "投放": ["本期", "把你", "如果你成为", "带你"],
    "低处落点": ["你出生", "你第一次", "你醒", "入职", "新兵", "底层", "普通"],
    "日常压入世界观": ["吃", "住", "睡", "工位", "登记", "口粮", "家里", "规则"],
    "身份红利": ["第一次", "认可", "赢", "成功", "有用", "天赋", "奖励"],
    "规则变味": ["副作用", "反噬", "坏消息", "从这一刻", "更危险", "被继续", "升级"],
    "世界规则": ["世界", "神明", "魔法", "规则", "荒诞", "离谱", "有效"],
    "大事件爆发": ["战争", "灾难", "清洗", "神降", "猎杀", "审判", "大事件"],
    "身份变形": ["你开始理解", "你开始", "不像自己", "变强", "身份", "怪物", "理由"],
    "后日谈": ["很多年后", "档案", "宣传", "晚年", "记录", "后日谈"],
    "反讽闭环": ["这就是", "一生", "传说", "爽不爽", "最后", "回扣"],
}


def load_body(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    for heading in ("## 口播稿", "## 返修后 1000 字开头样稿", "## 1000 字开头样稿"):
        if heading in text:
            text = text.split(heading, 1)[1]
            if "\n## " in text:
                text = text.split("\n## ", 1)[0]
            return text.strip()
    return text.strip()


def count_non_ws(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def sentence_lengths(text: str) -> list[int]:
    parts = re.findall(r"[^。！？!?\n]+[。！？!?]?", text)
    lengths = [count_non_ws(part) for part in parts if part.strip()]
    return lengths or [0]


def compact(text: str) -> str:
    return re.sub(r"\s+", "", text)


def first_500_has_you(text: str) -> bool:
    return "你" in compact(text)[:500]


def longest_span_without_you(text: str) -> int:
    parts = compact(text).split("你")
    return max((len(part) for part in parts), default=0)


def twelve_beat_hits(text: str) -> dict[str, bool]:
    return {beat: any(word in text for word in words) for beat, words in TWELVE_BEATS.items()}


def revision_hints(
    chars: int,
    you_per_1k: float,
    avg_sentence: float,
    connective_per_1k: float,
    reversal_per_1k: float,
    beat_hits: dict[str, bool],
    has_you_early: bool,
    no_you_span: int,
) -> list[str]:
    hints: list[str] = []
    if chars < 7000:
        hints.append("Expand toward 7000-11000 chars, or treat this as an opening-only calibration sample.")
    elif chars > 11000:
        hints.append("Consider tightening to the 7000-11000 char range unless the topic needs long-form sprawl.")
    if not has_you_early:
        hints.append("Move the protagonist into a concrete 'you' situation within the first 500 non-space chars.")
    if you_per_1k < 25:
        hints.append("Increase second-person pressure: make 'you' act, judge, or pay a cost every 150-250 chars.")
    if no_you_span > 300:
        hints.append(f"Rewrite long exposition blocks: detected {no_you_span} consecutive non-space chars without '你'.")
    if avg_sentence < 70:
        hints.append("Sentences are too clipped for this reference shape; combine some cause-effect chains into oral-flow paragraphs.")
    elif avg_sentence > 140:
        hints.append("Sentences are very long; keep oral sprawl but add clearer punctuation before readability breaks.")
    if connective_per_1k < 1.5:
        hints.append("Add functional turns such as '说实话/很显然/事实上/然而/最终' where the story changes pressure.")
    if reversal_per_1k < 0.6:
        hints.append("Add more fantasy reversals: each win should create a new ability, side effect, rule twist, or temptation.")
    missing = [beat for beat, hit in beat_hits.items() if not hit]
    if missing:
        hints.append("Weak 12-beat signals: " + "、".join(missing[:6]) + (" 等" if len(missing) > 6 else ""))
    if not hints:
        hints.append("Machine-shape issues are minor. Use the manual rubric and anti-clone checklist next.")
    return hints


def band_score(value: float, low: float, high: float, soft_low: float, soft_high: float, points: int) -> float:
    if low <= value <= high:
        return float(points)
    if soft_low <= value < low:
        return points * (value - soft_low) / (low - soft_low)
    if high < value <= soft_high:
        return points * (soft_high - value) / (soft_high - high)
    return 0.0


def opening_calibration_score(
    you_per_1k: float,
    avg_sentence: float,
    connective_per_1k: float,
    reversal_per_1k: float,
    structure_hits: int,
    beat_hit_count: int,
    has_you_early: bool,
    no_you_span: int,
) -> float:
    """Opening-only score that ignores full-draft length.

    Use this for 1000-2000 char calibration samples. The full score remains the
    gate for complete 7000-11000 char scripts.
    """
    score = 0.0
    score += band_score(you_per_1k, 25, 45, 12, 65, 22)
    score += band_score(avg_sentence, 30, 120, 18, 170, 14)
    score += band_score(connective_per_1k, 1.0, 6.0, 0.3, 8.0, 14)
    score += band_score(reversal_per_1k, 0.8, 6.0, 0.1, 8.0, 16)
    score += min(structure_hits / len(STRUCTURE_HINTS), 1.0) * 10
    score += min(beat_hit_count / len(TWELVE_BEATS), 1.0) * 14
    score += 5 if has_you_early else 0
    score += 5 if no_you_span <= 300 else max(0.0, 5 * (500 - no_you_span) / 200)
    return score


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/evaluate_style.py path/to/draft.md", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    text = load_body(path)
    chars = count_non_ws(text)
    if chars == 0:
        print("Empty draft")
        return 1

    you_count = text.count("你")
    you_per_1k = you_count / chars * 1000
    avg_sentence = sum(sentence_lengths(text)) / len(sentence_lengths(text))
    connective_count = sum(text.count(word) for word in CONNECTIVES)
    connective_per_1k = connective_count / chars * 1000
    reversal_count = sum(text.count(word) for word in REVERSALS)
    reversal_per_1k = reversal_count / chars * 1000
    structure_hits = sum(1 for word in STRUCTURE_HINTS if word in text)
    beat_hits = twelve_beat_hits(text)
    beat_hit_count = sum(beat_hits.values())
    has_you_early = first_500_has_you(text)
    no_you_span = longest_span_without_you(text)

    score = 0.0
    score += band_score(chars, 7000, 11000, 4000, 14000, 20)
    score += band_score(you_per_1k, 25, 45, 12, 65, 20)
    score += band_score(avg_sentence, 70, 140, 35, 190, 15)
    score += band_score(connective_per_1k, 1.5, 5.0, 0.3, 8.0, 15)
    score += band_score(reversal_per_1k, 0.6, 2.5, 0.1, 4.5, 15)
    score += min(structure_hits / len(STRUCTURE_HINTS), 1.0) * 8
    score += min(beat_hit_count / len(TWELVE_BEATS), 1.0) * 5
    score += 2 if has_you_early else 0

    print("STYLE SHAPE REPORT")
    print("------------------")
    print(f"File:                 {path}")
    print(f"Non-whitespace chars: {chars}")
    print(f"You density:          {you_per_1k:.2f} / 1k ({you_count})")
    print(f"Avg sentence length:  {avg_sentence:.2f}")
    print(f"Connective density:   {connective_per_1k:.2f} / 1k ({connective_count})")
    print(f"Reversal density:     {reversal_per_1k:.2f} / 1k ({reversal_count})")
    print(f"Structure hints:      {structure_hits}/{len(STRUCTURE_HINTS)}")
    print(f"12-beat hints:        {beat_hit_count}/{len(TWELVE_BEATS)}")
    print(f"You in first 500:     {'yes' if has_you_early else 'no'}")
    print(f"Longest no-you span:  {no_you_span} chars")
    print(f"Machine shape score:  {score:.1f}/100")
    if chars < 3000:
        opening_score = opening_calibration_score(
            you_per_1k,
            avg_sentence,
            connective_per_1k,
            reversal_per_1k,
            structure_hits,
            beat_hit_count,
            has_you_early,
            no_you_span,
        )
        print(f"Opening calibration:  {opening_score:.1f}/100")
    print()
    print("Interpretation:")
    if score >= 85:
        print("- Shape is close to the reference range. Use manual 100-point rubric next.")
    elif score >= 70:
        print("- Shape is usable but needs revision before claiming high similarity.")
    else:
        print("- Shape is far from the reference range. Rework with deep-generator-prompt.md.")

    print()
    print("12-beat detail:")
    for beat, hit in beat_hits.items():
        print(f"- [{'x' if hit else ' '}] {beat}")

    print()
    print("Revision hints:")
    for hint in revision_hints(
        chars,
        you_per_1k,
        avg_sentence,
        connective_per_1k,
        reversal_per_1k,
        beat_hits,
        has_you_early,
        no_you_span,
    ):
        print(f"- {hint}")

    print()
    print("Important: this score cannot verify semantic quality, system pressure, or originality boundaries.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
