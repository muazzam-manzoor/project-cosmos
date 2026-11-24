"use client";

import { useEffect } from "react";
import { useCosmosStore } from "@/store/useCosmosStore";
import { buildFallbackTLECatalog } from "@/data/fallbackTLEs";
import { getFallbackLaunches, getFallbackNews } from "@/data/launchPads";
import {
  DscovrEpicData,
  LaunchEvent,
  NearEarthAsteroid,
  SatelliteTLE,
  SpaceNewsItem,
  SpaceWeatherData,
} from "@/types/cosmos";
import { CosmosViewport, ViewportSubModeDock } from "./CosmosViewport";
import { TopBar } from "./TopBar";
import { LeftNavigator } from "./LeftNavigator";
import { RightInspector } from "./RightInspector";
import { BottomTimeBar } from "./BottomTimeBar";
import { AICommander } from "./AICommander";
import { LaunchesNewsModal } from "./LaunchesNewsModal";
import { ISSLiveCamModal } from "./ISSLiveCamModal";
import { MemoryHudModal } from "./MemoryHudModal";
import { TeacherClassroomBar } from "./TeacherClassroomBar";

export function CosmosApp() {
  const setSatellites = useCosmosStore((s) => s.setSatellites);
  const setLaunches = useCosmosStore((s) => s.setLaunches);
  const setNews = useCosmosStore((s) => s.setNews);
  const setSpaceWeather = useCosmosStore((s) => s.setSpaceWeather);
  const setNeos = useCosmosStore((s) => s.setNeos);
  const setDscovrEpic = useCosmosStore((s) => s.setDscovrEpic);

  useEffect(() => {
    // 1. Seed instant real-orbit catalog so frame 1 is alive with zero loading screen
    setSatellites(buildFallbackTLECatalog(), "fallback");
    setLaunches(getFallbackLaunches());
    setNews(getFallbackNews());

    // 2. Non-blocking upgrade from live CelesTrak / Launch Library 2 / Spaceflight News / NOAA SWPC / NASA NeoWs / EPIC APIs
    let cancelled = false;

    async function hydrateLiveData() {
      const [satRes, launchRes, newsRes, swRes, neoRes, epicRes] = await Promise.allSettled([
        fetch("/api/satellites").then((r) => r.json()),
        fetch("/api/launches").then((r) => r.json()),
        fetch("/api/news").then((r) => r.json()),
        fetch("/api/space-weather").then((r) => r.json()),
        fetch("/api/neos").then((r) => r.json()),
        fetch("/api/epic").then((r) => r.json()),
      ]);

      if (cancelled) return;

      if (satRes.status === "fulfilled" && Array.isArray(satRes.value?.satellites)) {
        setSatellites(
          satRes.value.satellites as SatelliteTLE[],
          satRes.value.source === "live" ? "live" : "fallback"
        );
      }
      if (launchRes.status === "fulfilled" && Array.isArray(launchRes.value?.launches)) {
        setLaunches(launchRes.value.launches as LaunchEvent[]);
      }
      if (newsRes.status === "fulfilled" && Array.isArray(newsRes.value?.news)) {
        setNews(newsRes.value.news as SpaceNewsItem[]);
      }
      if (swRes.status === "fulfilled" && swRes.value?.spaceWeather) {
        setSpaceWeather(swRes.value.spaceWeather as SpaceWeatherData);
      }
      if (neoRes.status === "fulfilled" && Array.isArray(neoRes.value?.neos)) {
        setNeos(
          neoRes.value.neos as NearEarthAsteroid[],
          neoRes.value.source === "live" ? "live" : "fallback"
        );
      }
      if (epicRes.status === "fulfilled" && epicRes.value?.imageUrl) {
        setDscovrEpic(epicRes.value as DscovrEpicData);
      }
    }

    void hydrateLiveData();
    const handleOnline = () => {
      void hydrateLiveData();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
    };
  }, [setSatellites, setLaunches, setNews, setSpaceWeather, setNeos, setDscovrEpic]);

  // Keyboard shortcuts (ignore when typing in inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const store = useCosmosStore.getState();
      if (e.key === "Escape") {
        if (store.activePanel !== "none") {
          store.setActivePanel("none");
        } else if (store.aiDrawerOpen) {
          store.setAiDrawerOpen(false);
        } else if (store.viewMode !== "orbit" || store.selectedTargetId !== "earth") {
          store.exitFocus();
        }
      } else if (e.key.toLowerCase() === "c") {
        store.toggleHudMode();
      } else if (e.key === " ") {
        e.preventDefault();
        store.setIsPaused(!store.isPaused);
      } else if (e.key.toLowerCase() === "l") {
        store.snapToLive();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#020611] text-slate-100 select-none">
      {/* Full-bleed WebGL 3D/4D Viewport */}
      <CosmosViewport />

      {/* Zero-Overlap Responsive Flex HUD Shell */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between gap-2 p-2.5 sm:p-3">
        <TopBar />

        <div className="relative flex min-h-0 flex-1 items-stretch justify-between gap-2">
          <LeftNavigator />

          <div className="pointer-events-none relative flex min-w-0 flex-1 flex-col items-center justify-between gap-2 py-0.5">
            <TeacherClassroomBar />
            <div className="mt-auto">
              <ViewportSubModeDock />
            </div>
          </div>

          <RightInspector />
          <AICommander />
        </div>

        <BottomTimeBar />
      </div>

      {/* Centered Modals */}
      <LaunchesNewsModal />
      <ISSLiveCamModal />
      <MemoryHudModal />
    </main>
  );
}
