"use client";

import { memo, useEffect, useRef } from "react";

import { ART_VIDEO, ART_POSTER } from "@/config/artwork";

const BLEND_MS = 650;
const LOOP_LEAD_SECONDS = 1;

// Keep both decoders in the root layout. Only the short overlap plays both;
// the covered player seeks back while invisible, away from the visible loop.
export const BackgroundVideo = memo(function BackgroundVideo() {
  const root = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLVideoElement>(null);
  const second = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const background = root.current;
    const a = first.current;
    const b = second.current;
    if (!background || !a || !b) return;
    const players = [a, b];
    let active = 0;
    let blending = false;
    let disposed = false;
    let frame = 0;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    let loops = 0;
    const pending = new Set<HTMLVideoElement>();
    const instance = background.dataset.playerInstance || crypto.randomUUID();
    background.dataset.playerInstance = instance;
    background.dataset.loopCount = "0";
    players.forEach((video, index) => {
      video.dataset.playerInstance = `${instance}-${index}`;
      video.dataset.active = String(index === active);
      video.muted = video.defaultMuted = true;
      video.loop = true; // Native fallback if the standby is not ready yet.
      video.style.opacity = index === active ? "1" : "0";
    });
    const play = async (video: HTMLVideoElement) => {
      if (pending.has(video)) return false;
      if (!video.paused) return true;
      pending.add(video);
      try { await video.play(); return !disposed; }
      catch { return false; }
      finally { pending.delete(video); }
    };
    const handover = async () => {
      const previous = players[active];
      const nextIndex = 1 - active;
      const next = players[nextIndex];
      if (blending || next.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return;
      blending = true;
      if (next.currentTime > 0.05) next.currentTime = 0;
      if (!await play(next) || document.hidden) {
        next.pause();
        blending = false;
        return;
      }
      if (disposed) return;
      // play() resolves after playback starts. Blend before the outgoing
      // decoder reaches its end instead of exposing its rewind frame.
      active = nextIndex;
      next.dataset.active = "true";
      previous.dataset.active = "false";
      next.style.zIndex = "2";
      previous.style.zIndex = "1";
      next.style.opacity = "1";
      background.dataset.loopCount = String(++loops);
      finishTimer = setTimeout(() => {
        previous.style.opacity = "0";
        previous.pause();
        previous.currentTime = 0;
        blending = false;
      }, BLEND_MS);
    };
    const tick = () => {
      const current = players[active];
      if (!document.hidden && !blending && !current.paused &&
          Number.isFinite(current.duration) && current.duration > 2 &&
          current.duration - current.currentTime <= LOOP_LEAD_SECONDS) {
        void handover();
      }
      if (!disposed) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (document.hidden) players.forEach(video => video.pause());
      else void play(players[active]);
    };
    const recover = () => { if (!document.hidden) void play(players[active]); };
    players.forEach(video => {
      video.addEventListener("loadeddata", recover);
      video.addEventListener("canplay", recover);
    });
    document.addEventListener("visibilitychange", resume);
    document.addEventListener("pointerdown", recover, { passive: true });
    document.addEventListener("keydown", recover);
    window.addEventListener("pageshow", resume);
    recover();
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(finishTimer);
      players.forEach(video => {
        video.pause();
        video.removeEventListener("loadeddata", recover);
        video.removeEventListener("canplay", recover);
      });
      document.removeEventListener("visibilitychange", resume);
      document.removeEventListener("pointerdown", recover);
      document.removeEventListener("keydown", recover);
      window.removeEventListener("pageshow", resume);
    };
  }, []);
  return <div ref={root} className="site-background" aria-hidden="true">
    {/* Kept behind the player at all times, including the first decoded frame. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="site-poster" src={ART_POSTER} alt="" fetchPriority="high" />
    <video ref={first} id="site-background-video" className="site-video" autoPlay muted loop playsInline preload="auto" poster={ART_POSTER} src={ART_VIDEO} style={{ opacity: 1 }} />
    <video ref={second} className="site-video" muted loop playsInline preload="auto" poster={ART_POSTER} src={ART_VIDEO} style={{ opacity: 0 }} />
  </div>;
});
