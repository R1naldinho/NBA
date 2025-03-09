window.onload = function () {
    fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const year = data.season.year;
            const urlParams = new URLSearchParams(window.location.search);
            const teamId = urlParams.get('teamId');
            if (teamId) {
                showTeam(teamId, year);
            }
        });
};

let teamData

function showTeam(teamId, year) {
    console.log('Team ID:', teamId);
    fetch(`http://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${year}/teams/${teamId}?lang=en&region=us`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            teamData = data;
            loadInfo();
        })
        .catch(error => console.error(error));
}

function loadInfo() {
    const teamDiv = document.getElementById('team');
    teamDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <img id="team_logo" src="${teamData.logos[0].href}" alt="${teamData.displayName}" style="width: 150px; height: auto;">
            <div style="margin-left: 20px;">
                <h1 id="team_name">${teamData.displayName}</h1>
                <h6 id="team_record_title"></h6>
            </div>
        </div>
        <div id="menu" style="margin-top: 20px;">
            <ul class="nav nav-tabs" id="teamTabs" role="tablist" style="width: 100%; display: flex;">
                <li class="nav-item" role="presentation" style="flex: 1;">
                    <button class="nav-link active" id="results-tab" data-bs-toggle="tab" data-bs-target="#results" type="button" role="tab" aria-controls="results" aria-selected="false" style="width: 100%;">Results</button>
                </li>
                <li class="nav-item" role="presentation" style="flex: 1;">
                    <button class="nav-link" id="roster-tab" data-bs-toggle="tab" data-bs-target="#roster" type="button" role="tab" aria-controls="roster" aria-selected="false" style="width: 100%;">Roster</button>
                </li>
                <li class="nav-item" role="presentation" style="flex: 1;">
                    <button class="nav-link" id="injuries-tab" data-bs-toggle="tab" data-bs-target="#injuries" type="button" role="tab" aria-controls="injuries" aria-selected="true" style="width: 100%;">Injuries</button>
                </li>
                <li class="nav-item" role="presentation" style="flex: 1;">
                    <button class="nav-link" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab" aria-controls="info" aria-selected="true" style="width: 100%;">Info</button>
                </li>
            </ul>
            <div class="tab-content" id="teamTabsContent" style="margin-top: 20px; padding: 20px; border: 1px solid #ccc; border-top: none;">
                <div class="tab-pane fade show active" id="results" role="tabpanel" aria-labelledby="results-tab">
                    <p>Results content goes here...</p>
                </div>
                <div class="tab-pane fade" id="roster" role="tabpanel" aria-labelledby="roster-tab">
                    <p>Roster content goes here...</p>
                </div>
                <div class="tab-pane fade" id="injuries" role="tabpanel" aria-labelledby="injuries-tab">
                    <p>Injuries content goes here...</p>
                </div>
                <div class="tab-pane fade" id="info" role="tabpanel" aria-labelledby="info-tab">
                    <p id="team_record"></p>
                    <div id="venue_info">
                        <p>Loading venue info...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('#teamTabs button').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('#teamTabs button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
            this.classList.add('active');
            const target = document.querySelector(this.getAttribute('data-bs-target'));
            target.classList.add('show', 'active');
        });
    });
    record(teamData.record.$ref);

    results(teamData.events.$ref);
    roster(teamData.athletes.$ref, teamData.coaches.$ref);
    injuries(teamData.injuries.$ref);
    venue();
}

//RESULTS
function results(link) {
    fetch(link)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const totalPages = data.pageCount;
            const pageSize = data.pageSize;
            let allEvents = [];

            const fetchPage = (pageIndex) => {
                fetch(`${link}?lang=en&region=us&page=${pageIndex}`)
                    .then(response => response.json())
                    .then(pageData => {
                        console.log('Page', pageIndex);
                        console.log(pageData);
                        allEvents = allEvents.concat(pageData.items);
                        if (pageIndex < totalPages) {
                            fetchPage(pageIndex + 1);
                        } else {
                            displayResults(allEvents);
                        }
                    })
                    .catch(error => console.error(error));
            };

            fetchPage(1);
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
                            const isHomeTeam = HomeTeam.id === teamData.id;
                            const isAwayTeam = AwayTeam.id === teamData.id;
                            const isWinner = (isHomeTeam && HomeTeamScore.value > AwayTeamScore.value) || (isAwayTeam && AwayTeamScore.value > HomeTeamScore.value);
                            const backgroundColor = isWinner ? 'rgba(144, 238, 144, 0.3)' : 'rgba(255, 99, 71, 0.3)';

                            resultsDiv.innerHTML += `
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between; background-color: ${backgroundColor}; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
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
                                            <h4 onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">${HomeTeam.abbreviation}</h4>
                                        </div>
                                        <img src="${HomeTeam.logos[0].href}" alt="${HomeTeam.abbreviation}" style="width: 60px; height: auto; margin-left: 10px;" onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">
                                    </div>
                                </div>
                                <hr>
                            `;
                        } else if (statusData.type.name === 'STATUS_LIVE') { // BO
                            resultsDiv.innerHTML += `
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between;">
                                    <div onclick="window.location.href='team.html?teamId=${AwayTeam.id}'" style="display: flex; align-items: center; flex: 1;">
                                        <img src="${AwayTeam.logos[0].href}" alt="${AwayTeam.abbreviation}" style="width: 60px; height: auto; margin-right: 10px;" onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">
                                        <div>
                                            <h4 onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">${AwayTeam.abbreviation}</h4>
                                        </div>
                                    </div>
                                    <h3 onclick="window.location.href='event.html?idEvent=${event.id}'" style="flex: 1; text-align: center;">${AwayTeamScore.value} - ${HomeTeamScore.value}</h3>
                                    <div onclick="window.location.href='team.html?teamId=${HomeTeam.id}'" style="display: flex; align-items: center; flex: 1; justify-content: flex-end;">
                                        <div>
                                            <h4 onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">${HomeTeam.abbreviation}</h4>
                                        </div>
                                        <img src="${HomeTeam.logos[0].href}" alt="${HomeTeam.abbreviation}" style="width: 60px; height: auto; margin-left: 10px;" onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">
                                    </div>
                                </div>
                                <hr>
                            `;
                        } else if (statusData.type.name === 'STATUS_SCHEDULED') {
                            const eventDate = new Date(event.date);
                            const formattedDate = eventDate.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                            resultsDiv.innerHTML += `
                                <div class="result" style="display: flex; align-items: center; justify-content: space-between;">
                                    <div onclick="window.location.href='team.html?teamId=${AwayTeam.id}'" style="display: flex; align-items: center; flex: 1;">
                                        <img src="${AwayTeam.logos[0].href}" alt="${AwayTeam.abbreviation}" style="width: 60px; height: auto; margin-right: 10px;" onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">
                                        <div>
                                            <h4 onclick="window.location.href='team.html?teamId=${AwayTeam.id}'">${AwayTeam.abbreviation}</h4>
                                        </div>
                                    </div>
                                    <h3 style="flex: 1; text-align: center;">${formattedDate}</h3>
                                    <div onclick="window.location.href='team.html?teamId=${HomeTeam.id}'" style="display: flex; align-items: center; flex: 1; justify-content: flex-end;">
                                        <div>
                                            <h4 onclick="window.location.href='team.html?teamId=${HomeTeam.id}'">${HomeTeam.abbreviation}</h4>
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

//ROSTER
function roster(linkA, linkC) {
    const athleteDiv = document.getElementById('roster');
    fetch(linkA)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            Promise.all(data.items.map(item =>
                fetch(item.$ref)
                    .then(response => response.json())
                    .then(athlete => {
                        return `
                            <div class="card" style="width: 100%; max-width: 18rem; margin: 10px;" onclick="window.location.href='athlete.html?athleteId=${athlete.id}'">
                                <img src="${athlete.headshot ? athlete.headshot.href : 'https://placehold.co//600x436'}" class="card-img-top" alt="${athlete.displayName}" style="width: 100%; height: 436px; object-fit: cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${athlete.displayName}<br>#${athlete.jersey} ${athlete.position.abbreviation}</h5>
                                </div>
                            </div>
                        `;
                    })
            )).then(cards => {
                athleteDiv.innerHTML = `
                <h2>Players</h2>
                <hr>
                    <div class="d-flex flex-wrap justify-content-center">
                        ${cards.join('')}
                    </div>
                    <h2 style="margin-top: 20px;">Coaches</h2>
                    <hr>
                `;
            }).catch(error => console.error(error));
        })
        .catch(error => console.error(error));


    fetch(linkC)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const coachCards = data.items.map(coach =>
                fetch(coach.$ref)
                    .then(response => response.json())
                    .then(coach => {
                        return `
                            <div class="d-flex flex-wrap justify-content-center">
                                <div class="card" style="width: 100%; max-width: 18rem; margin: 10px;">
                                    <div class="card-body">
                                        <h5 class="card-title">${coach.firstName} ${coach.lastName}</h5>
                                    </div>
                                </div>
                            </div>`;
                    })
            );
            Promise.all(coachCards).then(cards => {
                athleteDiv.innerHTML += cards.join('');
            }).catch(error => console.error(error));
        })
        .catch(error => console.error(error));
}

//INJURIES
function injuries(link) {
    const injuryIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-exclamation-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
</svg>`;
    const injuries = [];
    const teamDiv = document.getElementById('injuries');
    teamDiv.innerHTML = '';
    fetch(link)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            Promise.all(data.items.map(item =>
                fetch(item.$ref)
                    .then(response => response.json())
                    .then(injury => {
                        const type = injury.details.type;
                        const status = injury.status; // OUT, DAY-TO_DAY, SUSPENDED
                        const fantasyStatus = injury.details.fantasyStatus.abbreviation; // OUT, OFS, GTD
                        const description = injury.shortComment;
                        const date = injury.date;
                        const returnDate = injury.details.returnDate;
                        return fetch(injury.athlete.$ref)
                            .then(response => response.json())
                            .then(athlete => {
                                const name = athlete.displayName;
                                const id = athlete.id;
                                injuries.push({
                                    name,
                                    id,
                                    type,
                                    status,
                                    fantasyStatus,
                                    description,
                                    date,
                                    returnDate
                                });
                            });
                    })
            )).then(() => {
                console.log("injuries: ", injuries);
                injuries.sort((a, b) => a.returnDate > b.returnDate ? 1 : -1);
                teamDiv.innerHTML = `
                    <h2>Injuries</h2>
                    <hr>
                    <div id="injuries_list" style="margin-top: 20px;">
                        ${injuries.map(injury => {
                    const injuryDate = new Date(injury.date);
                    const formattedDate = `${injuryDate.getDate().toString().padStart(2, '0')}/${(injuryDate.getMonth() + 1).toString().padStart(2, '0')}/${injuryDate.getFullYear()} ${injuryDate.getHours().toString().padStart(2, '0')}:${injuryDate.getMinutes().toString().padStart(2, '0')}`;
                    return `
                                <div class="injury">
                                    <h4>${injury.fantasyStatus === 'OUT' || injury.fantasyStatus === 'OFS' ? '<span style="color: #FF6347;">' + injuryIcon + '</span>' : injury.fantasyStatus === 'GTD' ? '<span style="color: #FFD700;">' + injuryIcon + '</span>' : ''} ${injury.name}</h4>
                                    <p>${injury.description} <br>Injury report Date: ${formattedDate}</p>
                                    <p>Status: ${injury.status}</p>
                                    <p>Type: ${injury.type}</p>
                                    <p>Return Date: ${new Date(injury.returnDate).toLocaleDateString('it-IT')}</p>
                                </div>
                            `;
                }).join('')}
                    </div>
                `;
            }).catch(error => console.error(error));
        })
        .catch(error => console.error(error));
}


//INFO
function record(link) {
    const teamDiv = document.getElementById('team_record');
    fetch(link)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const overallRecord = data.items.find(item => item.type === 'total');
            console.log(overallRecord);
            document.getElementById('team_record_title').innerHTML = `${overallRecord.summary}`;
            teamDiv.innerHTML = `
                <h2>Record</h2>
                <hr>
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Record</th>
                            <th scope="col">L10</th>
                            <th scope="col">Home</th>
                            <th scope="col">Away</th>
                            <th scope="col">Conf</th>
                            <th scope="col">Div</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${overallRecord.summary}</td>
                            <td>${data.items.find(item => item.type === 'lasttengames').summary}</td>
                            <td>${data.items.find(item => item.type === 'home').summary}</td>
                            <td>${data.items.find(item => item.type === 'road').summary}</td>
                            <td>${data.items.find(item => item.type === 'vsconf').summary}</td>
                            <td>${data.items.find(item => item.type === 'vsdiv').summary}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        })
        .catch(error => console.error(error));
}

function venue() {
    const venue = teamData.venue;

    const venueDiv = document.getElementById('venue_info');

    venueDiv.innerHTML = `
            <h2 style="margin-top: 20px">Venue</h2>
            <hr>
            <h2>${venue.fullName}</h2>
            <p>Location: ${venue.address.city}, ${venue.address.state}</p>
            <img src="${venue.images[0].href}" alt="${venue.fullName}" style="width: 100%; height: auto;">
    `;
}