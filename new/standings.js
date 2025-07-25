window.onload = () => {
    const currentYear = new Date().getFullYear();
    const seasonYear = currentYear + (new Date().getMonth() >= 9 ? 1 : 0);
    const tbody = document.getElementById('standings-body');
    const tabButtons = document.querySelectorAll('.tab-btn');

    async function fetchStandings(groupId) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Loading...</td></tr>`;
        const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${seasonYear}/types/2/groups/${groupId}/standings/0?lang=en&region=us`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.standings || data.standings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center">No standings data available.</td></tr>`;
                return;
            }

            // Fetch team data with logos
            const teamsWithLogos = await Promise.all(data.standings.map(async (entry) => {
                try {
                    const teamRes = await fetch(entry.team.$ref);
                    const teamData = await teamRes.json();
                    return { ...entry, teamData };
                } catch {
                    return { ...entry, teamData: null };
                }
            }));

            // Sort by win%
            const sorted = teamsWithLogos.slice().sort((a, b) => {
                const aRecord = a.records.find(r => r.id === "0");
                const bRecord = b.records.find(r => r.id === "0");
                if (!aRecord || !bRecord) return 0;
                return bRecord.value - aRecord.value;
            });

            const rows = sorted.map((entry, index) => {
                const team = entry.teamData || {};
                const overall = entry.records.find(r => r.id === "0");
                const home = entry.records.find(r => r.name === "Home");
                const road = entry.records.find(r => r.name === "Road");

                if (!overall) return '';

                const stats = overall.stats.reduce((acc, stat) => {
                    acc[stat.name] = stat.value;
                    return acc;
                }, {});

                const wins = stats.wins ?? '-';
                const losses = stats.losses ?? '-';
                const winPct = overall.value !== undefined ? (overall.value * 100).toFixed(1) + '%' : '-';

                const streakVal = stats.streak ?? 0;
                const streak = streakVal > 0 ? `W${streakVal}` : streakVal < 0 ? `L${Math.abs(streakVal)}` : '-';

                const homeRecord = home ? home.summary : '-';
                const roadRecord = road ? road.summary : '-';

                const teamName = team.displayName || 'Unknown Team';
                const logoUrl = (team.logos && team.logos.length > 0) ? team.logos[0].href : '';

                return `
          <tr>
            <td>${index + 1}</td>
            <td class="text-left d-flex align-items-center team-cell" data-teamid="${team.id}" style="cursor:pointer;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${teamName}" class="team-logo me-2" style="width:30px; height:30px;" />` : ''}
            ${teamName}
            </td>

            <td>${wins}</td>
            <td>${losses}</td>
            <td>${winPct}</td>
            <td>${homeRecord}</td>
            <td>${roadRecord}</td>
            <td>${streak}</td>
          </tr>
        `;
            }).join('');

            tbody.innerHTML = rows || `<tr><td colspan="8" class="text-center">No valid standings data found.</td></tr>`;

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load standings data.</td></tr>`;
            console.error(err);
        }
    }

    // Delegazione evento per click su team-cell
    tbody.addEventListener('click', (event) => {
        let target = event.target;
        while (target && target !== tbody) {
            if (target.classList && target.classList.contains('team-cell')) {
                const teamId = target.dataset.teamid;
                if (teamId) {
                    window.location.href = `./team.html?teamId=${teamId}`;
                }
                break;
            }
            target = target.parentNode;
        }
    });

    // Gestione cambio tab e caricamento dati
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('btn-primary', 'active'));
            tabButtons.forEach(b => b.classList.add('btn-outline-primary'));
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-primary', 'active');

            fetchStandings(btn.dataset.group);
        });
    });

    fetchStandings(5); // Default: East

    // Set initial active tab styling
    tabButtons.forEach(btn => {
        if (btn.dataset.group === '5') {
            btn.classList.add('btn-primary', 'active');
            btn.classList.remove('btn-outline-primary');
        } else {
            btn.classList.remove('btn-primary', 'active');
            btn.classList.add('btn-outline-primary');
        }
    });
};
