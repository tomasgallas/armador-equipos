(() => {
  const textarea = document.getElementById('inputList');
  const btnGenerateTeams = document.getElementById('btnGenerateTeams');
  const btnReshuffle = document.getElementById('btnReshuffle');
  const teamsContainer = document.getElementById('teamsContainer');
  const warning = document.getElementById('warning');

  let teams = { team1: [], team2: [] };

  function splitTeams(players) {
    const shuffled = players.sort(() => Math.random() - 0.5);
    const half = Math.ceil(players.length / 2); // Usamos Math.ceil para manejar impares
    return { team1: shuffled.slice(0, half), team2: shuffled.slice(half) };
  }

  function render() {
    warning.textContent = '';
    warning.className = 'fw-bold mt-3'; // Resetea la clase de la advertencia

    // Se agrega la clase 'teams-enter' para la animación de entrada
    // Se agrega un ícono de camiseta a cada jugador
    teamsContainer.innerHTML =
      `<div class="col-md-6 teams-enter">
        <div class="team-box">
          <h5><i class="bi bi-shield-shaded"></i> Equipo 1</h5>
          <ul id="list1" class="list-group list-group-flush">
            ${teams.team1.map(p => `<li class="list-group-item"><i class="bi bi-tshirt-fill me-2"></i>${p}</li>`).join('')}
          </ul>
        </div>
      </div>` +
      `<div class="col-md-6 teams-enter" style="animation-delay: 0.1s;">
        <div class="team-box">
          <h5><i class="bi bi-shield-shaded"></i> Equipo 2</h5>
          <ul id="list2" class="list-group list-group-flush">
            ${teams.team2.map(p => `<li class="list-group-item"><i class="bi bi-tshirt-fill me-2"></i>${p}</li>`).join('')}
          </ul>
        </div>
      </div>`;

    // Añadir listener de swap
    ['list1', 'list2'].forEach(id => {
      document.getElementById(id).querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', () => {
          const from = id === 'list1' ? 'team1' : 'team2';
          const to = from === 'team1' ? 'team2' : 'team1';
          // Extraer solo el nombre, ignorando el ícono
          const name = item.textContent.trim();
          teams[from] = teams[from].filter(p => p !== name);
          teams[to].push(name);
          render();
        });
      });
    });
    
    // Check balance
    const count1 = teams.team1.length;
    const count2 = teams.team2.length;
    if (count1 !== count2) {
      warning.textContent = '¡Cuidado! Los equipos no están balanceados.';
      warning.className = 'warning-text fw-bold mt-3'; // Aplica el estilo de advertencia
    }
  }
  
  btnGenerateTeams.addEventListener('click', () => {
    // Se extrae el nombre ignorando el "1. " al inicio.
    const lines = textarea.value.trim().split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    
    // Permitimos equipos impares, pero mostramos advertencia
    if (lines.length < 2 || lines.length > 22) {
      return alert('La cantidad de jugadores debe ser entre 2 y 22.');
    }
    
    teams = splitTeams(lines);
    render();
    btnReshuffle.disabled = false;
  });

  btnReshuffle.addEventListener('click', () => {
    if (teams.team1.length === 0 && teams.team2.length === 0) return;
    const allPlayers = [...teams.team1, ...teams.team2];
    teams = splitTeams(allPlayers);
    render();
  });
})();