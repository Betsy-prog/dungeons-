// =============================================
// script.js — The Dragon's Keep
//
// WHAT WAS BROKEN ON iPAD:
// The old version wrapped all functions inside
// DOMContentLoaded, which meant the onclick=""
// buttons in the HTML couldn't find them yet.
//
// THE FIX:
// All game functions are now declared at the
// TOP LEVEL — outside of any wrapper — so the
// browser can find them immediately, on any device.
// =============================================


// =============================================
// PART 1: GAME STATE
//
// One object holds all the numbers.
// JS reads and changes these every turn.
// =============================================

var game = {
  playerHP:      20,
  playerMax:     20,
  enemyHP:       7,
  enemyMax:      7,
  round:         1,
  isOver:        false,
  playerDodging: false
};


// =============================================
// HELPER FUNCTIONS
// Small reusable tools the battle uses.
// =============================================

// Roll a die — returns a random number 1 to `sides`
function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Add a line of text to the combat log box
function addLog(message) {
  var log = document.getElementById('log');
  if (!log) return;
  var p = document.createElement('p');
  p.textContent = message;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight; // auto-scroll to latest
}

// Update both HP bars and the HP numbers on screen
function updateBars() {
  // Player
  var pPct = Math.max(0, game.playerHP) / game.playerMax * 100;
  var pBar = document.getElementById('player-bar');
  var pNum = document.getElementById('player-hp');
  if (pBar) pBar.style.width = pPct + '%';
  if (pNum) pNum.textContent = Math.max(0, game.playerHP);

  // Change bar colour when HP gets low
  if (pBar) {
    if (pPct <= 25) {
      pBar.style.background = '#c0392b'; // red when critical
    } else if (pPct <= 50) {
      pBar.style.background = '#e67e22'; // orange when low
    } else {
      pBar.style.background = '#27ae60'; // green when healthy
    }
  }

  // Enemy
  var ePct = Math.max(0, game.enemyHP) / game.enemyMax * 100;
  var eBar = document.getElementById('enemy-bar');
  var eNum = document.getElementById('enemy-hp');
  if (eBar) eBar.style.width = ePct + '%';
  if (eNum) eNum.textContent = Math.max(0, game.enemyHP);
}

// Disable or enable all battle buttons
function setButtons(enabled) {
  var buttons = document.querySelectorAll('.battle-buttons button');
  buttons.forEach(function(btn) {
    btn.disabled = !enabled;
  });
}

// Show the dice result text on screen
function showDice(text) {
  var el = document.getElementById('dice-result');
  if (el) el.textContent = text;
}

// Check if either side has 0 HP — end the fight if so
function checkEnd() {
  if (game.enemyHP <= 0) {
    endBattle('win');
    return true;
  }
  if (game.playerHP <= 0) {
    endBattle('lose');
    return true;
  }
  return false;
}

// End the battle and show result
function endBattle(result) {
  game.isOver = true;
  setButtons(false);

  if (result === 'win') {
    addLog('');
    addLog('🏆 VICTORY! The goblin is defeated! You earn 50 XP!');
    showDice('🏆 You won!');
  } else {
    addLog('');
    addLog('💀 YOU FELL. The goblin wins this round...');
    showDice('💀 You were defeated.');
  }

  // Show restart button after a short delay
  setTimeout(function() {
    var btn = document.getElementById('restart-btn');
    if (btn) btn.style.display = 'block';
  }, 1200);
}


// =============================================
// PART 2: PLAYER TURN
//
// Called directly from onclick="" in the HTML.
// action = 'attack', 'spell', or 'dodge'
// =============================================

function playerAction(action) {
  // Stop if game is over or it's not the player's turn
  if (game.isOver) return;

  setButtons(false);          // lock buttons during enemy turn
  game.playerDodging = false; // reset dodge from last round

  var roll = rollDie(20);     // roll the d20
  showDice('🎲 You rolled a ' + roll + '!');

  // ---------- ATTACK ----------
  if (action === 'attack') {
    var attackTotal = roll + 5; // +5 is the Fighter's attack bonus

    if (roll === 20) {
      // Natural 20 = Critical Hit! Roll damage dice twice
      var dmg = rollDie(8) + rollDie(8) + 3;
      game.enemyHP -= dmg;
      addLog('Round ' + game.round + ' — 💥 CRITICAL HIT! You deal ' + dmg + ' damage!');

    } else if (attackTotal >= 15) {
      // Hit! Goblin AC is 15
      var dmg = rollDie(8) + 3; // 1d8 + strength modifier
      game.enemyHP -= dmg;
      addLog('Round ' + game.round + ' — ✅ Hit! ' + dmg + ' damage. Goblin HP: ' + Math.max(0, game.enemyHP));

    } else {
      // Miss
      addLog('Round ' + game.round + ' — ❌ Miss! Rolled ' + attackTotal + ' vs AC 15.');
    }

  // ---------- FIREBOLT SPELL ----------
  } else if (action === 'spell') {
    var spellTotal = roll + 4; // +4 spell attack bonus

    if (roll === 20) {
      var dmg = rollDie(10) + rollDie(10);
      game.enemyHP -= dmg;
      addLog('Round ' + game.round + ' — 🔥 CRITICAL SPELL! ' + dmg + ' fire damage!');

    } else if (spellTotal >= 15) {
      var dmg = rollDie(10); // 1d10 fire
      game.enemyHP -= dmg;
      addLog('Round ' + game.round + ' — 🔥 Firebolt hits! ' + dmg + ' fire damage. Goblin HP: ' + Math.max(0, game.enemyHP));

    } else {
      addLog('Round ' + game.round + ' — 💨 Firebolt fizzles. Rolled ' + spellTotal + ' vs AC 15.');
    }

  // ---------- DODGE ----------
  } else if (action === 'dodge') {
    game.playerDodging = true;
    addLog('Round ' + game.round + ' — 🛡️ You Dodge! Your AC is raised to 20 this round.');
  }

  // Sync HP bars with new numbers
  updateBars();

  // If nobody is dead yet, let the goblin attack after 1 second
  if (!checkEnd()) {
    setTimeout(enemyTurn, 1000);
  }
}


// =============================================
// PART 3: ENEMY TURN
//
// Goblin attacks automatically after the player.
// setTimeout in playerAction() calls this.
// =============================================

function enemyTurn() {
  if (game.isOver) return;

  var roll = rollDie(20);
  var attackTotal = roll + 4; // goblin's attack bonus

  // If player dodged, they're harder to hit this round
  var playerAC = game.playerDodging ? 20 : 16;

  showDice('🎲 Goblin rolled a ' + roll + '!');

  if (roll === 20) {
    // Goblin crits
    var dmg = rollDie(6) + rollDie(6) + 2;
    game.playerHP -= dmg;
    addLog('👺 Goblin CRITS! You take ' + dmg + ' damage!');

  } else if (attackTotal >= playerAC) {
    // Goblin hits
    var dmg = rollDie(6) + 2; // 1d6 + 2
    game.playerHP -= dmg;
    addLog('👺 Goblin hits! You take ' + dmg + ' damage. Your HP: ' + Math.max(0, game.playerHP));

  } else if (game.playerDodging) {
    addLog('👺 Goblin attacks — your Dodge saves you! Attack misses!');

  } else {
    addLog('👺 Goblin misses! Rolled ' + attackTotal + ' vs your AC 16.');
  }

  updateBars();

  // If fight continues, give player their turn back
  if (!checkEnd()) {
    game.round++;
    setButtons(true);
  }
}


// =============================================
// PART 4: RESTART
//
// Resets everything to starting values.
// Called by the "Play Again" button.
// =============================================

function restartBattle() {
  game.playerHP      = game.playerMax;
  game.enemyHP       = game.enemyMax;
  game.round         = 1;
  game.isOver        = false;
  game.playerDodging = false;

  updateBars();

  // Clear the log
  var log = document.getElementById('log');
  if (log) log.innerHTML = '';

  showDice('🎲 Roll to begin!');

  // Hide restart button, unlock buttons
  var restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.style.display = 'none';

  setButtons(true);
  addLog('⚔️ A new goblin appears! Round 1 — choose your action!');
}


// =============================================
// PART 5: SOUNDBOARD
//
// Buttons toggle looping audio.
// Add .mp3 files to /audio/ folder to activate.
// =============================================

var sounds  = {};   // stores Audio() objects once created
var volume  = 0.5;  // default volume (0.0 to 1.0)

var soundFiles = {
  tavern:  'audio/tavern.mp3',
  fire:    'audio/fire.mp3',
  forest:  'audio/forest.mp3',
  thunder: 'audio/thunder.mp3',
  battle:  'audio/battle.mp3',
  dungeon: 'audio/dungeon.mp3'
};

function toggleSound(button) {
  var name = button.getAttribute('data-sound');

  // Create the Audio object once
  if (!sounds[name]) {
    sounds[name] = new Audio(soundFiles[name]);
    sounds[name].loop = true;
  }

  var audio = sounds[name];

  if (button.classList.contains('active')) {
    audio.pause();
    button.classList.remove('active');
    var status = button.querySelector('.status');
    if (status) status.textContent = 'OFF';
  } else {
    audio.volume = volume;
    audio.play().catch(function() {}); // silently skip missing files
    button.classList.add('active');
    var status = button.querySelector('.status');
    if (status) status.textContent = 'ON';
  }
}

function setVolume(val) {
  volume = parseFloat(val);
  Object.values(sounds).forEach(function(a) { a.volume = volume; });
}


// =============================================
// PART 6: PAGE SETUP
//
// Runs once when the page finishes loading.
// Sets up scroll effects and initializes bars.
// =============================================

document.addEventListener('DOMContentLoaded', function() {

  // Start HP bars at full
  updateBars();

  // Darken the nav when user scrolls down
  window.addEventListener('scroll', function() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    if (window.scrollY > 50) {
      nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.8)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });

  // Card hover glow — adds a gold glow on cards when tapped on iPad
  // On desktop this is handled by CSS :hover
  // On iPad there's no hover, so we use touchstart
  document.querySelectorAll('.card, .class-card').forEach(function(card) {
    card.addEventListener('touchstart', function() {
      card.style.boxShadow = '0 0 20px rgba(201,168,76,0.4)';
    });
    card.addEventListener('touchend', function() {
      setTimeout(function() {
        card.style.boxShadow = 'none';
      }, 400);
    });
  });

});
