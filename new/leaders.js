window.onload = function() {
    fetch('https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba') 
    .then(response => response.json())
    .then(data => {
        console.log(data);
        fetch(data.season.leaders.$ref)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let categories = data.categories;
            let output = '';
            categories.forEach(category => {
                output += `
                    <div class="category" onclick="showLeaders('${category.name}')">
                        <div class="category__name">${category.displayName}</div>
                    </div>
                `;
            });

            window.showLeaders = function(categoryName, seasonYear) {
                let selectedCategory = categories.find(category => category.name === categoryName);
                window.onpopstate = function() {
                    showCategories();
                };
                history.pushState(null, '', location.href);
                let leadersOutput = `
                    <div class="category-header">
                        <h2>${selectedCategory.displayName}</h2>
                    </div>
                `;
                let leaderPromises = selectedCategory.leaders.map((leader, index) => {
                    return fetch(leader.athlete.$ref)
                    .then(response => response.json())
                    .then(data => {
                        return fetch(data.team.$ref)
                        .then(response => response.json())
                        .then(teamData => {
                            let displayValue = leader.displayValue;
                            if (categoryName === '3PointPct') {
                                displayValue = (leader.value * 100).toFixed(1);
                            } else if (categoryName === 'points') {
                                displayValue = Math.round(leader.value);
                            }
                            return `
                                <div class="leader" onclick="window.location.href='athlete.html?athleteId=${data.id}'">
                                    <div class="leader__rank">#${index + 1}</div>
                                    <div class="leader__name">${data.shortName}</div>
                                    <div class="leader__team" onclick="event.stopPropagation(); window.location.href='team.html?teamId=${teamData.id}'" style="display: flex; align-items: center;">
                                        <img src="${teamData.logos[0].href}" alt="${teamData.displayName}" class="leader__team-logo" style="width: 40px; height: 40px; margin-right: 5px;">
                                        <div class="leader__team-name">${teamData.displayName}</div>
                                    </div>
                                    <div class="leader__value">${displayValue}</div>
                                </div>
                            `;
                        });
                    });
                });

                Promise.all(leaderPromises).then(leaders => {
                    leadersOutput += leaders.join('');
                    document.getElementById('leaders').innerHTML = leadersOutput;
                });
            };

            window.showCategories = function() {
                document.getElementById('leaders').innerHTML = output;
            };

            document.getElementById('leaders').innerHTML = output;
        });
    });
}