// Ninja Clan Wars - Competitive Card Battle Game
class NinjaClanWars {
    constructor() {
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Game state
        this.gameState = 'menu';
        this.matchStartTime = null;
        this.matchDuration = 300; // 5 minutes in seconds
        this.currentPlayer = 'player';
        
        // Chakra system
        this.playerChakra = 12;
        this.maxChakra = 12;
        this.overflowChakra = 15;
        this.chakraRegenRate = 0.5; // 1 CP every 2 seconds
        this.lastChakraUpdate = 0;
        
        // Terrain system
        this.terrains = [
            { name: 'Mountain Path', bonus: 'Taijutsu +20%', color: '#8B4513', active: true },
            { name: 'Forest Grove', bonus: 'Ninjutsu +1 CP/s', color: '#228B22', active: false },
            { name: 'River Valley', bonus: 'Genjutsu Stealth', color: '#4169E1', active: false }
        ];
        this.terrainRotationTimer = 90;
        this.lastTerrainUpdate = 0;
        
        // Battlefield (3 lanes, each with player and AI sides)
        this.battlefield = {
            mountain: { player: [], ai: [] },
            forest: { player: [], ai: [] },
            river: { player: [], ai: [] }
        };
        
        // Strongholds (need to destroy 2 of 3)
        this.playerStrongholds = 3;
        this.aiStrongholds = 3;
        
        // Card data
        this.ninjaCards = [
            {
                name: "Shadow Genin",
                school: "Ninjutsu",
                cost: 2,
                attack: 2,
                health: 2,
                ability: "Stealth: Cannot be targeted for 1 turn",
                image: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/14bac6ae-e505-4863-82a8-3d5a894c5557.png",
                rarity: "common"
            },
            {
                name: "Medical Kunoichi",
                school: "Ninjutsu",
                cost: 4,
                attack: 1,
                health: 3,
                ability: "Heal: Restore 2 health to adjacent allies",
                image: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/b63bda8d-760a-4013-ac23-51b4a1c376c2.png",
                rarity: "uncommon"
            },
            {
                name: "Earth Style Chunin",
                school: "Ninjutsu", 
                cost: 5,
                attack: 3,
                health: 4,
                ability: "Stone Wall: +2 health when placed on Mountain Path",
                image: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/5475cb72-b534-450a-a800-a830f6e9ea89.png",
                rarity: "uncommon"
            },
            {
                name: "Lightning Jonin",
                school: "Ninjutsu",
                cost: 8,
                attack: 6,
                health: 4,
                ability: "Chain Lightning: Deal 2 damage to all enemies in lane",
                image: "https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/f7b882df-e3c4-43c8-b918-3bc7608f78e0.png",
                rarity: "rare"
            }
        ];
        
        // Jutsu combos
        this.jutsuCombos = [
            {
                name: "Shadow Clone Barrage",
                schools: ["Ninjutsu", "Taijutsu"],
                cost: 6,
                effect: "Summon 2 shadow clones with combined stats"
            },
            {
                name: "Fire Dragon Tornado",
                schools: ["Ninjutsu", "Ninjutsu"],
                cost: 8,
                effect: "Deal 4 damage to all enemies, +2 if on Mountain Path"
            },
            {
                name: "Genjutsu Trap",
                schools: ["Genjutsu", "Ninjutsu"],
                cost: 7,
                effect: "Mind control enemy unit for 2 turns"
            }
        ];
        
        // Player hands
        this.playerHand = [];
        this.aiHand = [];
        
        // Game statistics
        this.stats = {
            apm: 0,
            actions: 0,
            combos: 0,
            terrainUtilization: 0,
            strongholdsDestroyed: 0
        };
        
        // Selected card and drag state
        this.selectedCard = null;
        this.draggedCard = null;
        this.selectedLane = null;
        
        // Animation and timing
        this.lastTime = 0;
        this.animationId = null;
        
        // Initialize immediately
        this.init();
    }
    
    init() {
        console.log('Initializing Ninja Clan Wars...');
        
        try {
            this.setupEventListeners();
            this.generateHands();
            this.showMainMenu();
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showMainMenu(); // Fallback to menu
        }
    }
    
    showMainMenu() {
        console.log('Showing main menu');
        
        // Hide all screens first
        const screens = ['loading', 'gameScreen', 'endScreen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) screen.classList.add('hidden');
        });
        
        // Show main menu
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.classList.remove('hidden');
        }
        
        this.gameState = 'menu';
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Use event delegation to handle dynamic elements
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Menu buttons
            if (target.id === 'trainingButton') {
                console.log('Training button clicked');
                e.preventDefault();
                this.startTrainingMatch();
            } else if (target.id === 'rankedButton') {
                console.log('Ranked button clicked');
                e.preventDefault();
                this.showMessage('Ranked battles coming soon!');
            } else if (target.id === 'tournamentButton') {
                console.log('Tournament button clicked');
                e.preventDefault();
                this.showMessage('Tournament mode coming soon!');
            } else if (target.id === 'rematchButton') {
                console.log('Rematch button clicked');
                e.preventDefault();
                this.restartGame();
            } else if (target.id === 'replayButton') {
                console.log('Replay button clicked');
                e.preventDefault();
                this.showReplay();
            }
            
            // Card selection
            if (target.closest('.ninja-card')) {
                const cardElement = target.closest('.ninja-card');
                const cardIndex = parseInt(cardElement.dataset.cardIndex);
                if (!isNaN(cardIndex)) {
                    this.selectCard(cardIndex);
                }
            }
            
            // Lane deployment
            if (target.closest('.player-side')) {
                const zone = target.closest('.player-side');
                const lane = zone.dataset.lane;
                if (lane && this.selectedCard !== null && this.canDeployCard(lane)) {
                    this.deployCard(this.selectedCard, lane, 'player');
                }
            }
            
            // Replay controls
            if (target.id && ['playPause', 'slowMotion', 'normalSpeed', 'fastForward', 'exitReplay'].includes(target.id)) {
                this.handleReplayControl(target.id);
            }
        });
        
        console.log('Event listeners setup complete');
    }
    
    generateHands() {
        this.playerHand = [];
        this.aiHand = [];
        
        // Generate balanced hands
        for (let i = 0; i < 5; i++) {
            this.playerHand.push({
                ...this.ninjaCards[Math.floor(Math.random() * this.ninjaCards.length)],
                id: `player_${i}`,
                currentHealth: null
            });
            
            this.aiHand.push({
                ...this.ninjaCards[Math.floor(Math.random() * this.ninjaCards.length)],
                id: `ai_${i}`,
                currentHealth: null
            });
        }
        
        console.log('Generated player hand:', this.playerHand);
        console.log('Generated AI hand:', this.aiHand);
    }
    
    startTrainingMatch() {
        console.log('Starting training match...');
        
        try {
            // Show loading screen immediately
            const loading = document.getElementById('loading');
            const mainMenu = document.getElementById('mainMenu');
            
            if (loading) loading.classList.remove('hidden');
            if (mainMenu) mainMenu.classList.add('hidden');
            
            // Short loading simulation, then go directly to game
            setTimeout(() => {
                console.log('Loading complete, transitioning to game...');
                this.transitionToGameScreen();
            }, 800);
            
        } catch (error) {
            console.error('Error starting training match:', error);
            this.transitionToGameScreen(); // Try to start anyway
        }
    }
    
    transitionToGameScreen() {
        console.log('Transitioning to game screen...');
        
        try {
            // Hide loading
            const loading = document.getElementById('loading');
            if (loading) loading.classList.add('hidden');
            
            // Show game screen
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen) {
                gameScreen.classList.remove('hidden');
            } else {
                console.error('Game screen element not found!');
                return;
            }
            
            // Initialize game state
            this.gameState = 'playing';
            this.matchStartTime = Date.now();
            this.currentPlayer = 'player';
            this.playerChakra = 12;
            this.playerStrongholds = 3;
            this.aiStrongholds = 3;
            
            // Reset battlefield
            this.battlefield = {
                mountain: { player: [], ai: [] },
                forest: { player: [], ai: [] },
                river: { player: [], ai: [] }
            };
            
            // Reset stats
            this.stats = {
                apm: 0,
                actions: 0,
                combos: 0,
                terrainUtilization: 0,
                strongholdsDestroyed: 0
            };
            
            // Reset terrain
            this.terrains.forEach((t, index) => t.active = index === 0);
            this.terrainRotationTimer = 90;
            
            // Setup battlefield
            this.setupBattlefield();
            
            // Render UI
            this.renderPlayerHand();
            this.updateUI();
            this.updateTerrainIndicators();
            this.updateStrongholdDisplay('player');
            this.updateStrongholdDisplay('ai');
            
            // Start game loop
            this.startGameLoop();
            
            // Show welcome message
            this.showMessage('Welcome to the battlefield! Select a ninja card to begin.');
            
            console.log('Game started successfully');
            
        } catch (error) {
            console.error('Error transitioning to game:', error);
            this.showMessage('Error starting game. Returning to menu...');
            setTimeout(() => this.showMainMenu(), 2000);
        }
    }
    
    setupBattlefield() {
        console.log('Setting up battlefield...');
        
        const battlefield = document.getElementById('battlefield');
        if (!battlefield) {
            console.error('Battlefield element not found');
            return;
        }
        
        // Create reliable 2D battlefield
        battlefield.innerHTML = `
            <div style="display: grid; grid-template-rows: repeat(3, 1fr); gap: 12px; padding: 20px; height: 100%; background: linear-gradient(135deg, rgba(50,50,50,0.8), rgba(20,40,60,0.8));">
                <div class="lane mountain-lane" data-lane="mountain">
                    <div class="lane-title">🏔️ Mountain Path - Taijutsu +20% Damage</div>
                    <div class="lane-battlefield">
                        <div class="ai-side" data-side="ai" data-lane="mountain">
                            <div class="side-label">Enemy Forces</div>
                        </div>
                        <div class="player-side" data-side="player" data-lane="mountain">
                            <div class="side-label">Deploy Zone</div>
                        </div>
                    </div>
                </div>
                <div class="lane forest-lane" data-lane="forest">
                    <div class="lane-title">🌲 Forest Grove - Ninjutsu +1 Chakra/sec</div>
                    <div class="lane-battlefield">
                        <div class="ai-side" data-side="ai" data-lane="forest">
                            <div class="side-label">Enemy Forces</div>
                        </div>
                        <div class="player-side" data-side="player" data-lane="forest">
                            <div class="side-label">Deploy Zone</div>
                        </div>
                    </div>
                </div>
                <div class="lane river-lane" data-lane="river">
                    <div class="lane-title">🌊 River Valley - Genjutsu Stealth Effects</div>
                    <div class="lane-battlefield">
                        <div class="ai-side" data-side="ai" data-lane="river">
                            <div class="side-label">Enemy Forces</div>
                        </div>
                        <div class="player-side" data-side="player" data-lane="river">
                            <div class="side-label">Deploy Zone</div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .lane {
                    background: rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 12px;
                    border: 2px solid rgba(255,255,255,0.2);
                    transition: all 0.3s ease;
                    position: relative;
                }
                .mountain-lane { 
                    border-color: #FF6B35; 
                    background: linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05));
                }
                .forest-lane { 
                    border-color: #4ECDC4; 
                    background: linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.05));
                }
                .river-lane { 
                    border-color: #6A4C93; 
                    background: linear-gradient(135deg, rgba(106,76,147,0.15), rgba(106,76,147,0.05));
                }
                .lane.active { 
                    box-shadow: 0 0 20px rgba(255,255,255,0.4);
                    transform: scale(1.02);
                }
                .lane-title {
                    text-align: center;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: white;
                    font-size: 14px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
                }
                .lane-battlefield {
                    display: grid;
                    grid-template-rows: 1fr 1fr;
                    gap: 8px;
                    height: 90px;
                }
                .ai-side, .player-side {
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    color: rgba(255,255,255,0.7);
                    min-height: 40px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .ai-side { 
                    background: linear-gradient(135deg, rgba(255,100,100,0.25), rgba(200,50,50,0.15));
                    border: 1px solid rgba(255,100,100,0.6);
                }
                .player-side { 
                    background: linear-gradient(135deg, rgba(100,200,255,0.25), rgba(50,150,255,0.15));
                    border: 2px dashed rgba(255,255,255,0.4);
                }
                .player-side:hover { 
                    background: linear-gradient(135deg, rgba(100,255,100,0.35), rgba(50,200,50,0.2));
                    border-color: #4CAF50;
                    border-style: solid;
                    transform: translateY(-2px);
                }
                .player-side.can-deploy { 
                    border-color: #4CAF50; 
                    background: linear-gradient(135deg, rgba(76,175,80,0.4), rgba(76,175,80,0.2));
                    border-style: solid;
                    box-shadow: inset 0 0 10px rgba(76,175,80,0.3);
                }
                .side-label {
                    font-weight: bold;
                    text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                }
                .deployed-card {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    right: 4px;
                    bottom: 4px;
                    background: linear-gradient(45deg, #2C3E50, #3498DB);
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 9px;
                    font-weight: bold;
                    color: white;
                    border: 2px solid #34495E;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
                    z-index: 5;
                }
                .deployed-card .card-name { 
                    font-size: 8px; 
                    margin-bottom: 2px; 
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                .deployed-card .card-stats { 
                    font-size: 7px; 
                    opacity: 0.9;
                }
            </style>
        `;
        
        console.log('2D battlefield setup complete');
    }
    
    renderPlayerHand() {
        const playerHand = document.getElementById('playerHand');
        if (!playerHand) {
            console.error('Player hand element not found');
            return;
        }
        
        playerHand.innerHTML = '';
        
        this.playerHand.forEach((card, index) => {
            if (card) {
                const cardElement = document.createElement('div');
                cardElement.className = `ninja-card school-${card.school.toLowerCase()}`;
                cardElement.dataset.cardIndex = index;
                
                // Check if player can afford this card
                const canAfford = card.cost <= this.playerChakra;
                if (!canAfford) {
                    cardElement.classList.add('disabled');
                }
                
                cardElement.innerHTML = `
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-header">${card.name}</div>
                    <img class="card-image" src="${card.image}" alt="${card.name}" loading="lazy" 
                         onerror="this.style.display='none'" />
                    <div class="card-stats">
                        <span>⚔️ ${card.attack}</span>
                        <span>❤️ ${card.health}</span>
                    </div>
                `;
                
                playerHand.appendChild(cardElement);
            }
        });
        
        console.log('Player hand rendered with', this.playerHand.filter(c => c).length, 'cards');
    }
    
    selectCard(cardIndex) {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'player') return;
        if (!this.playerHand[cardIndex]) return;
        
        const card = this.playerHand[cardIndex];
        
        // Check if player has enough chakra
        if (card.cost > this.playerChakra) {
            this.showMessage(`Need ${card.cost} chakra, have ${this.playerChakra}`);
            return;
        }
        
        console.log('Selected card:', cardIndex, card);
        
        this.selectedCard = cardIndex;
        
        // Update visual selection
        document.querySelectorAll('.ninja-card').forEach(c => c.classList.remove('selected'));
        const selectedElement = document.querySelector(`[data-card-index="${cardIndex}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
        
        // Show deployment message
        this.showMessage(`${card.name} selected - Click a lane to deploy!`);
        
        // Update deployment zones
        this.updateDeploymentZones();
    }
    
    updateDeploymentZones() {
        document.querySelectorAll('.player-side').forEach(zone => {
            const lane = zone.dataset.lane;
            if (this.selectedCard !== null && this.canDeployCard(lane)) {
                zone.classList.add('can-deploy');
            } else {
                zone.classList.remove('can-deploy');
            }
        });
    }
    
    canDeployCard(lane) {
        if (this.selectedCard === null) return false;
        
        const card = this.playerHand[this.selectedCard];
        if (!card) return false;
        
        // Check chakra cost
        if (card.cost > this.playerChakra) return false;
        
        // Check if lane has space (max 3 cards per side)
        const laneCards = this.battlefield[lane].player;
        return laneCards.length < 3;
    }
    
    deployCard(cardIndex, lane, player) {
        console.log(`Deploying card ${cardIndex} to ${lane} for ${player}`);
        
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        const card = hand[cardIndex];
        
        if (!card) return false;
        
        // Deduct chakra cost
        if (player === 'player') {
            this.playerChakra = Math.max(0, this.playerChakra - card.cost);
            this.stats.actions++;
        }
        
        // Apply terrain bonuses
        const deployedCard = { ...card };
        deployedCard.currentHealth = card.health;
        
        // Apply terrain-specific bonuses
        const activeTerrain = this.terrains.find(t => t.active);
        if (lane === 'mountain' && card.school === 'Taijutsu') {
            deployedCard.attack = Math.floor(card.attack * 1.2);
        }
        
        if (card.name === 'Earth Style Chunin' && lane === 'mountain') {
            deployedCard.currentHealth += 2;
        }
        
        // Add to battlefield
        this.battlefield[lane][player].push(deployedCard);
        
        // Remove from hand
        hand[cardIndex] = null;
        
        // Update visuals
        this.updateBattlefieldDisplay(lane, player, deployedCard);
        
        if (player === 'player') {
            this.renderPlayerHand();
            this.selectedCard = null;
            this.updateUI();
            this.updateDeploymentZones();
        }
        
        // Show deployment message
        this.showMessage(`${card.name} deployed to ${lane}!`);
        
        // Trigger abilities and combat
        setTimeout(() => {
            this.triggerCardAbilities(deployedCard, lane, player);
            this.resolveLaneCombat(lane);
            this.checkWinCondition();
            
            if (player === 'player' && this.gameState === 'playing') {
                this.switchTurn();
            }
        }, 1500);
        
        return true;
    }
    
    updateBattlefieldDisplay(lane, player, card) {
        const side = player === 'player' ? 'player' : 'ai';
        const zone = document.querySelector(`[data-side="${side}"][data-lane="${lane}"]`);
        
        if (zone) {
            const existingCards = zone.querySelectorAll('.deployed-card').length;
            
            const cardDiv = document.createElement('div');
            cardDiv.className = 'deployed-card';
            cardDiv.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-stats">${card.attack}⚔️ ${card.currentHealth}❤️</div>
            `;
            
            // Position multiple cards
            cardDiv.style.left = `${4 + existingCards * 20}px`;
            cardDiv.style.top = `${4 + existingCards * 8}px`;
            cardDiv.style.right = 'auto';
            cardDiv.style.bottom = 'auto';
            cardDiv.style.width = '70px';
            cardDiv.style.height = '32px';
            
            zone.appendChild(cardDiv);
        }
    }
    
    triggerCardAbilities(card, lane, player) {
        switch (card.name) {
            case 'Medical Kunoichi':
                this.healAdjacentAllies(card, lane, player);
                break;
            case 'Lightning Jonin':
                this.chainLightning(lane, player);
                break;
        }
    }
    
    healAdjacentAllies(card, lane, player) {
        const laneCards = this.battlefield[lane][player];
        let healed = 0;
        laneCards.forEach(ally => {
            if (ally !== card && ally.currentHealth < ally.health) {
                ally.currentHealth = Math.min(ally.health, ally.currentHealth + 2);
                healed++;
            }
        });
        if (healed > 0) {
            this.showMessage(`Medical Kunoichi healed ${healed} allies!`);
        }
    }
    
    chainLightning(lane, player) {
        const enemySide = player === 'player' ? 'ai' : 'player';
        const enemies = this.battlefield[lane][enemySide];
        
        let damaged = 0;
        enemies.forEach(enemy => {
            enemy.currentHealth -= 2;
            damaged++;
        });
        
        if (damaged > 0) {
            this.showMessage(`Chain Lightning strikes ${damaged} enemies!`);
        }
    }
    
    resolveLaneCombat(lane) {
        const playerCards = this.battlefield[lane].player.filter(c => c.currentHealth > 0);
        const aiCards = this.battlefield[lane].ai.filter(c => c.currentHealth > 0);
        
        if (playerCards.length === 0 && aiCards.length === 0) return;
        
        // Simple combat: total attack vs total health
        const playerAttack = playerCards.reduce((sum, card) => sum + card.attack, 0);
        const aiAttack = aiCards.reduce((sum, card) => sum + card.attack, 0);
        
        if (playerAttack > 0 && aiCards.length > 0) {
            // Damage AI cards
            let remainingDamage = playerAttack;
            aiCards.forEach(card => {
                const damage = Math.min(remainingDamage, card.currentHealth);
                card.currentHealth -= damage;
                remainingDamage -= damage;
            });
        }
        
        if (aiAttack > 0 && playerCards.length > 0) {
            // Damage player cards
            let remainingDamage = aiAttack;
            playerCards.forEach(card => {
                const damage = Math.min(remainingDamage, card.currentHealth);
                card.currentHealth -= damage;
                remainingDamage -= damage;
            });
        }
        
        // Remove destroyed cards and update display
        this.removeDestroyedCards(lane, 'player');
        this.removeDestroyedCards(lane, 'ai');
        
        // Check for stronghold damage
        const survivingPlayerCards = this.battlefield[lane].player.filter(c => c.currentHealth > 0);
        const survivingAiCards = this.battlefield[lane].ai.filter(c => c.currentHealth > 0);
        
        if (survivingAiCards.length === 0 && survivingPlayerCards.length > 0) {
            this.damageStrongholds('ai');
        } else if (survivingPlayerCards.length === 0 && survivingAiCards.length > 0) {
            this.damageStrongholds('player');
        }
    }
    
    removeDestroyedCards(lane, player) {
        const cards = this.battlefield[lane][player];
        for (let i = cards.length - 1; i >= 0; i--) {
            if (cards[i].currentHealth <= 0) {
                cards.splice(i, 1);
            }
        }
        
        // Update visual display
        const side = player === 'player' ? 'player' : 'ai';
        const zone = document.querySelector(`[data-side="${side}"][data-lane="${lane}"]`);
        if (zone) {
            // Clear and redraw all cards
            const deployedCards = zone.querySelectorAll('.deployed-card');
            deployedCards.forEach(card => card.remove());
            
            // Redraw remaining cards
            cards.forEach((card, index) => {
                this.updateBattlefieldDisplay(lane, player, card);
            });
        }
    }
    
    damageStrongholds(player) {
        if (player === 'player') {
            this.playerStrongholds = Math.max(0, this.playerStrongholds - 1);
            this.updateStrongholdDisplay('player');
            this.showMessage('💥 Your stronghold is under attack!');
        } else {
            this.aiStrongholds = Math.max(0, this.aiStrongholds - 1);
            this.updateStrongholdDisplay('ai');
            this.stats.strongholdsDestroyed++;
            this.showMessage('🎯 Enemy stronghold destroyed!');
        }
    }
    
    updateStrongholdDisplay(player) {
        const prefix = player === 'player' ? 'player' : 'enemy';
        for (let i = 1; i <= 3; i++) {
            const stronghold = document.getElementById(`${prefix}Stronghold${i}`);
            if (stronghold) {
                const strongholds = player === 'player' ? this.playerStrongholds : this.aiStrongholds;
                if (i > strongholds) {
                    stronghold.classList.add('destroyed');
                }
            }
        }
    }
    
    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'player' ? 'ai' : 'player';
        
        if (this.currentPlayer === 'ai') {
            this.showMessage("🤖 AI's turn...");
            setTimeout(() => this.aiTurn(), 2000);
        } else {
            this.showMessage("🥷 Your turn!");
        }
    }
    
    aiTurn() {
        if (this.gameState !== 'playing') return;
        
        // Simple AI: deploy random valid card to random valid lane
        const availableCards = this.aiHand.map((card, index) => card ? index : null).filter(i => i !== null);
        const availableLanes = ['mountain', 'forest', 'river'].filter(lane => 
            this.battlefield[lane].ai.length < 3
        );
        
        if (availableCards.length > 0 && availableLanes.length > 0) {
            const cardIndex = availableCards[Math.floor(Math.random() * availableCards.length)];
            const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            
            console.log('AI deploying card', cardIndex, 'to', lane);
            this.deployCard(cardIndex, lane, 'ai');
        } else {
            // AI passes turn
            this.showMessage("AI passes turn");
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.switchTurn();
                }
            }, 1000);
        }
    }
    
    startGameLoop() {
        if (this.gameState !== 'playing') return;
        
        const gameLoop = (currentTime) => {
            if (this.gameState !== 'playing') return;
            
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Update chakra regeneration
            this.updateChakra(deltaTime);
            
            // Update terrain rotation
            this.updateTerrainRotation(deltaTime);
            
            // Update match timer
            this.updateMatchTimer();
            
            // Update APM calculation
            this.updateAPM();
            
            // Update UI
            this.updateUI();
            
            this.animationId = requestAnimationFrame(gameLoop);
        };
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(gameLoop);
        
        console.log('Game loop started');
    }
    
    updateChakra(deltaTime) {
        if (this.currentPlayer === 'player' && this.playerChakra < this.overflowChakra) {
            this.lastChakraUpdate += deltaTime;
            
            if (this.lastChakraUpdate >= 2000) { // 2 seconds per chakra point
                this.playerChakra = Math.min(this.overflowChakra, this.playerChakra + 1);
                
                // Bonus chakra in forest terrain
                const forestActive = this.terrains.find(t => t.name === 'Forest Grove').active;
                if (forestActive) {
                    this.playerChakra = Math.min(this.overflowChakra, this.playerChakra + 1);
                }
                
                this.lastChakraUpdate = 0;
            }
        }
    }
    
    updateTerrainRotation(deltaTime) {
        this.lastTerrainUpdate += deltaTime;
        
        if (this.lastTerrainUpdate >= 1000) { // Update every second
            this.terrainRotationTimer = Math.max(0, this.terrainRotationTimer - 1);
            this.lastTerrainUpdate = 0;
            
            if (this.terrainRotationTimer <= 0) {
                this.rotateTerrain();
                this.terrainRotationTimer = 90; // Reset to 90 seconds
            }
        }
    }
    
    rotateTerrain() {
        // Rotate active terrain
        const currentActiveIndex = this.terrains.findIndex(t => t.active);
        this.terrains[currentActiveIndex].active = false;
        
        const nextIndex = (currentActiveIndex + 1) % this.terrains.length;
        this.terrains[nextIndex].active = true;
        
        this.showMessage(`🔄 Terrain shifted to ${this.terrains[nextIndex].name}!`);
        this.updateTerrainIndicators();
        this.updateLaneStyles();
    }
    
    updateTerrainIndicators() {
        const labels = ['mountain', 'forest', 'river'];
        labels.forEach((label, index) => {
            const indicator = document.querySelector(`#${label}Label .terrain-indicator`);
            if (indicator) {
                if (this.terrains[index].active) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            }
        });
    }
    
    updateLaneStyles() {
        const lanes = document.querySelectorAll('.lane');
        lanes.forEach((lane, index) => {
            if (this.terrains[index].active) {
                lane.classList.add('active');
            } else {
                lane.classList.remove('active');
            }
        });
    }
    
    updateMatchTimer() {
        if (!this.matchStartTime) return;
        
        const elapsed = Math.floor((Date.now() - this.matchStartTime) / 1000);
        const remaining = Math.max(0, this.matchDuration - elapsed);
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        const timerElement = document.getElementById('matchTimer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (remaining <= 0) {
            this.endGame('timeout');
        }
    }
    
    updateAPM() {
        if (!this.matchStartTime) return;
        
        const elapsed = (Date.now() - this.matchStartTime) / 1000 / 60; // minutes
        this.stats.apm = elapsed > 0 ? Math.round(this.stats.actions / elapsed) : 0;
    }
    
    updateUI() {
        // Update chakra display
        const currentChakra = document.getElementById('currentChakra');
        const chakraFill = document.getElementById('chakraFill');
        const chakraOverflow = document.getElementById('chakraOverflow');
        
        if (currentChakra) currentChakra.textContent = this.playerChakra;
        
        if (chakraFill) {
            const basePercentage = Math.min(100, (Math.min(this.playerChakra, this.maxChakra) / this.maxChakra) * 100);
            chakraFill.style.height = `${basePercentage}%`;
        }
        
        if (chakraOverflow) {
            if (this.playerChakra > this.maxChakra) {
                const overflowPercentage = ((this.playerChakra - this.maxChakra) / (this.overflowChakra - this.maxChakra)) * 100;
                chakraOverflow.style.height = `${overflowPercentage}%`;
                chakraOverflow.classList.add('active');
            } else {
                chakraOverflow.style.height = '0%';
                chakraOverflow.classList.remove('active');
            }
        }
        
        // Update stats
        const apmDisplay = document.getElementById('apmDisplay');
        const comboCount = document.getElementById('comboCount');
        const terrainTimer = document.getElementById('terrainTimer');
        
        if (apmDisplay) apmDisplay.textContent = this.stats.apm;
        if (comboCount) comboCount.textContent = this.stats.combos;
        if (terrainTimer) terrainTimer.textContent = `${this.terrainRotationTimer}s`;
    }
    
    checkWinCondition() {
        if (this.playerStrongholds <= 1) {
            this.endGame('defeat');
        } else if (this.aiStrongholds <= 1) {
            this.endGame('victory');
        }
    }
    
    endGame(result) {
        console.log('Game ended:', result);
        this.gameState = 'ended';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Calculate final stats
        this.stats.terrainUtilization = Math.min(100, Math.round((this.stats.actions / 15) * 100));
        
        setTimeout(() => {
            const gameScreen = document.getElementById('gameScreen');
            const endScreen = document.getElementById('endScreen');
            const endTitle = document.getElementById('endTitle');
            
            if (gameScreen) gameScreen.classList.add('hidden');
            if (endScreen) endScreen.classList.remove('hidden');
            
            if (endTitle) {
                if (result === 'victory') {
                    endTitle.textContent = '🎉 Victory!';
                    endTitle.style.color = 'var(--color-success)';
                } else if (result === 'defeat') {
                    endTitle.textContent = '💀 Defeat!';
                    endTitle.style.color = 'var(--color-error)';
                } else {
                    endTitle.textContent = '⏰ Time Out!';
                    endTitle.style.color = 'var(--color-warning)';
                }
            }
            
            // Update final stats
            this.updateFinalStats();
            
        }, 1000);
    }
    
    updateFinalStats() {
        const finalAPM = document.getElementById('finalAPM');
        const finalCombos = document.getElementById('finalCombos');
        const terrainUtil = document.getElementById('terrainUtil');
        const strongholdsDestroyed = document.getElementById('strongholdsDestroyed');
        
        if (finalAPM) finalAPM.textContent = this.stats.apm;
        if (finalCombos) finalCombos.textContent = this.stats.combos;
        if (terrainUtil) terrainUtil.textContent = `${this.stats.terrainUtilization}%`;
        if (strongholdsDestroyed) strongholdsDestroyed.textContent = this.stats.strongholdsDestroyed;
    }
    
    showMessage(message) {
        console.log('Message:', message);
        const combatText = document.getElementById('combatText');
        const combatMessage = document.getElementById('combatMessage');
        
        if (combatText && combatMessage) {
            combatText.textContent = message;
            combatMessage.classList.remove('hidden');
            
            setTimeout(() => {
                combatMessage.classList.add('hidden');
            }, 2500);
        }
    }
    
    showReplay() {
        const replayControls = document.getElementById('replayControls');
        if (replayControls) {
            replayControls.classList.remove('hidden');
        }
        this.showMessage('🎬 Replay system activated - match analysis available');
    }
    
    handleReplayControl(action) {
        console.log('Replay control:', action);
        
        switch (action) {
            case 'exitReplay':
                const replayControls = document.getElementById('replayControls');
                if (replayControls) replayControls.classList.add('hidden');
                break;
            case 'playPause':
                this.showMessage('⏸️ Replay paused');
                break;
            case 'slowMotion':
                this.showMessage('🐌 Slow motion activated');
                break;
            case 'normalSpeed':
                this.showMessage('▶️ Normal speed');
                break;
            case 'fastForward':
                this.showMessage('⏩ Fast forward');
                break;
        }
    }
    
    restartGame() {
        console.log('Restarting game...');
        
        // Cancel animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Reset all game state
        this.gameState = 'menu';
        this.playerChakra = 12;
        this.playerStrongholds = 3;
        this.aiStrongholds = 3;
        this.selectedCard = null;
        this.terrainRotationTimer = 90;
        this.lastTime = 0;
        this.lastChakraUpdate = 0;
        this.lastTerrainUpdate = 0;
        this.matchStartTime = null;
        
        // Reset battlefield
        this.battlefield = {
            mountain: { player: [], ai: [] },
            forest: { player: [], ai: [] },
            river: { player: [], ai: [] }
        };
        
        // Reset stats
        this.stats = {
            apm: 0,
            actions: 0,
            combos: 0,
            terrainUtilization: 0,
            strongholdsDestroyed: 0
        };
        
        // Reset terrain
        this.terrains.forEach((t, index) => t.active = index === 0);
        
        // Generate new hands
        this.generateHands();
        
        // Return to main menu
        this.showMainMenu();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Ninja Clan Wars...');
    
    try {
        window.game = new NinjaClanWars();
        console.log('Ninja Clan Wars initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Fallback: show main menu anyway
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.classList.remove('hidden');
        }
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
});