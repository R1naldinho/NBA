document.addEventListener('DOMContentLoaded', () => {
    const eventDetailsDiv = document.getElementById('event-details');

    const urlParams = new URLSearchParams(window.location.search);
    const id_event = urlParams.get('idEvent');

    fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/${id_event}?lang=en&region=us`)
        .then(response => response.json())
        .then(data => {
            const homeTeamRef = data.competitions[0].competitors.find(c => c.homeAway === 'home').team.$ref.replace('http:', 'https:');
            const awayTeamRef = data.competitions[0].competitors.find(c => c.homeAway === 'away').team.$ref.replace('http:', 'https:');

            Promise.all([fetch(homeTeamRef).then(res => res.json()), fetch(awayTeamRef).then(res => res.json())])
                .then(([homeTeam, awayTeam]) => {
                    const eventHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="text-align: center;">
                                <img src="${awayTeam.logos[0].href}" alt="${awayTeam.abbreviation}" style="width: 80px; height: auto;">
                                <div>${awayTeam.abbreviation}</div>
                                <div id="awayTeam_record" style="font-size: smaller;"></div>
                            </div>
                            <div style="text-align: center;">
                                <h4 id="awayTeam_score" style="font-size: larger; display: inline;"></h4>
                                -
                                <h4 id="homeTeam_score" style="font-size: larger; display: inline;"></h4>
                            </div>
                            <div style="text-align: center;">
                                <img src="${homeTeam.logos[0].href}" alt="${homeTeam.abbreviation}" style="width: 80px; height: auto;">
                                <div>${homeTeam.abbreviation}</div>
                                <div id="homeTeam_record" style="font-size: smaller;"></div>
                            </div>
                        </div>
                        <hr>
                        <p style="margin-top: 20px">Date: ${new Date(data.date).toLocaleDateString('en-GB')} ${new Date(data.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                        <div id="menu" style="margin-top: 20px;">
                            <ul class="nav nav-tabs" id="teamTabs" role="tablist" style="width: 100%; display: flex;">
                                <li class="nav-item" role="presentation" style="flex: 1;">
                                    <button class="nav-link active" id="results-tab" data-bs-toggle="tab" data-bs-target="#results" type="button" role="tab" aria-controls="results" aria-selected="false" style="width: 100%;">Results</button>
                                </li>
                                <li class="nav-item" role="presentation" style="flex: 1;">
                                    <button class="nav-link" id="away-team-tab" data-bs-toggle="tab" data-bs-target="#away-team" type="button" role="tab" aria-controls="away-team" aria-selected="false" style="width: 100%;">${awayTeam.abbreviation}</button>
                                </li>
                                <li class="nav-item" role="presentation" style="flex: 1;">
                                    <button class="nav-link" id="home-team-tab" data-bs-toggle="tab" data-bs-target="#home-team" type="button" role="tab" aria-controls="home-team" aria-selected="true" style="width: 100%;">${homeTeam.abbreviation}</button>
                                </li>
                                <li class="nav-item" role="presentation" style="flex: 1;">
                                    <button class="nav-link" id="play-by-play-tab" data-bs-toggle="tab" data-bs-target="#play-by-play" type="button" role="tab" aria-controls="play-by-play" aria-selected="true" style="width: 100%;">Plays</button>
                                </li>
                                <li class="nav-item" role="presentation" style="flex: 1;">
                                    <button class="nav-link" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab" aria-controls="info" aria-selected="true" style="width: 100%;">Info</button>
                                </li>
                            </ul>
                            <div class="tab-content" id="teamTabsContent" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-top: none;">
                                <div class="tab-pane fade show active" id="results" role="tabpanel" aria-labelledby="results-tab" style="display: flex;">
                                </div>
                                <div class="tab-pane fade" id="away-team" role="tabpanel" aria-labelledby="away-team-tab" style="display: flex;">
                                </div>
                                <div class="tab-pane fade" id="home-team" role="tabpanel" aria-labelledby="home-team-tab" style="display: flex;">
                                </div>
                                <div class="tab-pane fade" id="play-by-play" role="tabpanel" aria-labelledby="play-by-play-tab" style="display: flex;">
                                </div>
                                <div class="tab-pane fade" id="info" role="tabpanel" aria-labelledby="info-tab" style="display: flex;">
                                </div>
                            </div>
                        </div>
                    `;
                    eventDetailsDiv.innerHTML = eventHTML;
                    quarterResults(data, homeTeam, awayTeam);
                    teamStats(homeTeam, awayTeam);
                    info(data);
                    playByPlay(data);
                    teamRecord(homeTeam, awayTeam);
                    score(data)

                    document.querySelectorAll('#teamTabs button').forEach(button => {
                        button.addEventListener('click', function () {
                            document.querySelectorAll('#teamTabs button').forEach(btn => btn.classList.remove('active'));
                            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
                            this.classList.add('active');
                            const target = document.querySelector(this.getAttribute('data-bs-target'));
                            target.classList.add('show', 'active');
                        });
                    });
                });
        })
        .catch(error => {
            console.error('Error fetching event data:', error);
            eventDetailsDiv.innerHTML = '<p>Error loading event details.</p>';
        });
});

function quarterResults(data, homeTeam, awayTeam) {
    Promise.all([
        fetch(data.competitions[0].competitors[0].linescores.$ref.replace('http:', 'https:')).then(response => response.json()),
        fetch(data.competitions[0].competitors[1].linescores.$ref.replace('http:', 'https:')).then(response => response.json())
    ])
        .then(([homeTeamScoresData, awayTeamScoresData]) => {
            const awayTeamScores = awayTeamScoresData.items.map(item => item.displayValue);
            const homeTeamScores = homeTeamScoresData.items.map(item => item.displayValue);
            const awayTeamTotal = awayTeamScores.reduce((acc, score) => acc + parseInt(score), 0);
            const homeTeamTotal = homeTeamScores.reduce((acc, score) => acc + parseInt(score), 0);

            const periods = awayTeamScores.map((_, index) => index < 4 ? 'Q' + (index + 1) : 'OT' + (index - 3));
            periods.push('TOT');

            const resultsHTML = `
                <table style="width: 100%; text-align: center;">
                    <thead>
                        <tr>
                            <th>Team</th>
                            ${periods.map(period => `<th>${period}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${awayTeam.abbreviation}</td>
                            ${awayTeamScores.map(score => `<td>${score}</td>`).join('')}
                            <td>${awayTeamTotal}</td>
                        </tr>
                        <tr>
                            <td>${homeTeam.abbreviation}</td>
                            ${homeTeamScores.map(score => `<td>${score}</td>`).join('')}
                            <td>${homeTeamTotal}</td>
                        </tr>
                    </tbody>
                </table>
            `;
            document.getElementById('results').innerHTML = resultsHTML;
        })
        .catch(error => console.error(error));
}

function teamStats(homeTeam, awayTeam) {
    console.log('Team stats:', homeTeam, awayTeam);
}

function playByPlay(data) {
    console.log('Play-by-play:', data);
}

function info(data) {
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = '';
    if (data.competitions[0].officials) {
        fetch(data.competitions[0].officials.$ref.replace('http:', 'https:'))
            .then(response => response.json())
            .then(dataOfficials => {
                console.log(dataOfficials);
                const officialsHTML = `
                <div>
                    <h4>Game Info</h4>
                    <p>Location: ${data.competitions[0].venue.fullName} - ${data.competitions[0].venue.address.city}, ${data.competitions[0].venue.address.state}</p>
                    <p>Attendance: ${data.competitions[0].attendance}</p>
                </div>
                <hr>
                <div>
                    <h4>Officials</h4>
                    <ul>
                        ${dataOfficials.items.map(item => `<li>${item.fullName}</li>`).join('')}
                    </ul>
                </div>
            `;
                infoDiv.innerHTML += officialsHTML;
            })
            .catch(error => console.error(error));
    } else {
        const officialsHTML = `
                <div>
                    <h4>Game Info</h4>
                    <p>Location: ${data.competitions[0].venue.fullName} - ${data.competitions[0].venue.address.city}, ${data.competitions[0].venue.address.state}</p>
                    <p>Attendance: ${data.competitions[0].attendance}</p>
                </div>
            `;
        infoDiv.innerHTML += officialsHTML;
    }
}

function teamRecord(homeTeam, awayTeam) {
    fetch(homeTeam.record.$ref.replace('http:', 'https:'))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const overallRecord = data.items.find(item => item.type === 'total');
            console.log(overallRecord);
            document.getElementById('homeTeam_record').innerHTML = `${overallRecord.summary}`;
        })
        .catch(error => console.error(error));

    fetch(awayTeam.record.$ref.replace('http:', 'https:'))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const overallRecord = data.items.find(item => item.type === 'total');
            console.log(overallRecord);
            document.getElementById('awayTeam_record').innerHTML = `${overallRecord.summary}`;
        })
        .catch(error => console.error(error));
}

function score(data) {
    fetch(data.competitions[0].competitors[0].score.$ref.replace('http:', 'https:'))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('homeTeam_score').innerHTML = `${data.displayValue}`;
        })
        .catch(error => console.error(error));
    fetch(data.competitions[0].competitors[1].score.$ref.replace('http:', 'https:'))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('awayTeam_score').innerHTML = `${data.displayValue}`;
        })
        .catch(error => console.error(error));
}
