window.onload = function () {
    document.body.classList.add('athlete-bg');
    fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba')
        .then(response => response.json())
        .then(data => {
            const year = data.season.year;
            const urlParams = new URLSearchParams(window.location.search);
            const athleteId = urlParams.get('athleteId');
            if (athleteId) {
                showAthlete(athleteId, year);
            }
        });
};

function showAthlete(athleteId, year) {
    fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/athletes/${athleteId}?lang=en&region=us`)
        .then(response => response.json())
        .then(athlete => {
            let draftTeam;
            if (athlete.draft) {
                let draft = athlete.draft;

                fetch(draft.team.$ref)
                    .then(response => response.json())
                    .then(team => {
                        draftTeam = team;

                        let currentTeam;
                        fetch(athlete.team.$ref)
                            .then(response => response.json())
                            .then(team => {
                                currentTeam = team;

                                let athleteDetails = document.getElementById('athlete-details');
                                athleteDetails.innerHTML = `
                            <div class="container py-4 d-flex flex-column justify-content-center align-items-center min-vh-100">
                                <div class="row justify-content-center align-items-stretch w-100">
                                    <div class="col-md-4 mb-4 mb-md-0 d-flex justify-content-center align-items-stretch">
                                        <div class="card shadow h-100 w-100 athlete-card">
                                            <img src="${athlete.headshot?.href || 'https://placehold.co/340x440'}" class="card-img-top" alt="${athlete.displayName}" style="width: 100%; height: 440px; object-fit: cover; border-radius: 0.5rem 0.5rem 0 0;">
                                            <div class="card-body text-center">
                                                <h2 class="card-title mb-0">${athlete.displayName || ''} <span class="text-muted">#${athlete.jersey || ''}</span></h2>
                                                <small class="text-muted">${athlete.position?.displayName || ''}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-7 d-flex align-items-stretch">
                                        <div class="card shadow-sm h-100 w-100 athlete-card">
                                            <div class="card-body">
                                                <h3 class="card-title mb-3">${athlete.fullName || ''}</h3>
                                                <ul class="list-group list-group-flush">
                                                    <li class="list-group-item"><strong>Date of Birth:</strong> ${athlete.dateOfBirth ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(athlete.dateOfBirth)) : 'N/A'}${athlete.age ? ` (${athlete.age} years)` : ''}</li>
                                                    <li class="list-group-item"><strong>Birth Place:</strong> ${athlete.birthPlace?.city || ''}${athlete.birthPlace?.country ? ', ' + athlete.birthPlace.country : ''}</li>
                                                    <li class="list-group-item"><strong>Citizenship:</strong> ${athlete.citizenship || 'N/A'}</li>
                                                    <li class="list-group-item"><strong>Height:</strong> ${athlete.height ? ((athlete.height * 2.54) / 100).toFixed(2) + ' m' : 'N/A'}</li>
                                                    <li class="list-group-item"><strong>Weight:</strong> ${athlete.weight ? (athlete.weight * 0.45359237).toFixed(1) + ' kg' : 'N/A'}</li>
                                                    <li class="list-group-item"><strong>Team:</strong> ${currentTeam?.displayName || 'N/A'}</li>
                                                    <li class="list-group-item"><strong>Draft:</strong> ${athlete.draft
                                        ? `${athlete.draft.year || ''} - Round ${athlete.draft.round || ''} - Pick ${athlete.draft.selection || ''} (${draftTeam?.displayName || ''})`
                                        : 'N/A'
                                    }</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row mt-4 w-100" id="stats-row"></div>
                            </div>
                        `;

                                // Fetch statistics and insert in the stats-row
                                if (athlete.statistics && athlete.statistics.$ref) {
                                    fetch(athlete.statistics.$ref)
                                        .then(response => response.json())
                                        .then(stats => {
                                            const categories = stats.splits?.categories || [];
                                            function getStat(catName, statName) {
                                                const cat = categories.find(c => c.name === catName);
                                                if (!cat) return null;
                                                return cat.stats.find(s => s.name === statName) || null;
                                            }
                                            const avgPoints = getStat('offensive', 'avgPoints');
                                            const avgAssists = getStat('offensive', 'avgAssists');
                                            const avgRebounds = getStat('general', 'avgRebounds');
                                            const avgBlocks = getStat('defensive', 'avgBlocks');
                                            const avgSteals = getStat('defensive', 'avgSteals');
                                            const avgTurnovers = getStat('offensive', 'avgTurnovers');
                                            const fieldGoalPct = getStat('offensive', 'fieldGoalPct');
                                            const threePointPct = getStat('offensive', 'threePointPct');
                                            const freeThrowPct = getStat('offensive', 'freeThrowPct');
                                            const gamesPlayed = getStat('general', 'gamesPlayed');

                                            let statInfo = {
                                                'GP': 'Games Played',
                                                'PPG': 'Points Per Game',
                                                'RPG': 'Rebounds Per Game',
                                                'APG': 'Assists Per Game',
                                                'BPG': 'Blocks Per Game',
                                                'SPG': 'Steals Per Game',
                                                'TPG': 'Turnovers Per Game',
                                                'FG%': 'Field Goal Percentage',
                                                '3P%': 'Three Point Percentage',
                                                'FT%': 'Free Throw Percentage'
                                            };

                                            let statsHtml = `
                                        <div class="col-12 d-flex justify-content-center">
                                            <div class="card stats-card shadow" style="margin: 10px 0; min-width: 320px; max-width: 700px; width: 100%;">
                                                <div class="card-body">
                                                    <h4 class="card-title text-center">Season Stats (${year})</h4>
                                                    <div class="table-responsive">
                                                        <table class="table table-bordered text-center mb-0">
                                                            <thead class="thead-light">
                                                                <tr>
                                                                    <th title="${statInfo['GP']}">GP</th>
                                                                    <th title="${statInfo['PPG']}">PPG</th>
                                                                    <th title="${statInfo['RPG']}">RPG</th>
                                                                    <th title="${statInfo['APG']}">APG</th>
                                                                    <th title="${statInfo['BPG']}">BPG</th>
                                                                    <th title="${statInfo['SPG']}">SPG</th>
                                                                    <th title="${statInfo['TPG']}">TPG</th>
                                                                    <th title="${statInfo['FG%']}">FG%</th>
                                                                    <th title="${statInfo['3P%']}">3P%</th>
                                                                    <th title="${statInfo['FT%']}">FT%</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>${gamesPlayed?.displayValue || 'N/A'}</td>
                                                                    <td>${avgPoints?.displayValue || 'N/A'}</td>
                                                                    <td>${avgRebounds?.displayValue || 'N/A'}</td>
                                                                    <td>${avgAssists?.displayValue || 'N/A'}</td>
                                                                    <td>${avgBlocks?.displayValue || 'N/A'}</td>
                                                                    <td>${avgSteals?.displayValue || 'N/A'}</td>
                                                                    <td>${avgTurnovers?.displayValue || 'N/A'}</td>
                                                                    <td>${fieldGoalPct?.displayValue || 'N/A'}</td>
                                                                    <td>${threePointPct?.displayValue || 'N/A'}</td>
                                                                    <td>${freeThrowPct?.displayValue || 'N/A'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div class="card-footer text-center bg-white border-0">
                                                    <a href="./stats.html?athleteId=${athleteId}" class="btn btn-outline-secondary rounded-pill px-4 py-2" style="font-weight: 500; font-size: 1.05rem; box-shadow: none; transition: background 0.2s;">
                                                        View Full Stats
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                            document.getElementById('stats-row').innerHTML = statsHtml;
                                        });
                                }
                            });


                    });
            }
        });
}
