#!/usr/bin/env node
// tools/reckon.js — write the day's reckoning into the ledger, or audit
// what is already there.
//
//   node tools/reckon.js            reckon today (UTC) and append
//   node tools/reckon.js 2026-08-06 reckon a named date and append
//   node tools/reckon.js --verify   recompute every entry, report any drift
//
// The ledger is cold. An entry that has been written is never rewritten by
// this tool — not to correct it, not to improve it. If the arithmetic
// changes under us, the right outcome is that --verify starts failing
// loudly, and the diary explains why; it is not that yesterday's published
// number quietly becomes today's.
//
// That is the whole reason the ledger exists. A single day's numbers on a
// page prove nothing about anyone's honesty, because a page can be edited
// between the claim and the check. A committed record cannot.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'reckoning', 'ledger.json');
const { reckon, PARIS } = require(path.join(ROOT, 'reckoning', 'reckoning.js'));

function readLedger() {
  if (!fs.existsSync(LEDGER)) return [];
  const text = fs.readFileSync(LEDGER, 'utf8').trim();
  if (!text) return [];
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error('ledger.json is not an array');
  return parsed;
}

function writeLedger(entries) {
  entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  fs.writeFileSync(LEDGER, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

// Compare only the published claims, not the whole object. The working is
// evidence for the claim; the claim is what a reader was asked to believe.
const CLAIMS = ['sunrise', 'sunset', 'solarNoon', 'dayLengthMinutes', 'changeSinceYesterdayMinutes'];

function claimsOf(entry) {
  const out = {};
  for (const key of CLAIMS) out[key] = entry[key];
  return out;
}

function differences(published, recomputed) {
  const found = [];
  for (const key of CLAIMS) {
    const was = published[key], now = recomputed[key];
    if (typeof was === 'number' && typeof now === 'number') {
      if (Math.abs(was - now) > 1e-9) found.push(`${key}: published ${was}, recomputed ${now}`);
    } else if (was !== now) {
      found.push(`${key}: published ${was}, recomputed ${now}`);
    }
  }
  return found;
}

function verify(entries) {
  if (entries.length === 0) {
    console.log('reckon: the ledger is empty — nothing to verify.');
    return 0;
  }
  let drifted = 0;
  for (const entry of entries) {
    const fresh = reckon(entry.date, PARIS);
    const diffs = differences(entry, fresh);
    if (diffs.length === 0) {
      console.log(`reckon: ${entry.date} holds.`);
    } else {
      drifted += 1;
      console.log(`reckon: ${entry.date} HAS DRIFTED`);
      for (const line of diffs) console.log(`reckon:   ${line}`);
    }
  }
  if (drifted > 0) {
    console.log('');
    console.log(`reckon: ${drifted} published entr${drifted === 1 ? 'y' : 'ies'} no longer match today's arithmetic.`);
    console.log('reckon: do NOT edit the ledger. The ledger is the record of what was claimed.');
    console.log('reckon: work out what changed in the method, and write it in the diary.');
    return 1;
  }
  console.log('');
  console.log(`reckon: all ${entries.length} published entr${entries.length === 1 ? 'y holds' : 'ies hold'}.`);
  return 0;
}

function main(argv) {
  const entries = readLedger();

  if (argv.includes('--verify')) return verify(entries);

  const dateArg = argv.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
  // "Today" means Paris's today, not the sandbox's UTC today. Between
  // midnight and 02:00 UTC those are different dates, and the reckoning is
  // over Paris, so Paris's calendar is the one that governs.
  const date = dateArg || new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS.zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  const existing = entries.find(e => e.date === date);
  if (existing) {
    const fresh = reckon(date, PARIS);
    const diffs = differences(existing, fresh);
    console.log(`reckon: ${date} is already in the ledger. Not rewriting it.`);
    if (diffs.length === 0) {
      console.log('reckon: it still matches today\'s arithmetic.');
      return 0;
    }
    console.log('reckon: and it no longer matches today\'s arithmetic:');
    for (const line of diffs) console.log(`reckon:   ${line}`);
    console.log('reckon: leaving the published entry exactly as it stands. That is the point of it.');
    return 1;
  }

  const entry = reckon(date, PARIS);
  entry.publishedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  entries.push(entry);
  writeLedger(entries);

  console.log(`reckon: wrote ${date} to the ledger.`);
  console.log(`reckon:   sunrise ${entry.sunrise}  sunset ${entry.sunset}  (${entry.place.zone})`);
  console.log(`reckon:   day length ${entry.dayLength}`);
  if (entry.changeSinceYesterdayMinutes !== null) {
    const change = entry.changeSinceYesterdayMinutes;
    console.log(`reckon:   ${change < 0 ? 'shorter' : 'longer'} than yesterday by ${Math.abs(change).toFixed(2)} minutes`);
  }
  if (entry.crossCheck) {
    console.log(`reckon:   second method differs by ${entry.crossCheck.sunriseDifferenceMinutes.toFixed(2)}min at sunrise, ` +
      `${entry.crossCheck.sunsetDifferenceMinutes.toFixed(2)}min at sunset`);
  }
  return 0;
}

process.exit(main(process.argv.slice(2)));
