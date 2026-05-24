import { useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackMode } from "./useAudioPlayer";

interface TimelineCue {
  globalIndex: number;
  chapter: string;
  step: number;
  audio: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

interface TimelineData {
  version: number;
  audio: string;
  totalMs: number;
  cues: TimelineCue[];
}

type TimelineStatus = "loading" | "ready" | "unavailable";

interface Options {
  mode: PlaybackMode;
  autoStarted: boolean;
  currentGlobalIndex: number;
  onCue: (globalIndex: number) => void;
  timelineSrc?: string;
}

function cueForIndex(timeline: TimelineData, globalIndex: number): TimelineCue | null {
  return timeline.cues.find((cue) => cue.globalIndex === globalIndex) ?? null;
}

function cueForTime(timeline: TimelineData, ms: number): TimelineCue | null {
  return (
    timeline.cues.find((cue) => ms >= cue.startMs && ms < cue.endMs) ??
    timeline.cues.at(-1) ??
    null
  );
}

export function useMasterAudioTimeline({
  mode,
  autoStarted,
  currentGlobalIndex,
  onCue,
  timelineSrc = `${import.meta.env.BASE_URL}audio/timeline.json`,
}: Options): { status: TimelineStatus } {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [status, setStatus] = useState<TimelineStatus>("loading");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onCueRef = useRef(onCue);
  const lastCueRef = useRef<number | null>(null);

  useEffect(() => {
    onCueRef.current = onCue;
  }, [onCue]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(timelineSrc, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`timeline unavailable: ${response.status}`);
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) return null;
        return response.json();
      })
      .then((data: TimelineData | null) => {
        if (data === null) {
          setTimeline(null);
          setStatus("unavailable");
          return;
        }
        if (!Array.isArray(data.cues) || data.cues.length === 0) {
          throw new Error("timeline has no cues");
        }
        setTimeline(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.warn("master audio timeline unavailable:", error);
        setTimeline(null);
        setStatus("unavailable");
      });

    return () => controller.abort();
  }, [timelineSrc]);

  const audioSrc = useMemo(() => {
    if (!timeline) return null;
    return new URL(timeline.audio || "master.mp3", new URL(timelineSrc, window.location.href));
  }, [timeline, timelineSrc]);

  useEffect(() => {
    if (status !== "ready" || !audioSrc) return;
    const audio = new Audio(audioSrc.toString());
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
      lastCueRef.current = null;
    };
  }, [audioSrc, status]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timeline || status !== "ready") return;

    if (mode !== "auto" || !autoStarted) {
      audio.pause();
      return;
    }

    const cue = cueForIndex(timeline, currentGlobalIndex);
    if (cue) {
      const ms = audio.currentTime * 1000;
      if (ms < cue.startMs - 250 || ms >= cue.endMs + 250) {
        audio.currentTime = cue.startMs / 1000;
      }
    }

    audio.play().catch((error) => {
      console.warn("master audio play failed:", error);
    });
  }, [autoStarted, currentGlobalIndex, mode, status, timeline]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timeline || status !== "ready" || mode !== "auto" || !autoStarted) {
      return;
    }

    const syncCue = () => {
      const cue = cueForTime(timeline, audio.currentTime * 1000);
      if (!cue || cue.globalIndex === lastCueRef.current) return;
      lastCueRef.current = cue.globalIndex;
      if (cue.globalIndex !== currentGlobalIndex) onCueRef.current(cue.globalIndex);
    };

    syncCue();
    const timer = window.setInterval(syncCue, 50);
    audio.addEventListener("timeupdate", syncCue);
    audio.addEventListener("seeked", syncCue);
    return () => {
      window.clearInterval(timer);
      audio.removeEventListener("timeupdate", syncCue);
      audio.removeEventListener("seeked", syncCue);
    };
  }, [autoStarted, currentGlobalIndex, mode, status, timeline]);

  return { status };
}
