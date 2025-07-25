const urlParams = new URLSearchParams(window.location.search);
const athleteId = urlParams.get('athleteId');
let draftYear
const statsContainer = document.getElementById("stats-container");
const seasonTypeSelect = document.getElementById("seasonType");
const seasonYearSelect = document.getElementById("seasonYear");

const currentYear = new Date().getFullYear();

function renderStats(data, season) {
    const categories = data.splits?.categories || [];
    const section = document.createElement("div");
    section.className = "mb-5";
    section.innerHTML = `<h3 class='text-primary mb-3'>Season ${season}</h3>`;

    // Define desired order
    const order = ["offensive", "defensive", "general"];
    // Sort categories by order
    const sortedCategories = [...categories].sort((a, b) => {
        const ai = order.indexOf(a.name?.toLowerCase());
        const bi = order.indexOf(b.name?.toLowerCase());
        return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    });

    sortedCategories.forEach(cat => {
        const table = document.createElement("table");
        table.className = "table table-bordered table-hover table-sm";

        const thead = document.createElement("thead");
        thead.innerHTML = `
          <tr class="table-secondary">
            <th colspan="4">${cat.displayName || cat.name}</th>
          </tr>
          <tr>
            <th>Stat</th><th>Value</th><th>Rank</th>
          </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        cat.stats.forEach(stat => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${stat.displayName || stat.name}</td>
            <td>${stat.displayValue}</td>
            <td>${stat.rankDisplayValue || "-"}</td>
          `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        section.appendChild(table);
    });

    statsContainer.appendChild(section);
}

seasonTypeSelect.addEventListener("change", () => {
    fetchStats(seasonTypeSelect.value, seasonYearSelect.value);
});

seasonYearSelect.addEventListener("change", () => {
    fetchStats(seasonTypeSelect.value, seasonYearSelect.value);
});

fetchStats("2", "all"); // initial load

async function fetchAthleteAndPopulateYears() {
    console.log(athleteId)
    const response = await fetch(`https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${currentYear}/athletes/${athleteId}?lang=en&region=us`);
    const athlete = await response.json();
    console.log(athlete)
    document.getElementById("playerName").innerHTML = athlete.fullName;
    draftYear = athlete.draft.year + 1;

    // Pulisci le opzioni precedenti
    seasonYearSelect.innerHTML = '<option value="all">All</option>';
    for (let y = currentYear; y >= draftYear; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        seasonYearSelect.appendChild(opt);
    }
}

async function fetchStats(seasonType, seasonYear) {
    statsContainer.innerHTML = "<p>Loading...</p>";
    let url;

    if (seasonYear === "all") {
        const promises = [];
        for (let y = currentYear; y >= draftYear; y--) {
            const u = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${y}/types/${seasonType}/athletes/${athleteId}/statistics`;
            promises.push(fetch(u).then(r => r.json()));
        }
        const allData = await Promise.all(promises);
        statsContainer.innerHTML = "";
        allData.forEach((data, i) => renderStats(data, currentYear - i));
    } else {
        url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${seasonYear}/types/${seasonType}/athletes/${athleteId}/statistics`;
        const res = await fetch(url);
        const data = await res.json();
        statsContainer.innerHTML = "";
        renderStats(data, seasonYear);
    }
}

// All'avvio
(async () => {
    await fetchAthleteAndPopulateYears();
    fetchStats(seasonTypeSelect.value, seasonYearSelect.value);
})();

seasonTypeSelect.addEventListener("change", () => {
    fetchStats(seasonTypeSelect.value, seasonYearSelect.value);
});

seasonYearSelect.addEventListener("change", () => {
    fetchStats(seasonTypeSelect.value, seasonYearSelect.value);
});