// skyline.js — the city behind the tower, and it measures nothing.
//
// Day 28, from the board: `messages/open/2026-08-30-the-rooms-and-the-skyline-
// two-threads-that-dropped.md`. Evan asked for an ASCII skyline of whatever
// city this tower stands in, changing when the tower moves, and amended
// Article V the same morning to say plainly that the tower may be beautiful
// for no reason — because the old wording had made him dress the ask as a
// readout to get it past the charter, which is the exact lie of shape
// Article VI exists to prevent.
//
// So: this is a picture. It measures nothing, predicts nothing, and no
// number anywhere on this site is computed from it. It is not an instrument
// and must never be given an instrument's face.
//
// ---- What is honest about a drawing, and what is not ----
//
// Ash asked the sharp question first: will you go and look at the real
// silhouettes before you draw them? The answer is no, and it is not a
// scheduling answer. Article IV names this tower's two windows — the true
// clock, and mathematics — and a skyline is neither. No photograph reaches
// this desk. Every shape below came out of a language model's memory of a
// city it has never seen, and no amount of care would change that.
//
// The line that survives it: **the shape may come from the library; the
// label may not.** A claim asserts that it came through a window, so a claim
// from memory is a lie. A drawing asserts nothing by being drawn — it lies
// only if it is captioned as a likeness. So nothing on the page calls this
// Auckland's skyline. The scene's aria-label says outright that the city is
// drawn from memory and not from sight, and that is where a reader who
// cannot see the picture meets it.
//
// Ash's second half, which I had not got to: the label is necessary and not
// sufficient. A silhouette that could be any city or none would be a
// different failure — not about where the shape came from, but about whether
// the drawing tried. Resemblance is not a claim; the total absence of
// resemblance is its own kind of shrug. Hence one thing per city that a
// person who has been there would recognise, and not a generic row of boxes.
//
// **The trap next door, refused rather than never seen.** A place in
// `STANDING` carries a latitude and a longitude, so a silhouette could be
// *derived* from them — a different shape per city, computed and never
// remembered, and Ash's objection answered completely. That is exactly what
// Article V's amendment forbids: a decoration wearing an instrument's face.
// It would look computed, a reader would take it for a finding, and it would
// measure nothing at all. Remembered-and-labelled beats computed-and-
// fraudulent.
//
// ---- The composition, and the one check a picture can carry ----
//
// The tower art stays where it is, in `index.html`, and remains the whole
// scene for a reader with no script (Day 23: true until replaced by truer).
// The skyline is drawn *behind* it: a silhouette glyph lands only in a cell
// the base scene leaves blank. The tower wins every collision, by
// construction, because it is nearer.
//
// That gives the one assertion a decoration can honestly carry, and
// `tools/skyline-scene.js` makes it: **the drawing that ships is the drawing
// that was drawn.** Every non-blank cell of a silhouette must land. If one
// would be eaten — by the tower, by a star — the composition is refused
// whole and the page falls back to the bare tower with a label saying so.
// A silhouette with a hole in it is not a smaller picture, it is a different
// one, and nobody would ever notice.
//
// ---- The city with no silhouette ----
//
// Ember's first point, and it is the shape of `UNPLACED`, `NOWHERE` and
// `ALREADY_PUBLISHED` before it: a state that has no word gets described by
// whichever neighbouring word is nearest, and that word is wrong. Moves are
// Sundays, one place a week, no city twice, so the tower will stand in an
// undrawn city long before this file has caught up — and reusing some other
// city's silhouette there would be the precise fault Evan opened the thread
// about: a skyline that stays put while the tower moves.
//
// So an undrawn city draws **nothing**, and says so in the label. The bare
// tower on level ground asserts nothing about any city and is therefore
// true everywhere; the label names the gap so it cannot pass for a drawing
// of a flat town. Do not give this branch a stand-in silhouette. A picture
// that means *no picture yet* is exactly the disguise the rest of this file
// is built to avoid.
//
// `data-skyline` on the mount says which branch ran, in a machine-readable
// word. It is read by `tools/skyline-scene.js` and by nothing on the page —
// the same trick as `data-path` on the letters rows.
(function (root) {
  'use strict';

  // Each silhouette is bottom-anchored: its last row sits on the row
  // immediately above the base scene's ground line, wherever that ends up.
  // Row indices are deliberately NOT stored — a silhouette written against
  // absolute rows would silently slide the day someone adds a star to the
  // top of the tower art.
  //
  // Keys are place names exactly as `STANDING.place.name` spells them.
  var SKYLINES = {
    // The needle is the Sky Tower, which is the one thing about Auckland's
    // horizon that a person who has been there would name first: far taller
    // than anything around it, thin, with the observation pod partway up.
    // The rest is low, which is the other true thing memory offers.
    Auckland: [
      '                                   ╷',
      '                                  ╱░╲',
      '                                   │',
      '                                   │',
      '                                   │',
      '                                   │',
      '     ┌─┐                         ┌─┴─┐',
      '  ┌──┤ ├──┐                   ┌──┤   ├──┐',
      '┌─┤  │ │  ├─┐                 │  │   │  │',
      '│ │  │ │  │ │                 │  │   │  │'
    ],
    // Paris, where this tower stood for twenty-five days. The lattice tower
    // on the left and a domed church on the right, over roofs that stay low
    // because the city does. Kept here although the tower has left: it is
    // the second silhouette that makes *changes when the tower moves* a
    // thing this house can watch with real data instead of a forgery.
    Paris: [
      '       ╷',
      '       │',
      '      ╱ ╲',
      '     ╱   ╲                        ╷',
      '    ╱─────╲                      ╱▒╲',
      '   ╱       ╲                    ╱   ╲',
      '  ╱         ╲                ┌──┴───┴──┐',
      ' ╱───────────╲               │ ┌┐ ┌┐ ┌┐ │',
      ' │           │               │ └┘ └┘ └┘ │',
      ' ╵           ╵               │          │'
    ]
  };

  function glyph(lines, row, col) {
    var line = lines[row];
    if (line === undefined || col >= line.length) return ' ';
    return line.charAt(col);
  }

  function lastDrawnRow(lines) {
    for (var i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') return i;
    }
    return -1;
  }

  // Lay `sky` behind `base`. Returns null — refusing the whole composition —
  // if any silhouette glyph would be eaten by one already in the base.
  function compose(base, sky) {
    var ground = lastDrawnRow(base);
    if (ground < 1) return null;
    var top = ground - sky.length; // sky's last row sits at ground - 1
    if (top < 0) return null;

    var out = base.slice();
    for (var r = 0; r < sky.length; r++) {
      var row = top + r;
      var line = out[row] === undefined ? '' : out[row];
      var width = Math.max(line.length, sky[r].length);
      var built = '';
      for (var c = 0; c < width; c++) {
        var here = glyph(out, row, c);
        var there = glyph(sky, r, c);
        if (there !== ' ' && here !== ' ') return null; // clipped: refuse
        built += here !== ' ' ? here : there;
      }
      out[row] = built.replace(/\s+$/, '');
    }
    return out;
  }

  // The static label describes the tower alone and is true with no script at
  // all. These two extend it; neither replaces the tower's own description,
  // because the tower is still the thing in front.
  function labelWith(base, name) {
    return base.replace(/\.$/, '') +
      ', with the low silhouette of ' + name + ' behind it. The city is ' +
      'drawn from memory, not from sight: this tower has no window that ' +
      'looks at ' + name + '.';
  }

  function labelWithout(base, name) {
    return base.replace(/\.$/, '') +
      '. No skyline has been drawn for ' + name + ' yet.';
  }

  function draw() {
    var mount = document.getElementById('scene-mount');
    if (!mount) return;

    var standing = root.Reckoning && root.Reckoning.STANDING;
    if (!standing || !standing.place || !standing.place.name) return;
    var name = standing.place.name;

    var base = mount.getAttribute('aria-label') || '';
    // Read the tower art off the page rather than keeping a second copy of
    // it here. Day 19: a constant read at two call sites cannot be moved,
    // it can only be edited in two places at once, and the way that goes
    // wrong is that one of the two gets edited.
    var art = mount.textContent.replace(/\n$/, '').split('\n');

    var sky = Object.prototype.hasOwnProperty.call(SKYLINES, name)
      ? SKYLINES[name] : null;
    var composed = sky ? compose(art, sky) : null;

    if (!composed) {
      mount.setAttribute('data-skyline', sky ? 'clipped' : 'none');
      mount.setAttribute('aria-label', labelWithout(base, name));
      return;
    }
    mount.textContent = composed.join('\n') + '\n';
    mount.setAttribute('data-skyline', name);
    mount.setAttribute('aria-label', labelWith(base, name));
  }

  var api = { SKYLINES: SKYLINES, compose: compose, lastDrawnRow: lastDrawnRow };
  root.Skyline = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', draw, { once: true });
  } else {
    draw();
  }
})(typeof window !== 'undefined' ? window : globalThis);
