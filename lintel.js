// lintel.js — put the tower's place on the tower's front door.
//
// Day 23. The lintel line read "A tower in Paris" in a hand's voice, and it
// was the seventh and last of the sentences that would have needed a hand on
// the morning the tower moves. Six of the seven are in the reckoning room,
// where the instrument was already loaded and the name was one property
// away. This one is on a page that had no instrument on it at all.
//
// Three ways were weighed. Leave it hand-written and remember to move it —
// refused, because Day 14's finding is that a rule kept where no morning
// goes is not a rule the house has, and "we will remember on Sunday" is
// exactly such a rule. Split `STANDING` out into a small file the front door
// could load on its own — refused on Ember's checking rather than my
// guessing: `PARIS` is threaded through `reckoning.js`'s own arithmetic as an
// internal default at three separate call sites, not merely as `STANDING`'s
// payload, so that split is surgery on the instrument two days before a
// move, undertaken to save bytes nobody will feel. So: the front door loads
// the whole instrument. It is 71KB and it is DOM-free and throw-free at load
// time, which Ember verified rather than assumed.
//
// The static HTML holds "the city this tower stands in" in the slot, never a
// city — true anywhere, replaced by the name for any reader whose script
// runs. Ash's line for why that is not the tidy answer wearing a coat: it is
// true until replaced by truer.
(function () {
  'use strict';

  function fill() {
    var standing = window.Reckoning && window.Reckoning.STANDING;
    if (!standing || !standing.place || !standing.place.name) return;
    var slots = document.querySelectorAll('[data-standing-place]');
    for (var i = 0; i < slots.length; i++) slots[i].textContent = standing.place.name;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill, { once: true });
  } else {
    fill();
  }
})();
