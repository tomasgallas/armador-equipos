(() => {
  // --- ELEMENTOS DEL DOM ---
  const settingsContainer = document.getElementById('settingsContainer');
  const gkSelectionContainer = document.getElementById('gkSelectionContainer');
  const teamsContainer = document.getElementById('teamsContainer');
  const warning = document.getElementById('warning');

  const textarea = document.getElementById('inputList');
  const teamCountSelector = document.getElementById('teamCount');
  const inputPlace = document.getElementById('inputPlace');
  const inputDate = document.getElementById('inputDate');
  const inputCost = document.getElementById('inputCost');
  
  const btnGenerateTeams = document.getElementById('btnGenerateTeams');
  const btnReshuffle = document.getElementById('btnReshuffle');
  const btnConfirmGK = document.getElementById('btnConfirmGK');
  
  const playerCardsContainer = document.getElementById('playerCardsContainer');

  // --- ESTADO DE LA APLICACIÓN ---
  let allPlayers = [];
  let selectedGoalkeepers = [];
  let treasurer = '';
  let teams = {};
  let finalGoalkeepersUsed = [];
  let playerToSwap = null; // { name: '...', fromTeam: 'team1' }
  
  // --- LÓGICA DE EQUIPOS ---

  function splitTeams(players, numTeams, userSelectedGoalkeepers) {
    let fieldPlayers = players.filter(p => !userSelectedGoalkeepers.includes(p));
    let finalGoalkeepers = [...userSelectedGoalkeepers];

    const neededGKs = numTeams - finalGoalkeepers.length;
    if (neededGKs > 0) {
      const fieldPlayersShuffled = fieldPlayers.sort(() => Math.random() - 0.5);
      const newGKs = fieldPlayersShuffled.splice(0, neededGKs);
      finalGoalkeepers.push(...newGKs);
      fieldPlayers = fieldPlayersShuffled;
    }
    
    const shuffledGoalkeepers = finalGoalkeepers.sort(() => Math.random() - 0.5);
    const shuffledFieldPlayers = fieldPlayers.sort(() => Math.random() - 0.5);
    
    const newTeams = {};
    for (let i = 0; i < numTeams; i++) {
      newTeams[`team${i + 1}`] = [];
    }

    shuffledGoalkeepers.forEach((gk, index) => {
      if (index < numTeams) newTeams[`team${index + 1}`].push(gk);
    });
    
    shuffledFieldPlayers.forEach((player, index) => {
      const teamIndex = index % numTeams;
      newTeams[`team${teamIndex + 1}`].push(player);
    });
    
    return { teams: newTeams, finalGoalkeepers: finalGoalkeepers };
  }

  function selectTreasurer(players) {
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
  }

  // --- MANEJO DE EVENTOS ---
  
  function handlePlayerClick(e) {
    const playerName = e.currentTarget.dataset.player;
    const teamName = e.currentTarget.dataset.team;

    if (!playerToSwap) {
      // 1. Primer clic: Seleccionar jugador para cambiar
      playerToSwap = { name: playerName, fromTeam: teamName };
      renderFinalTeams(); // Re-renderizar para mostrar el jugador seleccionado
    } else {
      // 2. Segundo clic: Realizar el intercambio
      if (playerToSwap.fromTeam === teamName) {
        // Si se hace clic en el mismo equipo, se deselecciona
        playerToSwap = null;
      } else {
        // Intercambiar jugadores
        // Quitar jugadores de sus equipos originales
        teams[playerToSwap.fromTeam] = teams[playerToSwap.fromTeam].filter(p => p !== playerToSwap.name);
        teams[teamName] = teams[teamName].filter(p => p !== playerName);
        
        // Agregar jugadores a sus nuevos equipos
        teams[playerToSwap.fromTeam].push(playerName);
        teams[teamName].push(playerToSwap.name);
        
        playerToSwap = null; // Resetear
      }
      renderFinalTeams(); // Re-renderizar para mostrar el cambio
    }
  }

  // --- RENDERIZADO Y MANEJO DE VISTAS ---

  function showView(view) {
    settingsContainer.style.display = 'none';
    gkSelectionContainer.style.display = 'none';
    teamsContainer.style.display = 'none';
    warning.textContent = '';
    
    if (view === 'settings') settingsContainer.style.display = 'block';
    if (view === 'gkSelection') gkSelectionContainer.style.display = 'block';
    if (view === 'teams') teamsContainer.style.display = 'block';
  }

  function renderPlayerCards() {
    playerCardsContainer.innerHTML = '';
    const numTeams = parseInt(teamCountSelector.value, 10);
    warning.className = 'fw-bold mt-3'; 

    allPlayers.forEach(player => {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'col-6 col-md-4 col-lg-3';
      const card = document.createElement('div');
      card.className = `player-card ${selectedGoalkeepers.includes(player) ? 'selected' : ''}`;
      card.dataset.player = player;
      card.textContent = player;
      
      card.addEventListener('click', (e) => {
        const playerName = e.target.dataset.player;
        warning.textContent = ''; 
        warning.className = 'fw-bold mt-3';

        if (selectedGoalkeepers.includes(playerName)) {
          selectedGoalkeepers = selectedGoalkeepers.filter(p => p !== playerName);
          e.target.classList.remove('selected');
        } else {
          if (selectedGoalkeepers.length < numTeams) {
            selectedGoalkeepers.push(playerName);
            e.target.classList.add('selected');
          } else {
            warning.textContent = `Ya has seleccionado el máximo de ${numTeams} arqueros.`;
            warning.className = 'warning-text fw-bold mt-3';
          }
        }
      });
      cardWrapper.appendChild(card);
      playerCardsContainer.appendChild(cardWrapper);
    });
  }
  
  function renderFinalTeams() {
    // LAYOUT FIX: Generar el contenedor de la fila aquí
    const numTeams = Object.keys(teams).length;
    let colClass = 'col-6';
    if (numTeams === 3) colClass = 'col-4';
    else if (numTeams === 4) colClass = 'col-3';

    const teamsHtml = Object.keys(teams).map((teamKey, index) => {
      const teamNumber = index + 1;
      const teamPlayers = teams[teamKey].sort((a,b) => a.localeCompare(b));
      
      return `
        <div class="${colClass} teams-enter" style="animation-delay: ${index * 0.1}s;">
          <div class="team-box">
            <h5><i class="bi bi-shield-shaded"></i> Equipo ${teamNumber}</h5>
            <ul class="list-group list-group-flush">
              ${teamPlayers.map(player => {
                const isTreasurer = player === treasurer;
                const isGoalkeeper = finalGoalkeepersUsed.includes(player);
                const isSelectedForSwap = playerToSwap && playerToSwap.name === player;

                const treasurerStyle = isTreasurer ? 'color: var(--primary-accent); font-weight: 700;' : '';
                const icon = isGoalkeeper ? 'bi-sunglasses' : 'bi-tshirt-fill';
                const swapClass = isSelectedForSwap ? 'swap-selected' : '';
                
                return `<li class="list-group-item ${swapClass}" data-player="${player}" data-team="${teamKey}" style="${treasurerStyle}"><i class="bi ${icon} me-2"></i>${player}</li>`;
              }).join('')}
            </ul>
          </div>
        </div>`;
    }).join('');

    // Encabezado del partido
    const totalCost = parseFloat(inputCost.value);
    const numPlayers = allPlayers.length;
    let costDetails = '';
    if (totalCost > 0 && numPlayers > 0) {
        const costPerPlayer = totalCost / numPlayers;
        costDetails = `$${totalCost} en total ($${Math.round(costPerPlayer)} por jugador)`;
    } else if (inputCost.value) {
        costDetails = inputCost.value;
    }
    const matchHeader = `
      <div class="col-12 text-center mb-4">
        <h2 class="text-light">${inputPlace.value || 'Lugar no especificado'}</h2>
        <h4 class="text-light">${inputDate.value || 'Fecha no especificada'}</h4>
        <p class="text-light">${costDetails}</p>
        <h5 class="mt-3" style="color: var(--primary-accent);">
          <i class="bi bi-coin"></i> Encargado de cobrar: ${treasurer}
        </h5>
      </div>
    `;

    // Unir todo y mostrarlo
    teamsContainer.innerHTML = matchHeader + `<div class="row g-3 g-lg-4">${teamsHtml}</div>`;
    
    // Agregar event listeners para el intercambio
    document.querySelectorAll('.list-group-item').forEach(item => {
      item.addEventListener('click', handlePlayerClick);
    });

    showView('teams');
  }

  // --- MANEJADORES DE EVENTOS PRINCIPALES ---

  btnGenerateTeams.addEventListener('click', () => {
    warning.textContent = '';
    warning.className = 'fw-bold mt-3';
    const lines = textarea.value.trim().split('\n').map(l => l.replace(/^\d+\.\s*|\s*;\s*$/g, '').trim()).filter(Boolean);
    const numTeams = parseInt(teamCountSelector.value, 10);

    if (lines.length === 0) {
        warning.textContent = 'Por favor, ingresa la lista de jugadores.';
        warning.className = 'warning-text fw-bold mt-3';
        return;
    }
    if (lines.length < numTeams) {
        warning.textContent = `Necesitas al menos ${numTeams} jugadores para formar ${numTeams} equipos.`;
        warning.className = 'warning-text fw-bold mt-3';
        return;
    }
    if (lines.length % numTeams !== 0) {
      warning.textContent = `La cantidad de jugadores (${lines.length}) no es divisible por ${numTeams} equipos. Ajusta la lista o la cantidad de equipos.`;
      warning.className = 'warning-text fw-bold mt-3';
      return; 
    }
    
    allPlayers = [...new Set(lines)];
    if(allPlayers.length !== lines.length){
      warning.textContent = 'Se han eliminado jugadores duplicados de la lista.';
      warning.className = 'warning-text fw-bold mt-3';
    }

    selectedGoalkeepers = [];
    playerToSwap = null; // Resetear swap al generar nuevos equipos
    renderPlayerCards();
    showView('gkSelection');
    btnReshuffle.disabled = true; // Deshabilitar reshuffle hasta confirmar equipos
  });

  btnConfirmGK.addEventListener('click', () => {
    treasurer = selectTreasurer(allPlayers);
    const splitResult = splitTeams(allPlayers, parseInt(teamCountSelector.value, 10), selectedGoalkeepers);
    teams = splitResult.teams;
    finalGoalkeepersUsed = splitResult.finalGoalkeepers;
    renderFinalTeams();
    btnReshuffle.disabled = false;
  });

  btnReshuffle.addEventListener('click', () => {
    if (allPlayers.length === 0) return;
    treasurer = selectTreasurer(allPlayers);
    const splitResult = splitTeams(allPlayers, parseInt(teamCountSelector.value, 10), selectedGoalkeepers);
    teams = splitResult.teams;
    finalGoalkeepersUsed = splitResult.finalGoalkeepers;
    playerToSwap = null; // Resetear swap al mezclar
    renderFinalTeams();
  });
  
  // Inicializar vista al cargar la página
  showView('settings');

})();
