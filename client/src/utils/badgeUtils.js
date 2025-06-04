export const BADGES = {
  LEVEL: [
    { level: 1, name: "Newbie Coder", emoji: "🐣", description: "Reached Level 1" },
    { level: 5, name: "Code Pup", emoji: "🐶", description: "Reached Level 5" },
    { level: 10, name: "Junior Dev", emoji: "🦊", description: "Reached Level 10" },
    { level: 20, name: "Senior Dev", emoji: "🐺", description: "Reached Level 20" },
    { level: 50, name: "Code Wizard", emoji: "🧙", description: "Reached Level 50" },
    { level: 100, name: "Legendary Hacker", emoji: "🐉", description: "Reached Level 100" }
  ],
  CHALLENGES: [
    { count: 1, name: "First Challenge", emoji: "🎯", description: "Joined 1 challenge" },
    { count: 5, name: "Regular Player", emoji: "🏆", description: "Joined 5 challenges" },
    { count: 10, name: "Challenge Lover", emoji: "💘", description: "Joined 10 challenges" },
    { count: 20, name: "Tournament Master", emoji: "👑", description: "Joined 20 challenges" },
    { count: 50, name: "Ultimate Champion", emoji: "🦄", description: "Joined 50 challenges" },
    { count: 100, name: "Challenge God", emoji: "🤖", description: "Joined 100 challenges" }
  ],
  POSTS: [
    { count: 1, name: "First Post", emoji: "✏️", description: "Made your first post" }
  ],
  SUBMISSIONS: [
    { count: 1, name: "First Correct Answer", emoji: "✅", description: "Solved 1 problem" },
    { count: 5, name: "Problem Solver", emoji: "🌟", description: "Solved 5 problems" },
    { count: 10, name: "Code Ninja", emoji: "⚔️", description: "Solved 10 problems" },
    { count: 20, name: "Algorithm Master", emoji: "🧠", description: "Solved 20 problems" },
    { count: 50, name: "Debugging King", emoji: "🐞", description: "Solved 50 problems" },
    { count: 100, name: "IT Wizard", emoji: "🧙‍♂️", description: "Solved 100 problems" },
    { count: 500, name: "Absolute Unit", emoji: "🏋️", description: "Solved 500 problems" }
  ]
};
export const getUnlockedBadges = (userStats) => {
  const unlocked = [];
  
  // Check level badges
  BADGES.LEVEL.forEach(badge => {
    if (userStats.level >= badge.level) {
      unlocked.push(badge);
    }
  });
  
  // Check challenge badges
  BADGES.CHALLENGES.forEach(badge => {
    if (userStats.tournaments.count >= badge.count) {
      unlocked.push(badge);
    }
  });
  
  // Check post badges
  BADGES.POSTS.forEach(badge => {
    if (userStats.posts >= badge.count) {
      unlocked.push(badge);
    }
  });
  
  // Check submission badges
  BADGES.SUBMISSIONS.forEach(badge => {
    if (userStats.submissions.correct >= badge.count) {
      unlocked.push(badge);
    }
  });
  
  return unlocked;
};
