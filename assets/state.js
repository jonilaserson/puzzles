/* The release switchboard. Two flags per puzzle:
     published — the puzzle's card appears on the index;
     proof     — its page offers the Proof layer.
   A puzzle missing from this list is fully live (both true).
   Flip a flag, push to main: that is the whole release mechanism. */
window.PUZZLE_STATE = {
  "emptying-poles": { published: true, proof: false },
  "fifteen-balls":  { published: true, proof: false },
  "invisible-frog": { published: true, proof: false },
  "dobble":         { published: true, proof: false },
  "josephus":       { published: true, proof: false },
};
