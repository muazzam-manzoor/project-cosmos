import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let cachedLoader: GLTFLoader | null = null;

/**
 * Shared GLTFLoader with local Three.js Draco WASM/JS decoder (/draco/) attached so ALL
 * official NASA 3D Resources .glb files (JWST, DSCOVR, LRO, Apollo LM, GOES, TDRS, etc.)
 * decode at full CAD resolution offline & online with zero external CDN dependencies!
 */
export function getSharedGltfLoader(): GLTFLoader {
  if (cachedLoader) return cachedLoader;
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader.setDRACOLoader(draco);
  cachedLoader = loader;
  return loader;
}
