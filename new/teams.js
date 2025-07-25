document.addEventListener("DOMContentLoaded", () => {
  const teamsContainer = document.getElementById("teams");
  const currentYear = new Date().getFullYear();

  const eastUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${currentYear}/types/3/groups/5/teams?lang=en&region=us`;
  const westUrl = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${currentYear}/types/3/groups/6/teams?lang=en&region=us`;

  async function fetchTeamDetails(url) {
    const res = await fetch(url);
    const data = await res.json();
    const teamRefs = data.items.map(item => item.$ref.replace('http:', 'https:'));

    const teamDetails = await Promise.all(
      teamRefs.map(ref =>
        fetch(ref).then(res => res.json())
      )
    );

    return teamDetails.map(team => ({
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      logoUrl: team.logos?.[0]?.href || '',
      color: team.color || '000000',
      alternateColor: team.alternateColor || 'ffffff'
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderConference(title, teams) {
    const section = document.createElement("div");

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.className = "mt-5 mb-3";
    section.appendChild(heading);

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "1rem";

    teams.forEach(team => {
      const card = document.createElement("div");
      card.style.flex = "1 1 calc(20% - 1rem)";
      card.style.boxSizing = "border-box";
      card.style.border = `3px solid #${team.color}`;
      card.style.borderRadius = "8px";
      card.style.cursor = "pointer";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.backgroundColor = `#${team.alternateColor}`;
      card.style.color = `#${team.color}`;
      card.style.padding = "1rem";
      card.style.minWidth = "150px";

      card.onclick = () => window.location.href = `./team.html?teamId=${team.id}`;

      const img = document.createElement("img");
      img.src = team.logoUrl;
      img.alt = team.name;
      img.style.maxHeight = "120px";
      img.style.objectFit = "contain";
      img.style.marginBottom = "1rem";

      const nameEl = document.createElement("h5");
      nameEl.textContent = team.name;
      nameEl.style.margin = "0 0 0.25rem 0";
      nameEl.style.textAlign = "center";

      const abbrEl = document.createElement("small");
      abbrEl.textContent = team.abbreviation;

      card.appendChild(img);
      card.appendChild(nameEl);
      card.appendChild(abbrEl);

      container.appendChild(card);
    });

    section.appendChild(container);
    teamsContainer.appendChild(section);
  }

  async function loadTeams() {
    try {
      const [eastTeams, westTeams] = await Promise.all([
        fetchTeamDetails(eastUrl),
        fetchTeamDetails(westUrl)
      ]);

      renderConference("Eastern Conference", eastTeams);
      renderConference("Western Conference", westTeams);
    } catch (error) {
      console.error("Errore durante il caricamento delle squadre:", error);
    }
  }

  loadTeams();
});
