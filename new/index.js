let liveTimeoutId = null;
let scheduledTimeoutId = null;

window.onload = function () {
    fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById('season_name').innerHTML = `NBA ${data.season.type.name} ${data.season.displayName}`;

            let date = sessionStorage.getItem('selectedDate');
            if (!date) {
                date = new Date();
                if (date.getHours() < 12) {
                    date.setDate(date.getDate() - 1);
                }
                date = date.toISOString().split('T')[0];
                sessionStorage.setItem('selectedDate', date);
            }

            document.getElementById('datePicker').value = date;
            date = date.replace(/-/g, '');
            results(date);
        });
}

document.getElementById('datePicker').addEventListener('change', function () {
    let date = this.value;
    console.log(date);
    sessionStorage.setItem('selectedDate', date);
    date = date.replace(/-/g, '');

    if (liveTimeoutId) {
        clearTimeout(liveTimeoutId);
        liveTimeoutId = null;
    }
    if (scheduledTimeoutId) {
        clearTimeout(scheduledTimeoutId);
        scheduledTimeoutId = null;
    }

    results(date);
});

function results(date = null) {
    if (date) {
        console.log(date);
    } else {
        let date = new Date();
        date.setDate(date.getDate() - 1);
        date = date.toISOString().split('T')[0];
        console.log(date);
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
        return fetch(event.$ref.replace('http://', 'https://'))
            .then(eventResponse => eventResponse.json())
            .then(eventData => {
                return Promise.all([
                    fetch(eventData.competitions[0].status.$ref.replace('http://', 'https://')).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[0].team.$ref.replace('http://', 'https://')).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[0].score.$ref.replace('http://', 'https://')).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[1].team.$ref.replace('http://', 'https://')).then(response => response.json()),
                    fetch(eventData.competitions[0].competitors[1].score.$ref.replace('http://', 'https://')).then(response => response.json()),
                    fetch(eventData.seasonType.$ref.replace('http://', 'https://')).then(response => response.json())
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
                        
                        document.getElementById('season_name').innerHTML = `${SeasonType.name}`;
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
                                ${event.competitions[0].series && event.competitions[0].series[1] && event.competitions[0].series[1].type === "playoff" && SeasonType.id === '3' ? `
                                    <h6 style="text-align: center; margin-top: -10px;">${event.competitions[0].series[1].summary}</h6>
                                ` : ''}
                                <hr>
                            `;
                        } else if (statusData.type.name === 'STATUS_IN_PROGRESS' || statusData.type.name === 'STATUS_HALFTIME' || statusData.type.name === 'STATUS_END_PERIOD') { // LIVE
                            resultsDiv.innerHTML += `
                                <h5 onclick="window.location.href='event.html?idEvent=${event.id}'" style="text-align: center; color: red;">LIVE</h5>
                                <h4 onclick="window.location.href='event.html?idEvent=${event.id}'" style="text-align: center;">${statusData.type.detail}</h4>
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
                            liveTimeoutId = setTimeout(() => {
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
                            if (eventDate.getTime() - new Date().getTime() < 900000) { // 15 minutes
                                scheduledTimeoutId = setTimeout(() => {
                                    resultsDiv.innerHTML = '';
                                    fetchAndDisplayEvents();
                                }, 90000); // Refresh every 90 seconds
                            }
                        }
                    }
                });
            })
            .catch(error => console.error(error));
    };

    fetchAndDisplayEvents();
}