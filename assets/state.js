/* The release switchboard. Two flags per puzzle:
     published — the puzzle's card appears on the index;
     proof     — its page offers the Proof layer.
   A puzzle missing from this list is fully live (both true).
   Flip a flag, push to main: that is the whole release mechanism. */
window.PUZZLE_STATE = {
  "emptying-poles": { published: true, proof: true  },
  "fifteen-balls":  { published: true, proof: true  },
  "invisible-frog": { published: true, proof: true  },
  "dobble":         { published: true, proof: true  },
  "rectangle-eraser": { published: true, proof: true  },
  "josephus":       { published: true, proof: true  },
  "last-stone":     { published: true, proof: true  },
  "counterfeit-coin": { published: true, proof: true  },
  "conways-soldiers": { published: true, proof: true  },
  "poisoned-barrels": { published: true, proof: true  },
};
