window.onload = function () {
    fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('season_name').innerHTML = `NBA ${data.season.type.name} ${data.season.displayName}`;

            let date = new Date();
            date.setDate(date.getDate() - 1);
            date = date.toISOString().split('T')[0];

            document.getElementById('datePicker').value = date;

            date = date.replace(/-/g, '');
            results(date);
        });
}

document.getElementById('datePicker').addEventListener('change', function () {
    let date = this.value;
    console.log(date);
    date = date.replace(/-/g, '');
    results(date);
});

function results(date = null) {
    if (date) {
        console.log(`Visualizza risultati per la data: ${date}`);
    } else {
        let date = new Date();
        date.setDate(date.getDate() - 1);
        date = date.toISOString().split('T')[0];
        console.log(`Visualizza risultati per la data di ieri: ${date}`);
    }
    const link = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events?dates=${date}`;
    fetch(link)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.items.length === 0) {
                document.getElementById('results').innerHTML = '<h3 style="text-align: center;">NO GAME</h3>';
                return;
            }
            displayResults(data.items);
        })
        .catch(error => console.error(error));
}

function displayResults(events) {
    console.log(events);
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const fetchEventDetails = (event) => {
        return fetch(event.$ref)
            .then(eventResponse => eventResponse.json())
            .then(eventData => {
                return Promise.all([
                    fetch(eventData.competitions[0].status.$ref).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[0].team.$ref).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[0].score.$ref).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[1].team.$ref).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[1].score.$ref).then(response => response.json()),
                    fetch(eventData.seasonType.$ref).then(response => response.json())
                ]).then(([statusData, HomeTeam, HomeTeamScore, AwayTeam, AwayTeamScore, SeasonType]) => {
                    return {
                        statusData,
                        HomeTeam,
                        HomeTeamScore,
                        AwayTeam,
                        AwayTeamScore,
                        SeasonType,
                        event: eventData
                    };
                });
            })
            .catch(error => console.error(error));
    };

    const fetchAndDisplayEvents = () => {
        Promise.all(events.map(event => fetchEventDetails(event)))
            .then(results => {
                results.forEach(result => {
                    if (result) {
                        console.log(result);
                        const { statusData, HomeTeam, HomeTeamScore, AwayTeam, AwayTeamScore, SeasonType, event } = result;
                        if (SeasonType.id !== '2' && SeasonType.id !== '3') {
                            return;
                        }
                        if (statusData.type.name === 'STATUS_FINAL') {
                            resultsDiv.innerHTML += `
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
                                    <div onclick="window.location.href='team.html?teamId=${AwayTeam.id}'" style="display: flex; align-items: center; flex: 1;">
                                        <img src="${AwayTeam.logos[0].href}" alt="${AwayTeam.abbreviation}" style="width: 60px; height: auto; margin-right: 10px;" onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">
                                        <div>
                                            <h4>${AwayTeam.abbreviation}</h4>
                                        </div>
                                    </div>
                                    <h3 onclick="window.location.href='event.html?idEvent=${event.id}'" style="flex: 1; text-align: center;">
                                        ${AwayTeamScore.value > HomeTeamScore.value ? `<strong>${AwayTeamScore.value}</strong>` : AwayTeamScore.value} 
                                        -
                                        ${HomeTeamScore.value > AwayTeamScore.value ? `<strong>${HomeTeamScore.value}</strong>` : HomeTeamScore.value} 
                                    </h3>
                                    <div onclick="window.location.href='team.html?teamId=${HomeTeam.id}'" style="display: flex; align-items: center; flex: 1; justify-content: flex-end;">
                                        <div>
                                            <h4>${HomeTeam.abbreviation}</h4>
                                        </div>
                                        <img src="${HomeTeam.logos[0].href}" alt="${HomeTeam.abbreviation}" style="width: 60px; height: auto; margin-left: 10px;" onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">
                                    </div>
                                </div>
                                <hr>
                            `;
                        } else if (statusData.type.name === 'STATUS_IN_PROGRESS') { // LIVE
                            resultsDiv.innerHTML += `
                                <h3 style="text-align: center; color: red;">LIVE ${statusData.type.detail}</h3>
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between;">
                                    <div onclick="window.location.href='team.html?teamId=${AwayTeam.id}'" style="display: flex; align-items: center; flex: 1;">
                                        <img src="${AwayTeam.logos[0].href}" alt="${AwayTeam.abbreviation}" style="width: 60px; height: auto; margin-right: 10px;" onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">
                                        <div>
                                            <h4>${AwayTeam.abbreviation}</h4>
                                        </div>
                                    </div>
                                    <h3 onclick="window.location.href='event.html?idEvent=${event.id}'" style="flex: 1; text-align: center;">${AwayTeamScore.value} - ${HomeTeamScore.value}</h3>
                                    <div onclick="window.location.href='team.html?teamId=${HomeTeam.id}'" style="display: flex; align-items: center; flex: 1; justify-content: flex-end;">
                                        <div>
                                            <h4>${HomeTeam.abbreviation}</h4>
                                        </div>
                                        <img src="${HomeTeam.logos[0].href}" alt="${HomeTeam.abbreviation}" style="width: 60px; height: auto; margin-left: 10px;" onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">
                                    </div>
                                </div>
                                <hr>
                            `;
                            setTimeout(() => {
                                resultsDiv.innerHTML = '';
                                fetchAndDisplayEvents();
                            }, 15000); // Refresh every 15 seconds
                        } else if (statusData.type.name === 'STATUS_SCHEDULED') {
                            const eventDate = new Date(event.date);
                            const formattedDate = eventDate.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            resultsDiv.innerHTML += `
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between;">
                                    <div onclick="window.location.href='team.html?teamId=${AwayTeam.id}'" style="display: flex; align-items: center; flex: 1;">
                                        <img src="${AwayTeam.logos[0].href}" alt="${AwayTeam.abbreviation}" style="width: 60px; height: auto; margin-right: 10px;" onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">
                                        <div>
                                            <h4>${AwayTeam.abbreviation}</h4>
                                        </div>
                                    </div>
                                    <h3 style="flex: 1; text-align: center;">${formattedDate}</h3>
                                    <div onclick="window.location.href='team.html?teamId=${HomeTeam.id}'" style="display: flex; align-items: center; flex: 1; justify-content: flex-end;">
                                        <div>
                                            <h4>${HomeTeam.abbreviation}</h4>
                                        </div>
                                        <img src="${HomeTeam.logos[0].href}" alt="${HomeTeam.abbreviation}" style="width: 60px; height: auto; margin-left: 10px;" onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">
                                    </div>
                                </div>
                                <hr>
                            `;
                        }
                    }
                });
            })
            .catch(error => console.error(error));
    };

    fetchAndDisplayEvents();
}