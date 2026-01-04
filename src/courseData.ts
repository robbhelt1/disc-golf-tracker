export const COURSE_DATA = [
  { 
    hole: 1, 
    par: 3, 
    distances: { red: 85, white: 175, blue: 220 }, // <--- New Structure
    info: "Watch out for the creek on the left.", 
    image: "/hole1.jpg"
  },
  { 
    hole: 2, 
    par: 4, 
    distances: { red: 350, white: 400, blue: 450 }, 
    info: "Dogleg right. Big tree in the middle.", 
    image: "/hole2.jpg"
  },
  { 
    hole: 3, 
    par: 3, 
    distances: { red: 250, white: 300, blue: 350 }, 
    info: "Straight shot.", 
    image: "/hole3.jpg"
  },
  { 
    hole: 4, 
    par: 4, 
    distances: { red: 300, white: 380, blue: 420 }, 
    info: "Water hazard on the right.", 
    image: "/hole4.jpg"
  },
  { 
    hole: 5, 
    par: 3, 
    distances: { red: 180, white: 220, blue: 260 }, 
    info: "Uphill shot.", 
    image: "/hole5.jpg"
  },
  // ... (Copy/Paste this pattern until you have 15 holes)
];

export const TEES = ['Red', 'White', 'Blue'];