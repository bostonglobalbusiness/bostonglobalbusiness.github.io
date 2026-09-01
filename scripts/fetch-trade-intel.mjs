// Fetches monthly USA -> Peru fresh-apple (HS 080810) export values from the
// U.S. Census Bureau International Trade API and writes a static JSON file
// the site reads client-side. Run by .github/workflows/update-trade-intel.yml.
//
// Docs: https://api.census.gov/data/timeseries/intltrade/exports/hs/examples.html
// CTY_CODE=3330 is Peru's Schedule C country code.
// COMM_LVL=HS6 + E_COMMODITY=080810 selects fresh apples specifically.

import { writeFile } from "node:fs/promises";

const API_KEY = process.env.CENSUS_API_KEY;
if (!API_KEY) {
  console.error("CENSUS_API_KEY is not set — add it as a repo secret first.");
  process.exit(1);
}

const CTY_CODE = "3330"; // Peru
const E_COMMODITY = "080810"; // fresh apples, HS6
const COMM_LVL = "HS6";
const OUTPUT_FILE = new URL("../trade-intel-usa-peru-apples.json", import.meta.url);

// Census releases monthly export data ~5-6 weeks after month end, but the
// exact publish date varies — 2 months of lag wasn't always enough in
// practice, so use 3 to stay safely behind the actual release schedule.
function monthsToFetch() {
  const now = new Date();
  const safeLatest = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const start = new Date(safeLatest.getFullYear() - 2, 0, 1); // Jan, two years back

  const months = [];
  const cursor = new Date(start);
  while (cursor <= safeLatest) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

async function fetchMonth(time) {
  const url = new URL("https://api.census.gov/data/timeseries/intltrade/exports/hs");
  url.searchParams.set("get", "ALL_VAL_MO,ALL_VAL_YR");
  url.searchParams.set("time", time);
  url.searchParams.set("CTY_CODE", CTY_CODE);
  url.searchParams.set("E_COMMODITY", E_COMMODITY);
  url.searchParams.set("COMM_LVL", COMM_LVL);
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Census API HTTP ${res.status} for ${time}: ${text.slice(0, 200)}`);
  }

  let rows;
  try {
    rows = JSON.parse(text);
  } catch {
    // Census returns an HTML error page (not JSON) for bad keys/params.
    throw new Error(`Census API returned non-JSON for ${time}: ${text.slice(0, 200)}`);
  }

  // rows[0] is the header row; no data row means genuinely zero trade that month.
  if (!rows || rows.length < 2) {
    return { month: time, valueMonthly: 0, valueYearToDate: 0 };
  }

  const header = rows[0];
  const data = rows[1];
  const moIdx = header.indexOf("ALL_VAL_MO");
  const yrIdx = header.indexOf("ALL_VAL_YR");

  return {
    month: time,
    valueMonthly: Number(data[moIdx]) || 0,
    valueYearToDate: Number(data[yrIdx]) || 0,
  };
}

async function main() {
  const months = monthsToFetch();
  console.log(`Fetching ${months.length} months: ${months[0]} .. ${months[months.length - 1]}`);

  const results = [];
  for (const month of months) {
    try {
      const row = await fetchMonth(month);
      results.push(row);
      console.log(`  ${month}: monthly=${row.valueMonthly} ytd=${row.valueYearToDate}`);
    } catch (err) {
      console.error(`  ${month}: FAILED — ${err.message}`);
      results.push({ month, valueMonthly: null, valueYearToDate: null, error: true });
    }
    // Be polite to the API — small delay between calls.
    await new Promise((r) => setTimeout(r, 300));
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: "U.S. Census Bureau, International Trade Data API",
    sourceUrl: "https://www.census.gov/foreign-trade/",
    hsCode: E_COMMODITY,
    hsDescription: "Fresh apples",
    exporter: "United States",
    importer: "Peru",
    unit: "USD",
    months: results,
  };

  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUTPUT_FILE.pathname}`);

  const failedCount = results.filter((r) => r.error).length;
  if (failedCount > 0) {
    console.error(`${failedCount} month(s) failed to fetch — check logs above.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
