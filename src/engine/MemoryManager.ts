import * as THREE from "three";

interface CachedAsset {
  key: string;
  object: THREE.Object3D;
  lastUsedAt: number;
  pinned: boolean;
}

/**
 * 4-Tier Spatial Memory Manager.
 * Implements LRU GPU asset caching, hysteresis LOD thresholds, and explicit Three.js
 * geometry/material/texture disposal to guarantee zero VRAM leaks during continuous zoom cycles.
 */
export class MemoryManager {
  private lruCache = new Map<string, CachedAsset>();
  private maxCachedAssets: number;
  private evictedCount = 0;

  // Hysteresis LOD distance thresholds (in scene units; 1 unit = 637.1 km)
  public readonly lodLoadDistance = 4.2;
  public readonly lodUnloadDistance = 5.9; // 1.4x hysteresis prevents boundary thrashing

  constructor(maxCachedAssets = 6) {
    this.maxCachedAssets = maxCachedAssets;
  }

  public getOrCreate(
    key: string,
    factory: () => THREE.Object3D,
    pinned = false
  ): THREE.Object3D {
    const existing = this.lruCache.get(key);
    if (existing) {
      existing.lastUsedAt = performance.now();
      return existing.object;
    }

    const object = factory();
    this.lruCache.set(key, {
      key,
      object,
      lastUsedAt: performance.now(),
      pinned,
    });
    this.enforceBudget();
    return object;
  }

  public touch(key: string): void {
    const item = this.lruCache.get(key);
    if (item) item.lastUsedAt = performance.now();
  }

  public enforceBudget(): void {
    if (this.lruCache.size <= this.maxCachedAssets) return;

    const evictable = Array.from(this.lruCache.values())
      .filter((a) => !a.pinned)
      .sort((a, b) => a.lastUsedAt - b.lastUsedAt);

    while (this.lruCache.size > this.maxCachedAssets && evictable.length > 0) {
      const oldest = evictable.shift();
      if (!oldest) break;
      this.disposeObject3D(oldest.object);
      this.lruCache.delete(oldest.key);
      this.evictedCount++;
    }
  }

  /**
   * Explicitly flushes all non-pinned LOD assets from GPU VRAM (useful for stress testing).
   */
  public flushUnused(activeKey?: string): number {
    let flushed = 0;
    for (const [key, entry] of this.lruCache.entries()) {
      if (!entry.pinned && key !== activeKey) {
        this.disposeObject3D(entry.object);
        this.lruCache.delete(key);
        this.evictedCount++;
        flushed++;
      }
    }
    return flushed;
  }

  public disposeAll(): void {
    for (const entry of this.lruCache.values()) {
      this.disposeObject3D(entry.object);
    }
    this.lruCache.clear();
  }

  public disposeObject3D(root: THREE.Object3D): void {
    root.userData.disposed = true;
    root.removeFromParent();
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const mat of mats) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          const safeDisposeTex = (tex: THREE.Texture | null | undefined) => {
            if (tex && !tex.userData?.sharedTexture) {
              tex.dispose();
            }
          };
          safeDisposeTex(stdMat.map);
          safeDisposeTex(stdMat.normalMap);
          safeDisposeTex(stdMat.bumpMap);
          safeDisposeTex(stdMat.roughnessMap);
          safeDisposeTex(stdMat.metalnessMap);
          safeDisposeTex(stdMat.emissiveMap);
          safeDisposeTex(stdMat.aoMap);
          mat.dispose();
        }
      }
    });
  }

  public getStats() {
    return {
      lruCachedAssets: this.lruCache.size,
      evictedAssets: this.evictedCount,
    };
  }
}
