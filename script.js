// --- SVGs as before ---
const SVGs = {
  rock: `<svg viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="28" rx="14" ry="14" fill="#90A4AE"/><ellipse cx="24" cy="30" rx="10" ry="10" fill="#CFD8DC"/></svg>`,
  paper: `<svg viewBox="0 0 48 48" fill="none"><rect x="12" y="10" width="24" height="28" rx="4" fill="#FFFDE7" stroke="#FFE082" stroke-width="2"/><rect x="16" y="18" width="16" height="2" rx="1" fill="#FFE082"/><rect x="16" y="24" width="10" height="2" rx="1" fill="#FFE082"/></svg>`,
  scissors: `<svg viewBox="0 0 48 48" fill="none"><circle cx="18" cy="30" r="6" fill="#BDBDBD"/><circle cx="30" cy="18" r="6" fill="#BDBDBD"/><rect x="21" y="21" width="6" height="20" rx="3" transform="rotate(-45 21 21)" fill="#F44336"/><rect x="21" y="21" width="6" height="20" rx="3" transform="rotate(45 21 21)" fill="#1976D2"/></svg>`,
  win: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#43a047"/><path d="M14 25l7 7 13-13" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lose: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#d32f2f"/><path d="M16 32l16-16M32 32L16 16" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
  draw: `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#fbc02d"/><circle cx="24" cy="24" r="10" fill="#fff"/><circle cx="24" cy="24" r="4" fill="#fbc02d"/></svg>`
};

document.getElementById('rock-svg').innerHTML = SVGs.rock;
document.getElementById('paper-svg').innerHTML = SVGs.paper;
document.getElementById('scissors-svg').innerHTML = SVGs.scissors;

// --- DOM elements ---
const choices = ["rock", "paper", "scissors"];
const resultDisplay = document.getElementById('result-text');
const resultGraphic = document.getElementById('result-graphic');
const userScoreDisplay = document.getElementById('user-score');
const computerScoreDisplay = document.getElementById('computer-score');
const roundsSelect = document.getElementById('rounds-select');
const difficultySelect = document.getElementById('difficulty-select');
const resetBtn = document.getElementById('reset-btn');
const countdownEl = document.getElementById('countdown');
const overallWinnerEl = document.getElementById('overall-winner');
const historyList = document.getElementById('history-list');
const leaderboardList = document.getElementById('leaderboard-list');
const darkToggle = document.getElementById('dark-toggle');
const musicToggle = document.getElementById('music-toggle');
const soundToggle = document.getElementById('sound-toggle');
const bgMusic = document.getElementById('bg-music');
const sfxWin = document.getElementById('sfx-win');
const sfxLose = document.getElementById('sfx-lose');
const sfxDraw = document.getElementById('sfx-draw');
const sfxClick = document.getElementById('sfx-click');
const player1NameSpan = document.getElementById('player1-name');
const player2NameSpan = document.getElementById('player2-name');
const editNameBtn = document.getElementById('edit-name-btn');
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');
const badgePopup = document.getElementById('badge-popup');
const turnIndicator = document.getElementById('turn-indicator');
const themeSelect = document.getElementById('theme-select');

let userScore = 0, computerScore = 0, roundsToWin = 5, gameActive = true;
let userHistory = [];
let computerHistory = [];
let gameHistory = [];
let lastTimeout = null;
let soundEnabled = true;
let musicEnabled = false;
let player1Name = "Suraj";
let player2Name = "Computer";
let leaderboard = [];
let gameMode = "single"; // or "local"
let player1Choice = null;
let player2Choice = null;
let turn = 1;
let winStreak = 0;
let achievements = {};
let theme = "classic";

// ------------- Persistent state helpers -------------
function saveScores() {
  localStorage.setItem("rps-userScore", userScore);
  localStorage.setItem("rps-computerScore", computerScore);
  localStorage.setItem("rps-player1Name", player1Name);
  localStorage.setItem("rps-player2Name", player2Name);
  localStorage.setItem("rps-mode", gameMode);
}
function loadScores() {
  userScore = parseInt(localStorage.getItem("rps-userScore") || "0");
  computerScore = parseInt(localStorage.getItem("rps-computerScore") || "0");
  player1Name = localStorage.getItem("rps-player1Name") || "Suraj";
  player2Name = localStorage.getItem("rps-player2Name") || "Computer";
  gameMode = localStorage.getItem("rps-mode") || "single";
}
function saveLeaderboard() {
  localStorage.setItem("rps-leaderboard", JSON.stringify(leaderboard));
}
function loadLeaderboard() {
  leaderboard = JSON.parse(localStorage.getItem("rps-leaderboard") || "[]");
}
function saveTheme() {
  localStorage.setItem("rps-theme", theme);
}
function loadTheme() {
  theme = localStorage.getItem("rps-theme") || "classic";
  themeSelect.value = theme;
  setTheme(theme);
}

// ------------- UI helpers -------------
function updateNameDisplay() {
  player1NameSpan.textContent = player1Name;
  player2NameSpan.textContent = player2Name;
}
function showNameModal() {
  nameModal.classList.remove("hidden");
  nameInput.value = player1Name;
  setTimeout(() => nameInput.focus(), 100);
}
function hideNameModal() {
  nameModal.classList.add("hidden");
}
function setTheme(themeName) {
  document.body.classList.remove("theme-classic", "theme-neon", "theme-nature");
  if (themeName !== "classic") document.body.classList.add("theme-" + themeName);
  theme = themeName;
  saveTheme();
}
// ------------- Game logic -------------
function getComputerChoice(difficulty, userHistory) {
  if (difficulty === "easy" || userHistory.length < 1) {
    return choices[Math.floor(Math.random() * 3)];
  } else if (difficulty === "medium") {
    const last3 = userHistory.slice(-3);
    if (last3.length === 0) return choices[Math.floor(Math.random() * 3)];
    const freq = {rock: 0, paper: 0, scissors: 0};
    last3.forEach(v => freq[v]++);
    let maxMove = "rock";
    if (freq.paper > freq[maxMove]) maxMove = "paper";
    if (freq.scissors > freq[maxMove]) maxMove = "scissors";
    if (maxMove === "rock") return "paper";
    if (maxMove === "paper") return "scissors";
    return "rock";
  } else if (difficulty === "hard") {
    // Markov chain prediction
    if (userHistory.length < 2) return choices[Math.floor(Math.random() * 3)];
    let transitions = { rock: {}, paper: {}, scissors: {} };
    for (let i = 1; i < userHistory.length; i++) {
      let prev = userHistory[i - 1], curr = userHistory[i];
      transitions[prev][curr] = (transitions[prev][curr] || 0) + 1;
    }
    let lastMove = userHistory[userHistory.length - 1];
    let possible = transitions[lastMove];
    let predicted = "rock";
    if (possible) {
      predicted = Object.keys(possible).reduce((a, b) => possible[a] > possible[b] ? a : b, "rock");
    }
    // Counter the predicted move
    if (predicted === "rock") return "paper";
    if (predicted === "paper") return "scissors";
    return "rock";
  }
  return choices[Math.floor(Math.random() * 3)];
}
function getResult(user, computer) {
  if (user === computer) return "draw";
  if (
    (user === "rock" && computer === "scissors") ||
    (user === "paper" && computer === "rock") ||
    (user === "scissors" && computer === "paper")
  ) return "win";
  return "lose";
}
function showResult(result, user, computer) {
  let text = `You chose <b>${capitalize(user)}</b>, ${gameMode === "single" ? "computer" : player2Name} chose <b>${capitalize(computer)}</b>.<br>`;
  if (result === "draw") {
    text += "It's a draw!";
    resultGraphic.innerHTML = SVGs.draw;
  } else if (result === "win") {
    text += "You win this round! 🎉";
    resultGraphic.innerHTML = SVGs.win;
    userScore++;
    winStreak++;
    checkAchievements("win");
  } else {
    text += "You lose this round! 😢";
    resultGraphic.innerHTML = SVGs.lose;
    computerScore++;
    winStreak = 0;
    checkAchievements(result);
  }
  resultDisplay.innerHTML = text;
  userScoreDisplay.textContent = userScore;
  computerScoreDisplay.textContent = computerScore;
  showTemporaryGraphic(result);
  playSfx(result);
  saveScores();
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function disableChoices(disabled) {
  document.querySelectorAll('.choice').forEach(btn => btn.disabled = disabled);
}
function checkOverallWinner() {
  if (userScore >= roundsToWin) {
    overallWinnerEl.innerHTML = player1Name + " is the overall winner! 🏆";
    overallWinnerEl.className = "overall-winner win";
    gameActive = false;
    disableChoices(true);
    addToLeaderboard(player1Name, userScore);
    checkAchievements("champion");
    return true;
  }
  if (computerScore >= roundsToWin) {
    overallWinnerEl.innerHTML = player2Name + " wins the match! 🤖";
    overallWinnerEl.className = "overall-winner";
    gameActive = false;
    disableChoices(true);
    addToLeaderboard(player2Name, computerScore);
    winStreak = 0;
    return true;
  }
  return false;
}
function resetGame(full = true) {
  loadScores();
  userScoreDisplay.textContent = userScore;
  computerScoreDisplay.textContent = computerScore;
  updateNameDisplay();
  resultDisplay.textContent = "";
  resultGraphic.innerHTML = "";
  countdownEl.textContent = "";
  overallWinnerEl.textContent = "";
  overallWinnerEl.className = "overall-winner";
  userHistory = [];
  computerHistory = [];
  gameHistory = [];
  winStreak = 0;
  renderHistory();
  renderLeaderboard();
  gameActive = true;
  disableChoices(false);
  turn = 1;
  player1Choice = null;
  player2Choice = null;
  turnIndicator.textContent = "";
  if (full) {
    roundsToWin = parseInt(roundsSelect.value, 10);
  }
  if (gameMode === "local") {
    turnIndicator.textContent = `${player1Name}, it's your turn!`;
    player2NameSpan.textContent = player2Name;
  } else {
    turnIndicator.textContent = '';
    player2NameSpan.textContent = "Computer";
  }
}
// --- Multiplayer (local) handler ---
function playRoundLocal(choice) {
  if (turn === 1) {
    player1Choice = choice;
    turn = 2;
    turnIndicator.textContent = `${player2Name}, it's your turn!`;
    disableChoices(false);
  } else if (turn === 2) {
    player2Choice = choice;
    // Countdown before reveal!
    turnIndicator.textContent = "";
    disableChoices(true);
    let timer = 2;
    countdownEl.textContent = "Revealing in " + timer + "...";
    let revealInterval = setInterval(() => {
      timer--;
      countdownEl.textContent = "Revealing in " + timer + "...";
      if (timer <= 0) {
        clearInterval(revealInterval);
        countdownEl.textContent = "";
        revealLocal();
      }
    }, 1000);
  }
}
function revealLocal() {
  const result = getResult(player1Choice, player2Choice);
  showResult(result, player1Choice, player2Choice);
  addToHistory(result, player1Choice, player2Choice);
  if (!checkOverallWinner()) {
    setTimeout(() => {
      turn = 1;
      player1Choice = player2Choice = null;
      turnIndicator.textContent = `${player1Name}, it's your turn!`;
      disableChoices(false);
    }, 1000);
  }
}
// --- Single player handler ---
function playRoundSingle(choice) {
  resultDisplay.textContent = "";
  resultGraphic.innerHTML = "";
  countdownEl.textContent = "Get ready...";
  disableChoices(true);

  const userBtn = document.querySelector(`.choice[data-choice="${choice}"]`);
  userBtn.classList.add("animated");
  setTimeout(() => userBtn.classList.remove("animated"), 350);

  let timer = 3;
  lastTimeout && clearTimeout(lastTimeout);
  function countdown() {
    if (timer > 0) {
      countdownEl.textContent = timer + "...";
      timer--;
      lastTimeout = setTimeout(countdown, 1000);
    } else {
      countdownEl.textContent = "Go!";
      revealComputerChoice(choice);
    }
  }
  countdown();
}
function revealComputerChoice(userChoice) {
  const difficulty = difficultySelect.value;
  userHistory.push(userChoice);
  const computerChoice = getComputerChoice(difficulty, userHistory);
  computerHistory.push(computerChoice);

  const computerBtn = document.querySelector(`.choice[data-choice="${computerChoice}"]`);
  computerBtn.classList.add("computer");
  setTimeout(() => computerBtn.classList.remove("computer"), 500);

  const result = getResult(userChoice, computerChoice);
  showResult(result, userChoice, computerChoice);
  addToHistory(result, userChoice, computerChoice);

  countdownEl.textContent = "";
  if (!checkOverallWinner()) {
    setTimeout(() => disableChoices(false), 700);
  }
}

// --- History, Leaderboard, Achievements ---
function addToHistory(result, user, computer) {
  if (gameHistory.length >= 5) gameHistory.shift();
  gameHistory.push({ result, user, computer });
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML = gameHistory.map(entry => `
    <div class="history-entry">
      <span class="history-result ${entry.result}">${historyIcon(entry.result)} ${capitalize(entry.result)}</span>
      <span>${SVGs[entry.user] || "?"} <b>${capitalize(entry.user)}</b> vs ${SVGs[entry.computer] || "?"} <b>${capitalize(entry.computer)}</b></span>
    </div>
  `).join('') || `<div class="history-entry">No games played yet.</div>`;
}
function historyIcon(result) {
  if (result === "win") return "🏆";
  if (result === "lose") return "💀";
  return "🤝";
}
function addToLeaderboard(name, score) {
  loadLeaderboard();
  leaderboard.push({ name, score, date: new Date().toLocaleString() });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  saveLeaderboard();
  renderLeaderboard();
}
function renderLeaderboard() {
  loadLeaderboard();
  if (!leaderboard.length) {
    leaderboardList.innerHTML = `<div class="leaderboard-entry">No scores yet.</div>`;
    return;
  }
  leaderboardList.innerHTML = leaderboard.map((entry, idx) => `
    <div class="leaderboard-entry">
      <span>#${idx + 1} <b>${entry.name}</b></span>
      <span>Score: ${entry.score}</span>
    </div>
  `).join('');
}

// --- Achievements / Badges ---
function checkAchievements(result) {
  // Win streaks
  if (result === "win") {
    if (winStreak === 5 && !achievements["5row"]) {
      achievements["5row"] = true;
      showBadge("🏅 5 Wins in a Row!");
    }
    if (winStreak === 10 && !achievements["champion"]) {
      achievements["champion"] = true;
      showBadge("👑 Unbeaten Champion!");
    }
  }
  if (result === "champion" && !achievements["gamechamp"]) {
    achievements["gamechamp"] = true;
    showBadge("🏆 Match Winner!");
  }
}
function showBadge(text) {
  badgePopup.innerHTML = text;
  badgePopup.classList.remove("hidden");
  badgePopup.classList.add("visible");
  setTimeout(() => {
    badgePopup.classList.remove("visible");
    setTimeout(() => badgePopup.classList.add("hidden"), 500);
  }, 1700);
}

// --- Audio logic ---
function playSfx(result) {
  if (!soundEnabled) return;
  if (result === "win") sfxWin.currentTime = 0, sfxWin.play();
  else if (result === "lose") sfxLose.currentTime = 0, sfxLose.play();
  else if (result === "draw") sfxDraw.currentTime = 0, sfxDraw.play();
}
function playClick() {
  if (!soundEnabled) return;
  sfxClick.currentTime = 0;
  sfxClick.play();
}

// --- Music logic ---
function toggleMusic(force) {
  musicEnabled = typeof force === "boolean" ? force : !musicEnabled;
  if (musicEnabled) {
    bgMusic.volume = 0.16;
    bgMusic.play();
    musicToggle.classList.add("active");
    musicToggle.innerText = "🔊";
  } else {
    bgMusic.pause();
    musicToggle.classList.remove("active");
    musicToggle.innerText = "🎵";
  }
}
function toggleSound(force) {
  soundEnabled = typeof force === "boolean" ? force : !soundEnabled;
  if (soundEnabled) {
    soundToggle.classList.add("active");
    soundToggle.innerText = "🔊";
  } else {
    soundToggle.classList.remove("active");
    soundToggle.innerText = "🔈";
  }
}

// --- Dark mode toggle ---
darkToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark', darkToggle.checked);
});
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  darkToggle.checked = true;
  document.body.classList.add('dark');
}

// --- Theme customization ---
themeSelect.addEventListener("change", e => {
  setTheme(e.target.value);
});
loadTheme();

// --- Game Mode switch ---
document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
  radio.addEventListener('change', e => {
    gameMode = e.target.value;
    if (gameMode === "local") {
      player2Name = "Player 2";
      player2NameSpan.textContent = player2Name;
      turn = 1;
      turnIndicator.textContent = `${player1Name}, it's your turn!`;
    } else {
      player2Name = "Computer";
      player2NameSpan.textContent = player2Name;
      turnIndicator.textContent = "";
    }
    saveScores();
    resetGame();
  });
});

// --- Event listeners ---
document.querySelectorAll('.choice').forEach(btn => {
  btn.addEventListener('click', () => {
    playClick();
    if (gameMode === "single") {
      playRoundSingle(btn.dataset.choice);
    } else {
      playRoundLocal(btn.dataset.choice);
    }
  });
});
roundsSelect.addEventListener('change', () => {
  roundsToWin = parseInt(roundsSelect.value, 10);
  resetGame();
});
difficultySelect.addEventListener('change', () => resetGame(false));
resetBtn.addEventListener('click', () => resetGame());
musicToggle.addEventListener('click', () => toggleMusic());
soundToggle.addEventListener('click', () => toggleSound());
editNameBtn.addEventListener('click', () => showNameModal());
saveNameBtn.addEventListener('click', () => {
  let v = nameInput.value.trim();
  if (!v) v = "Suraj";
  if (v.length > 16) v = v.slice(0, 16);
  player1Name = v;
  updateNameDisplay();
  saveScores();
  hideNameModal();
});
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveNameBtn.click();
});
window.addEventListener('DOMContentLoaded', () => {
  loadScores();
  updateNameDisplay();
  if (!localStorage.getItem("rps-player1Name")) {
    showNameModal();
  }
  renderLeaderboard();
  setTheme(theme);
});

// --- Initial setup ---
toggleSound(true);
toggleMusic(false);
resetGame();