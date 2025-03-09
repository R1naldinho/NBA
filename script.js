let data


let SelectedDate = parseDataYYYYMMDD(new Date)

let currentDate = new Date()
currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

function loadDate(date) {
    const selectedDateInput = document.getElementById('selectedDate');

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    selectedDateInput.value = `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', function () {
    loadDate(new Date());
    //fetchDataForDate()
    changeDate(-1)
});

function changeDate(value) {
    const year = SelectedDate.substring(0, 4)
    const month = SelectedDate.substring(4, 6) - 1
    const day = SelectedDate.substring(6, 8)

    const currentDate = new Date(year, month, day)
    currentDate.setDate(currentDate.getDate() + value)
    loadDate(currentDate)

    const newYear = currentDate.getFullYear()
    const newMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const newDay = currentDate.getDate().toString().padStart(2, '0')

    SelectedDate = `${newYear}${newMonth}${newDay}`
    fetchDataForDate()
}

function handleDateChange() {
    const selectedDateInput = document.getElementById('selectedDate')
    const date = new Date(selectedDateInput.value)
    SelectedDate = parseDataYYYYMMDD(date)
    fetchDataForDate()
}

function parseDataYYYYMMDD(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    return year.toString() + month + day
}

function fetchDataForDate() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${SelectedDate}`);
    xhr.responseType = 'json';
    xhr.onload = () => {
        if (xhr.status === 200) {
            data = xhr.response;
            if (data.events.length > 0) {
                //console.log(data);
                printGames();
            } else {
                document.getElementById("Card").innerHTML = `
                <div class="container h-100 d-flex justify-content-center align-items-center" style="color: white !important">
                    <div class="row">
                        <div class="col-12 text-center">
                            <h1 style="padding-top: 30%">NO GAME</h1>
                        </div>
                    </div>
                </div>`;
            }
        } else {
            console.error('Error fetching data:', xhr.statusText);
        }
    };
    xhr.send();
}

function printGames() {
    let content = ''
    for (let i = 0; i < data.events.length; i++) {
        if (data.events[i].competitions[0].status.type.completed == true) {
            let [winTeam1, lostTeam1] = data.events[i].competitions[0].competitors[0].records[0].summary.split('-').map(Number);
            let [winTeam2, lostTeam2] = data.events[i].competitions[0].competitors[1].records[0].summary.split('-').map(Number);
            content += `
            <div class="card card_game text-center">
                
                <div class="card-body">
                    <div class="container">
                        <div class="row d-flex align-items-center">
                            <div class="col">
                                <img src="${data.events[i].competitions[0].competitors[1].team.logo}" class="img-fluid">
                                <h3>${data.events[i].competitions[0].competitors[1].team.abbreviation}</h3>
                                <h4>${data.events[i].competitions[0].competitors[1].records[0].summary}</h4>
                                <div class="progress-stacked">
                                    <div class="progress" role="progressbar" aria-label="Win" aria-valuenow="${(winTeam2 / (winTeam2 + lostTeam2)) * 100}" aria-valuemin="0" aria-valuemax="100" style="width: ${(winTeam2 / (winTeam2 + lostTeam2)) * 100}%">
                                        <div class="progress-bar" style="background-color: #${data.events[i].competitions[0].competitors[1].team.color}"></div>
                                    </div>
                                    <div class="progress" role="progressbar" aria-label="Lost" aria-valuenow="${(lostTeam2 / (winTeam2 + lostTeam2)) * 100}" aria-valuemin="0" aria-valuemax="100" style="width: ${(lostTeam2 / (winTeam2 + lostTeam2)) * 100}%">
                                        <div class="progress-bar" style="background-color: #${data.events[i].competitions[0].competitors[1].team.alternateColor}"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col">
                                <h1>${data.events[i].competitions[0].competitors[1].score}</h1>
                            </div>
                            <div class="col">
                                <h2>-</h2>
                            </div>
                            <div class="col">
                                <h1>${data.events[i].competitions[0].competitors[0].score}</h1>
                            </div>
                            <div class="col">
                                <img src="${data.events[i].competitions[0].competitors[0].team.logo}" class="img-fluid">
                                <h3>${data.events[i].competitions[0].competitors[0].team.abbreviation}</h3>
                                <h4>${data.events[i].competitions[0].competitors[0].records[0].summary}</h4>
                                <div class="progress-stacked">
                                    <div class="progress" role="progressbar" aria-label="Win" aria-valuenow="${(winTeam1 / (winTeam1 + lostTeam1)) * 100}" aria-valuemin="0" aria-valuemax="100" style="width: ${(winTeam1 / (winTeam1 + lostTeam1)) * 100}%">
                                        <div class="progress-bar" style="background-color: #${data.events[i].competitions[0].competitors[0].team.color}"></div>
                                    </div>
                                    <div class="progress" role="progressbar" aria-label="Lost" aria-valuenow="${(lostTeam1 / (winTeam1 + lostTeam1)) * 100}" aria-valuemin="0" aria-valuemax="100" style="width: ${(lostTeam1 / (winTeam1 + lostTeam1)) * 100}%">
                                        <div class="progress-bar" style="background-color: #${data.events[i].competitions[0].competitors[0].team.alternateColor}"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            
                    <h3 class="card-title">${data.events[i].name}</h3>
                    <h5 class="card-text">${new Date(data.events[i].date).toLocaleString('en-US', { timeZone: 'Europe/Rome' })}</h5>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item venue_li"><h5>${data.events[i].competitions[0].venue.fullName} - ${data.events[i].competitions[0].venue.address.city}</h5></li>
                    <li class="list-group-item team_stats_li quarter_li">

                    <button class="btn" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMatch${i}" aria-expanded="false" aria-controls="collapseMatch${i}" onclick="ChangeCollapseButton('collapseButton1${i}')">
                        <h4>Points per Quarter</h4>
                                    <span id="collapseButton1${i}" class="collapseButton1_OFF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                        </svg>
                                    </span>
                                
                    </button>
                    <div class="collapse" id="collapseMatch${i}">
    <div class="container">
        <div class="row d-flex align-items-center">
            <div class="col"><h4>Team</h4></div>`;

            for (let j = 1; j <= data.events[i].competitions[0].competitors[0].linescores.length; j++) {
                if (j <= 4) {
                    content += `<div class="col"><h4>Q${j}</h4></div>`;
                } else {
                    content += `<div class="col"><h3>OT${j - 4}</h3></div>`;
                }
            }

            content += `<div class="col"><h4>TOT</h4></div>
        </div>
        <div class="row d-flex align-items-center">
            <div class="col">
                <h3>${data.events[i].competitions[0].competitors[0].team.abbreviation}</h3>
            </div>`;

            // TEAM AWAY
            for (let j = 0; j < data.events[i].competitions[0].competitors[0].linescores.length; j++) {
                content += `<div class="col"><h5>${data.events[i].competitions[0].competitors[0].linescores[j].value}</h5></div>`;
            }

            content += `<div class="col"><h4>${data.events[i].competitions[0].competitors[0].score}</h4></div>
        </div>
        <div class="row d-flex align-items-center">
            <div class="col">
                <h3>${data.events[i].competitions[0].competitors[1].team.abbreviation}</h3>
            </div>`;

            // TEAM HOME
            for (let j = 0; j < data.events[i].competitions[0].competitors[1].linescores.length; j++) {
                content += `<div class="col"><h5>${data.events[i].competitions[0].competitors[1].linescores[j].value}</h5></div>`;
            }
            console.log(data.events[i].competitions[0].competitors[0].team.color)

            content += `<div class="col"><h4>${data.events[i].competitions[0].competitors[1].score}</h4></div>
                                </div>
                            </div>
                            </div>  
                    </li >

                    <li class="list-group-item team_stats_li" style="background-color: #${data.events[i].competitions[0].competitors[0].team.color}; color: #${data.events[i].competitions[0].competitors[0].team.alternateColor} !important">
                        <button class="btn" style="background-color: #${data.events[i].competitions[0].competitors[0].team.color}; color: #${data.events[i].competitions[0].competitors[0].team.alternateColor} !important" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMatchTeam1${i}" aria-expanded="false" aria-controls="collapseMatchTeam1${i}" onclick="ChangeCollapseButton('collapseButtonTeam1${i}')">
                            <h4>${data.events[i].competitions[0].competitors[0].team.abbreviation} Stats</h4>
                                <span id="collapseButtonTeam1${i}" class="collapseButton1_OFF">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                    </svg>
                                </span>
                                    
                        </button>

                        <div class="collapse" id="collapseMatchTeam1${i}">
                            <div class="container text-center">
                                <div class="row">
                                    <div class="col">
                                        <h3>PTS</h3>
                                    </div>
                                    <div class="col">
                                        <h3>REB</h3>
                                    </div>
                                    <div class="col">
                                        <h3>AST</h3>
                                    </div>
                                    <div class="col">
                                        <h3>FG</h3>
                                    </div>
                                    <div class="col">
                                        <h3>3P</h3>
                                    </div>
                                    <div class="col">
                                        <h3>FT</h3>
                                    </div>
                                </div>
                                `

            //TEAM1 STATS
            const teamStats1 = new Map();
            for (let stats_i = 0; stats_i < data.events[i].competitions[0].competitors[0].statistics.length; stats_i++) {
                teamStats1.set(data.events[i].competitions[0].competitors[0].statistics[stats_i].abbreviation, data.events[i].competitions[0].competitors[0].statistics[stats_i].displayValue);
            }

            const playerStats1 = new Map();
            for (let stats_i = 0; stats_i < data.events[i].competitions[0].competitors[0].leaders.length; stats_i++) {
                playerStats1.set(data.events[i].competitions[0].competitors[0].leaders[stats_i].abbreviation, data.events[i].competitions[0].competitors[0].leaders[stats_i].leaders[0]);
            }


            content += `        <div class="row">
                                    <div class="col">
                                        <h4>${data.events[i].competitions[0].competitors[0].score}</h4>
                                    </div>
                                    <div class="col">
                                        <h4>${parseInt(teamStats1.get("REB"))}</h4>
                                    </div>
                                    <div class="col">
                                        <h4>${parseInt(teamStats1.get("AST"))}</h4>
                                    </div>
                                    <div class="col">
                                        <div class="container text-center">
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${parseInt(teamStats1.get("FGM"))}/${parseInt(teamStats1.get("FGA"))}</h4>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${(teamStats1.get("FGM") / teamStats1.get("FGA") * 100).toFixed(2)}%</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="container text-center">
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${parseInt(teamStats1.get("3PM"))}/${parseInt(teamStats1.get("3PA"))}</h4>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${(teamStats1.get("3PM") / teamStats1.get("3PA") * 100).toFixed(2)}%</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div><div class="col">
                                    <div class="container text-center">
                                        <div class="row">
                                            <div class="col">
                                                <h4>${parseInt(teamStats1.get("FTM"))}/${parseInt(teamStats1.get("FTA"))}</h4>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col">
                                                <h4>${(teamStats1.get("FTM") / teamStats1.get("FTA") * 100).toFixed(2)}%</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <h3 class="PlayersStats">${data.events[i].competitions[0].competitors[0].team.displayName}  Best Players</h3>
                            <div class="container text-center">
                                <div class="row">
                                    <div class="col">
                                        <h3>PTS</h3>
                                    </div>
                                    <div class="col">
                                        <h3>REB</h3>
                                    </div>
                                    <div class="col">
                                        <h3>AST</h3>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <div class="card player_card_full">
                                            <img src="${(playerStats1.get("Pts")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats1.get("Pts")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[0].team.abbreviation} | #${(playerStats1.get("Pts")).athlete.jersey} | ${(playerStats1.get("Pts")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="card player_card_full" >
                                            <img src="${(playerStats1.get("Reb")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats1.get("Reb")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[0].team.abbreviation} | #${(playerStats1.get("Reb")).athlete.jersey} | ${(playerStats1.get("Reb")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="card  player_card_full" >
                                            <img src="${(playerStats1.get("Ast")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats1.get("Ast")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[0].team.abbreviation} | #${(playerStats1.get("Ast")).athlete.jersey} | ${(playerStats1.get("Ast")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats1.get("Pts")).displayValue}</h2>
                                    </div>
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats1.get("Reb")).displayValue}</h2>
                                    </div>
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats1.get("Ast")).displayValue}</h2>
                                    </div>
                                </div>
                        </div>
                        
                        </div>
                    </li >

                    <li class="list-group-item team_stats_li" style="background-color: #${data.events[i].competitions[0].competitors[1].team.color}; color: #${data.events[i].competitions[0].competitors[1].team.alternateColor} !important">
                        <button class="btn" style="background-color: #${data.events[i].competitions[0].competitors[1].team.color}; color: #${data.events[i].competitions[0].competitors[1].team.alternateColor} !important" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMatchTeam2${i}" aria-expanded="false" aria-controls="collapseMatchTeam2${i}" onclick="ChangeCollapseButton('collapseButtonTeam2${i}')">
                            <h4>${data.events[i].competitions[0].competitors[1].team.abbreviation} Stats</h4>
                                <span id="collapseButtonTeam2${i}" class="collapseButton1_OFF">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
                                    </svg>
                                </span>
                                    
                        </button>

                        <div class="collapse" id="collapseMatchTeam2${i}">
                            <div class="container text-center">
                                <div class="row">
                                    <div class="col">
                                        <h3>PTS</h3>
                                    </div>
                                    <div class="col">
                                        <h3>REB</h3>
                                    </div>
                                    <div class="col">
                                        <h3>AST</h3>
                                    </div>
                                    <div class="col">
                                        <h3>FG</h3>
                                    </div>
                                    <div class="col">
                                        <h3>3P</h3>
                                    </div>
                                    <div class="col">
                                        <h3>FT</h3>
                                    </div>
                                </div>
                                `

            //TEAM2 STATS
            const teamStats2 = new Map();
            for (let stats_i = 0; stats_i < data.events[i].competitions[0].competitors[1].statistics.length; stats_i++) {
                teamStats2.set(data.events[i].competitions[0].competitors[1].statistics[stats_i].abbreviation, data.events[i].competitions[0].competitors[1].statistics[stats_i].displayValue);
            }

            const playerStats2 = new Map();
            for (let stats_i = 0; stats_i < data.events[i].competitions[0].competitors[1].leaders.length; stats_i++) {
                playerStats2.set(data.events[i].competitions[0].competitors[1].leaders[stats_i].abbreviation, data.events[i].competitions[0].competitors[1].leaders[stats_i].leaders[0]);
            }


            content += `        <div class="row">
                                    <div class="col">
                                        <h4>${data.events[i].competitions[0].competitors[1].score}</h4>
                                    </div>
                                    <div class="col">
                                        <h4>${parseInt(teamStats2.get("REB"))}</h4>
                                    </div>
                                    <div class="col">
                                        <h4>${parseInt(teamStats2.get("AST"))}</h4>
                                    </div>
                                    <div class="col">
                                        <div class="container text-center">
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${parseInt(teamStats2.get("FGM"))}/${parseInt(teamStats2.get("FGA"))}</h4>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${(teamStats2.get("FGM") / teamStats2.get("FGA") * 100).toFixed(2)}%</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="container text-center">
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${parseInt(teamStats2.get("3PM"))}/${parseInt(teamStats2.get("3PA"))}</h4>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col">
                                                    <h4>${(teamStats2.get("3PM") / teamStats2.get("3PA") * 100).toFixed(2)}%</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div><div class="col">
                                    <div class="container text-center">
                                        <div class="row">
                                            <div class="col">
                                                <h4>${parseInt(teamStats2.get("FTM"))}/${parseInt(teamStats2.get("FTA"))}</h4>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col">
                                                <h4>${(teamStats2.get("FTM") / teamStats2.get("FTA") * 100).toFixed(2)}%</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            <h3 class="PlayersStats">${data.events[i].competitions[0].competitors[1].team.displayName}  Best Players</h3>
                            <div class="container text-center">
                                <div class="row">
                                    <div class="col">
                                        <h3>PTS</h3>
                                    </div>
                                    <div class="col">
                                        <h3>REB</h3>
                                    </div>
                                    <div class="col">
                                        <h3>AST</h3>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <div class="card player_card_full" >
                                            <img src="${(playerStats2.get("Pts")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats2.get("Pts")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[1].team.abbreviation} | #${(playerStats2.get("Pts")).athlete.jersey} | ${(playerStats2.get("Pts")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="card player_card_full" >
                                            <img src="${(playerStats2.get("Reb")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats2.get("Reb")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[1].team.abbreviation} | #${(playerStats2.get("Reb")).athlete.jersey} | ${(playerStats2.get("Reb")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="card player_card_full" >
                                            <img src="${(playerStats2.get("Ast")).athlete.headshot}" class="card-img-top">
                                            <div class="card-body card_player text-center">
                                                <h3 class="card-title player_name">${(playerStats2.get("Ast")).athlete.displayName}</h3>
                                                <h4 class="card-text">${data.events[i].competitions[0].competitors[1].team.abbreviation} | #${(playerStats2.get("Ast")).athlete.jersey} | ${(playerStats2.get("Ast")).athlete.position.abbreviation}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats2.get("Pts")).displayValue}</h2>
                                    </div>
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats2.get("Reb")).displayValue}</h2>
                                    </div>
                                    <div class="col">
                                        <h2 class="player_stats">${(playerStats2.get("Ast")).displayValue}</h2>
                                    </div>
                                </div>
                        </div>
                    </li >
                </ul >
            </div >
            `
        } else {
            content += `
            <div class="card card_game text-center">
                
                <div class="card-body">
                    <div class="container">
                        <div class="row d-flex align-items-center">
                            <div class="col">
                                <img src="${data.events[i].competitions[0].competitors[1].team.logo}" class="img-fluid">
                                <h3>${data.events[i].competitions[0].competitors[1].team.abbreviation}</h3>
                                <h4>${data.events[i].competitions[0].competitors[1].records[0].summary}</h4>
                            </div>
                            <div class="col">
                                <h2>-</h2>
                            </div>
                            <div class="col">
                                <img src="${data.events[i].competitions[0].competitors[0].team.logo}" class="img-fluid">
                                <h3>${data.events[i].competitions[0].competitors[0].team.abbreviation}</h3>
                                <h4>${data.events[i].competitions[0].competitors[0].records[0].summary}</h4>
                            </div>
                        </div>
                    </div>
            
                    <h3 class="card-title">${data.events[i].name}</h3>
                    <h5 class="card-text">${new Date(data.events[i].date).toLocaleString('en-US', { timeZone: 'Europe/Rome' })}</h5>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><h5>${data.events[i].competitions[0].venue.fullName} - ${data.events[i].competitions[0].venue.address.city}</h5></li>
                </ul >
            </div >
            `
        }
    }
    document.getElementById("Card").innerHTML = content
}

function ChangeCollapseButton(id) {
    const down_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/>
  </svg>`;

    const up_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
    <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z"/>
  </svg>`;

    let icon = document.getElementById(id);

    if (icon.classList.contains('collapseButton1_ON')) {
        icon.classList.remove('collapseButton1_ON');
        icon.classList.add('collapseButton1_OFF');
        icon.innerHTML = down_icon;
    } else if (icon.classList.contains('collapseButton1_OFF')) {
        icon.classList.remove('collapseButton1_OFF');
        icon.classList.add('collapseButton1_ON');
        icon.innerHTML = up_icon;
    }

}
