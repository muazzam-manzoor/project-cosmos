import * as THREE from "three";

export const EARTH_RADIUS_KM = 6371.0;
export const EARTH_RADIUS_UNITS = 10.0;
export const MOON_RADIUS_KM = 1737.4;
export const MOON_RADIUS_UNITS = (MOON_RADIUS_KM / EARTH_RADIUS_KM) * EARTH_RADIUS_UNITS; // ~2.727 units (true 1:1 scale!)
export const MOON_MEAN_DISTANCE_KM = 384400;
export const L1_L2_DISTANCE_KM = 1500000;
export const KM_TO_UNITS = EARTH_RADIUS_UNITS / EARTH_RADIUS_KM;
export const UNITS_TO_KM = EARTH_RADIUS_KM / EARTH_RADIUS_UNITS;
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

/**
 * Converts Geodetic (latDeg, lonDeg, altitudeKm) into Three.js SphereGeometry-aligned
 * Earth-Centered Earth-Fixed (ECEF) Y-Up coordinates.
 * Matches standard equirectangular Earth maps (u=0 at -180 lon, u=0.5 at 0 lon).
 */
export function latLonAltToVec3(
  latDeg: number,
  lonDeg: number,
  altKm: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  const r = (EARTH_RADIUS_KM + altKm) * KM_TO_UNITS;
  const phi = (90 - latDeg) * DEG2RAD;
  const theta = (lonDeg + 180) * DEG2RAD;

  const sinPhi = Math.sin(phi);
  const x = -r * sinPhi * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * sinPhi * Math.sin(theta);

  return out.set(x, y, z);
}

/**
 * Computes the unit vector pointing from Earth center toward the Sun
 * in Earth-Fixed (ECEF) Three.js coordinates for any UTC timestamp.
 */
export function getSunDirectionECEF(timestampMs: number): THREE.Vector3 {
  const date = new Date(timestampMs);
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = (timestampMs - startOfYear) / 86400000;

  // Approximate solar declination in degrees
  const declinationDeg =
    -23.44 * Math.cos(((360 / 365.24) * (dayOfYear + 10)) * DEG2RAD);

  // Subsolar longitude in degrees (-180..+180)
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  let subSolarLon = (12 - utcHours) * 15;
  if (subSolarLon > 180) subSolarLon -= 360;
  if (subSolarLon < -180) subSolarLon += 360;

  return latLonAltToVec3(declinationDeg, subSolarLon, 0).normalize();
}

/**
 * Computes the Moon's astronomical 3D position in Earth-Fixed (ECEF) Three.js scene units
 * at TRUE 1:1 PHYSICAL SCALE (~603.4 units = ~384,400 km) using Meeus lunar ephemeris,
 * along with live distance (km), orbital speed (km/s), and lunar phase illumination.
 */
export function getMoonStateECEF(timestampMs: number): {
  position: THREE.Vector3;
  distanceKm: number;
  phaseFraction: number;
  phaseName: string;
  orbitalSpeedKmS: number;
  lightDelaySec: number;
} {
  // Days since J2000.0 (2000-01-01 12:00:00 UTC)
  const d = (timestampMs - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;

  // Meeus simplified lunar orbital elements (degrees)
  const L0 = (218.316 + 13.176396 * d) * DEG2RAD; // Mean longitude
  const M = (134.963 + 13.064993 * d) * DEG2RAD;  // Mean anomaly
  const F = (93.272 + 13.229350 * d) * DEG2RAD;   // Argument of latitude
  const D = (297.850 + 12.190749 * d) * DEG2RAD;  // Mean elongation from Sun

  // Ecliptic longitude, latitude & true Earth-Moon distance (perigee ~363k -> apogee ~405k km)
  const eclLon = L0 + (6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D)) * DEG2RAD;
  const eclLat = (5.128 * Math.sin(F)) * DEG2RAD;
  const distanceKm =
    385001 - 20905 * Math.cos(M) - 3699 * Math.cos(2 * D - M) - 2956 * Math.cos(2 * D);

  // Convert ecliptic -> equatorial (obliquity 23.439°)
  const eps = 23.439 * DEG2RAD;
  const cosLat = Math.cos(eclLat);
  const xe = cosLat * Math.cos(eclLon);
  const ye = cosLat * Math.sin(eclLon);
  const ze = Math.sin(eclLat);

  const xEq = xe;
  const yEq = ye * Math.cos(eps) - ze * Math.sin(eps);
  const zEq = ye * Math.sin(eps) + ze * Math.cos(eps);

  const raRad = Math.atan2(yEq, xEq);
  const decDeg = Math.asin(THREE.MathUtils.clamp(zEq, -1, 1)) * RAD2DEG;

  // Greenwich Mean Sidereal Time (GMST) to convert Equatorial (ECI) -> Earth-Fixed (ECEF)
  const gmstRad = ((280.46061837 + 360.98564736629 * d) % 360) * DEG2RAD;
  let lonDeg = (raRad - gmstRad) * RAD2DEG;
  lonDeg = ((((lonDeg + 180) % 360) + 360) % 360) - 180;

  const position = latLonAltToVec3(decDeg, lonDeg, distanceKm - EARTH_RADIUS_KM);

  // Lunar Phase from live Sun-Earth-Moon elongation angle
  const sunDir = getSunDirectionECEF(timestampMs);
  const moonDir = position.clone().normalize();
  const cosElong = THREE.MathUtils.clamp(sunDir.dot(moonDir), -1, 1);
  const phaseFraction = (1 - cosElong) * 0.5; // 0 = New Moon, 1 = Full Moon

  const elongationNorm = (((D * RAD2DEG) % 360) + 360) % 360;
  let phaseName = "Waxing Gibbous";
  if (elongationNorm < 22.5 || elongationNorm >= 337.5) phaseName = "New Moon";
  else if (elongationNorm < 67.5) phaseName = "Waxing Crescent";
  else if (elongationNorm < 112.5) phaseName = "First Quarter";
  else if (elongationNorm < 157.5) phaseName = "Waxing Gibbous";
  else if (elongationNorm < 202.5) phaseName = "Full Moon";
  else if (elongationNorm < 247.5) phaseName = "Waning Gibbous";
  else if (elongationNorm < 292.5) phaseName = "Last Quarter";
  else phaseName = "Waning Crescent";

  // Vis-Viva instantaneous lunar orbital speed around Earth (~0.97 -> 1.08 km/s)
  const orbitalSpeedKmS = Number(
    Math.sqrt(398600.4418 * (2 / distanceKm - 1 / MOON_MEAN_DISTANCE_KM)).toFixed(3)
  );
  const lightDelaySec = Number((distanceKm / 299792.458).toFixed(2));

  return {
    position,
    distanceKm: Math.round(distanceKm),
    phaseFraction: Number(phaseFraction.toFixed(3)),
    phaseName,
    orbitalSpeedKmS,
    lightDelaySec,
  };
}

/**
 * Computes Azimuth (deg from North clockwise) and Elevation (deg above local horizon)
 * of a satellite from an Earth observer's lat/lon.
 */
export function computeObserverLookAngles(
  obsLatDeg: number,
  obsLonDeg: number,
  satLatDeg: number,
  satLonDeg: number,
  satAltKm: number
): { azimuthDeg: number; elevationDeg: number; slantRangeKm: number } {
  const obsVec = latLonAltToVec3(obsLatDeg, obsLonDeg, 0).multiplyScalar(UNITS_TO_KM);
  const satVec = latLonAltToVec3(satLatDeg, satLonDeg, satAltKm).multiplyScalar(UNITS_TO_KM);

  const delta = satVec.clone().sub(obsVec);
  const slantRangeKm = delta.length();

  // Local ENU basis vectors at observer
  const up = obsVec.clone().normalize();
  const northPole = new THREE.Vector3(0, 1, 0);
  const east = new THREE.Vector3().crossVectors(northPole, up);
  if (east.lengthSq() < 1e-6) {
    east.set(1, 0, 0);
  } else {
    east.normalize();
  }
  const north = new THREE.Vector3().crossVectors(up, east).normalize();

  const dUp = delta.dot(up);
  const dEast = delta.dot(east);
  const dNorth = delta.dot(north);

  const horiz = Math.sqrt(dEast * dEast + dNorth * dNorth);
  const elevationDeg = Math.atan2(dUp, horiz) * RAD2DEG;
  let azimuthDeg = Math.atan2(dEast, dNorth) * RAD2DEG;
  if (azimuthDeg < 0) azimuthDeg += 360;

  return { azimuthDeg, elevationDeg, slantRangeKm };
}

/**
 * Formats seconds into human-readable T-minus countdown string.
 */
export function formatCountdown(targetIso: string, nowMs = Date.now()): string {
  const diffSec = Math.floor((new Date(targetIso).getTime() - nowMs) / 1000);
  const sign = diffSec < 0 ? "T+" : "T-";
  const abs = Math.abs(diffSec);
  const d = Math.floor(abs / 86400);
  const h = Math.floor((abs % 86400) / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0
    ? `${sign}${d}d ${pad(h)}:${pad(m)}:${pad(s)}`
    : `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
}
