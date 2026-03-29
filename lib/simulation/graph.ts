import type { SimNode } from "./types";
import { distanceKm } from "./geo";

export const NODES: Record<string, SimNode> = {
  singapore_city: {
    id: "singapore_city",
    label: "Singapore",
    lng: 103.8198,
    lat: 1.3521,
  },
  changi_airport: {
    id: "changi_airport",
    label: "Singapore Changi (SIN)",
    lng: 103.9915,
    lat: 1.3644,
  },
  dubai_city: {
    id: "dubai_city",
    label: "Dubai",
    lng: 55.2708,
    lat: 25.2048,
  },
  dxb_airport: {
    id: "dxb_airport",
    label: "Dubai International (DXB)",
    lng: 55.3657,
    lat: 25.2532,
  },
  doh_airport: {
    id: "doh_airport",
    label: "Doha Hamad (DOH)",
    lng: 51.6085,
    lat: 25.2731,
  },
  ruh_airport: {
    id: "ruh_airport",
    label: "Riyadh King Khalid (RUH)",
    lng: 46.6985,
    lat: 24.9598,
  },
  tlv_airport: {
    id: "tlv_airport",
    label: "Tel Aviv Ben Gurion (TLV)",
    lng: 34.8867,
    lat: 32.0114,
  },
  bah_airport: {
    id: "bah_airport",
    label: "Bahrain International (BAH)",
    lng: 50.6336,
    lat: 26.2708,
  },
  paris_city: {
    id: "paris_city",
    label: "Paris",
    lng: 2.3522,
    lat: 48.8566,
  },
  london_city: {
    id: "london_city",
    label: "London",
    lng: -0.1278,
    lat: 51.5074,
  },
  lhr_airport: {
    id: "lhr_airport",
    label: "London Heathrow (LHR)",
    lng: -0.4543,
    lat: 51.47,
  },
  frankfurt_city: {
    id: "frankfurt_city",
    label: "Frankfurt",
    lng: 8.6821,
    lat: 50.1109,
  },
  fra_airport: {
    id: "fra_airport",
    label: "Frankfurt Airport (FRA)",
    lng: 8.5706,
    lat: 50.0379,
  },
  mad_airport: {
    id: "mad_airport",
    label: "Madrid Barajas (MAD)",
    lng: -3.5676,
    lat: 40.4839,
  },
  zrh_airport: {
    id: "zrh_airport",
    label: "Zurich (ZRH)",
    lng: 8.5492,
    lat: 47.4647,
  },
  tokyo_city: {
    id: "tokyo_city",
    label: "Tokyo",
    lng: 139.6917,
    lat: 35.6895,
  },
  nrt_airport: {
    id: "nrt_airport",
    label: "Tokyo Narita (NRT)",
    lng: 140.3864,
    lat: 35.772,
  },
  hkg_airport: {
    id: "hkg_airport",
    label: "Hong Kong (HKG)",
    lng: 113.9144,
    lat: 22.308,
  },
  icn_airport: {
    id: "icn_airport",
    label: "Seoul Incheon (ICN)",
    lng: 126.4505,
    lat: 37.4602,
  },
  bkk_airport: {
    id: "bkk_airport",
    label: "Bangkok Suvarnabhumi (BKK)",
    lng: 100.7473,
    lat: 13.69,
  },
  del_airport: {
    id: "del_airport",
    label: "Delhi Indira Gandhi (DEL)",
    lng: 77.1033,
    lat: 28.5562,
  },
  pvg_airport: {
    id: "pvg_airport",
    label: "Shanghai Pudong (PVG)",
    lng: 121.8052,
    lat: 31.1443,
  },
  kul_airport: {
    id: "kul_airport",
    label: "Kuala Lumpur (KUL)",
    lng: 101.7113,
    lat: 2.7456,
  },
  sydney_city: {
    id: "sydney_city",
    label: "Sydney",
    lng: 151.2093,
    lat: -33.8688,
  },
  syd_airport: {
    id: "syd_airport",
    label: "Sydney Kingsford Smith (SYD)",
    lng: 151.1772,
    lat: -33.9461,
  },
  mel_airport: {
    id: "mel_airport",
    label: "Melbourne (MEL)",
    lng: 144.8433,
    lat: -37.669,
  },
  los_angeles_city: {
    id: "los_angeles_city",
    label: "Los Angeles",
    lng: -118.2437,
    lat: 34.0522,
  },
  lax_airport: {
    id: "lax_airport",
    label: "Los Angeles Intl (LAX)",
    lng: -118.4081,
    lat: 33.9416,
  },
  new_york_city: {
    id: "new_york_city",
    label: "New York",
    lng: -73.9857,
    lat: 40.7484,
  },
  jfk_airport: {
    id: "jfk_airport",
    label: "New York JFK",
    lng: -73.7781,
    lat: 40.6413,
  },
  ord_airport: {
    id: "ord_airport",
    label: "Chicago O'Hare (ORD)",
    lng: -87.9048,
    lat: 41.9786,
  },
  atl_airport: {
    id: "atl_airport",
    label: "Atlanta Hartsfield-Jackson (ATL)",
    lng: -84.4281,
    lat: 33.6407,
  },
  yvr_airport: {
    id: "yvr_airport",
    label: "Vancouver (YVR)",
    lng: -123.1844,
    lat: 49.1947,
  },
  mex_airport: {
    id: "mex_airport",
    label: "Mexico City (MEX)",
    lng: -99.0729,
    lat: 19.4363,
  },
  sao_paulo_city: {
    id: "sao_paulo_city",
    label: "São Paulo",
    lng: -46.6333,
    lat: -23.5505,
  },
  gru_airport: {
    id: "gru_airport",
    label: "São Paulo GRU",
    lng: -46.4731,
    lat: -23.4356,
  },
  bog_airport: {
    id: "bog_airport",
    label: "Bogotá El Dorado (BOG)",
    lng: -74.1469,
    lat: 4.7016,
  },
  scl_airport: {
    id: "scl_airport",
    label: "Santiago (SCL)",
    lng: -70.7858,
    lat: -33.393,
  },
  eze_airport: {
    id: "eze_airport",
    label: "Buenos Aires Ezeiza (EZE)",
    lng: -58.5358,
    lat: -34.8222,
  },
  mumbai_city: {
    id: "mumbai_city",
    label: "Mumbai",
    lng: 72.8777,
    lat: 19.076,
  },
  bom_airport: {
    id: "bom_airport",
    label: "Mumbai Chhatrapati Shivaji (BOM)",
    lng: 72.8679,
    lat: 19.0896,
  },
  cairo_city: {
    id: "cairo_city",
    label: "Cairo",
    lng: 31.2357,
    lat: 30.0444,
  },
  cai_airport: {
    id: "cai_airport",
    label: "Cairo International (CAI)",
    lng: 31.4056,
    lat: 30.1219,
  },
  add_airport: {
    id: "add_airport",
    label: "Addis Ababa Bole (ADD)",
    lng: 38.7993,
    lat: 8.9779,
  },
  johannesburg_city: {
    id: "johannesburg_city",
    label: "Johannesburg",
    lng: 28.0473,
    lat: -26.2041,
  },
  jnb_airport: {
    id: "jnb_airport",
    label: "Johannesburg O.R. Tambo (JNB)",
    lng: 28.246,
    lat: -26.1392,
  },
  lagos_city: {
    id: "lagos_city",
    label: "Lagos",
    lng: 3.3792,
    lat: 6.5244,
  },
  los_airport: {
    id: "los_airport",
    label: "Lagos Murtala Muhammed (LOS)",
    lng: 3.3211,
    lat: 6.5774,
  },
  cdg_airport: {
    id: "cdg_airport",
    label: "Paris Charles de Gaulle (CDG)",
    lng: 2.5479,
    lat: 49.0097,
  },
  ams_airport: {
    id: "ams_airport",
    label: "Amsterdam Schiphol (AMS)",
    lng: 4.7639,
    lat: 52.3105,
  },
  nyc_hub: {
    id: "nyc_hub",
    label: "NYC distribution center",
    lng: -73.9857,
    lat: 40.7484,
  },
  brooklyn: {
    id: "brooklyn",
    label: "Brooklyn, NY",
    lng: -73.9442,
    lat: 40.6782,
  },
  istanbul_airport: {
    id: "istanbul_airport",
    label: "Istanbul Airport (IST)",
    lng: 28.8146,
    lat: 41.2753,
  },
  accra_city: {
    id: "accra_city",
    label: "Accra",
    lng: -0.187,
    lat: 5.6037,
  },
  acc_airport: {
    id: "acc_airport",
    label: "Accra Kotoka (ACC)",
    lng: -0.1668,
    lat: 5.6052,
  },
  lima_city: {
    id: "lima_city",
    label: "Lima",
    lng: -77.0428,
    lat: -12.0464,
  },
  lim_airport: {
    id: "lim_airport",
    label: "Lima Jorge Chávez (LIM)",
    lng: -77.1143,
    lat: -12.0219,
  },
  nairobi_city: {
    id: "nairobi_city",
    label: "Nairobi",
    lng: 36.8219,
    lat: -1.2921,
  },
  nbo_airport: {
    id: "nbo_airport",
    label: "Nairobi Jomo Kenyatta (NBO)",
    lng: 36.9278,
    lat: -1.3192,
  },
};

export const ALL_AIRPORT_IDS = Object.keys(NODES).filter((id) =>
  id.endsWith("_airport"),
);

export function nearestAirportIdFromCoords(p: {
  lng: number;
  lat: number;
}): string {
  let bestId = ALL_AIRPORT_IDS[0] ?? "dxb_airport";
  let bestKm = Number.POSITIVE_INFINITY;
  for (const id of ALL_AIRPORT_IDS) {
    const n = NODES[id];
    const d = distanceKm(p, n);
    if (d < bestKm) {
      bestKm = d;
      bestId = id;
    }
  }
  return bestId;
}

export const AIRPORT_FOR_CITY: Record<string, string> = {
  singapore_city: "changi_airport",
  dubai_city: "dxb_airport",
  paris_city: "cdg_airport",
  london_city: "lhr_airport",
  frankfurt_city: "fra_airport",
  tokyo_city: "nrt_airport",
  sydney_city: "syd_airport",
  los_angeles_city: "lax_airport",
  new_york_city: "jfk_airport",
  sao_paulo_city: "gru_airport",
  mumbai_city: "bom_airport",
  cairo_city: "cai_airport",
  johannesburg_city: "jnb_airport",
  lagos_city: "los_airport",
  accra_city: "acc_airport",
  lima_city: "lim_airport",
  nairobi_city: "nbo_airport",
};

export const TRANSIT_HUB_AIRPORTS: string[] = [
  "dxb_airport",
  "doh_airport",
  "changi_airport",
  "cdg_airport",
  "fra_airport",
  "ams_airport",
  "lhr_airport",
  "nrt_airport",
  "hkg_airport",
  "icn_airport",
  "bom_airport",
  "del_airport",
  "pvg_airport",
  "lax_airport",
  "jfk_airport",
  "ord_airport",
  "atl_airport",
  "gru_airport",
  "eze_airport",
  "syd_airport",
  "istanbul_airport",
  "cai_airport",
  "jnb_airport",
  "nbo_airport",
  "lim_airport",
  "acc_airport",
  "add_airport",
  "tlv_airport",
  "mad_airport",
];
