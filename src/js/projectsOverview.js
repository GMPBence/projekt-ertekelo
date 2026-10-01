import { fetchProjectsOverview } from './api.js';
import { showPageLoader, hidePageLoader } from './loader.js';

const BADGE_CLASS_BY_STATUS = {
    evaluated: 'badge--green',
    pending: 'badge--orange',
    progress: 'badge--blue'
};

function renderStats(stats) {
    const container = document.getElementById('statsList');
    container.innerHTML = '';

    stats.forEach(({ label, value }) => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <p class="stat-card__label"></p>
            <h3 class="stat-card__value"></h3>
        `;
        card.querySelector('.stat-card__label').textContent = label;
        card.querySelector('.stat-card__value').textContent = value;
        container.appendChild(card);
    });
}

function renderSubmissions(submissions) {
    const rowsContainer = document.getElementById('submissionsRows');
    rowsContainer.innerHTML = '';

    submissions.forEach(({ title, authors, status, statusLabel, grade, href }) => {
        const row = document.createElement('div');
        row.className = 'submissions__row';

        const badgeClass = BADGE_CLASS_BY_STATUS[status] ?? 'badge--blue';
        const gradeClass = grade ? 'grade--filled' : 'grade--empty';
        const gradeText = grade ?? '–';

        row.innerHTML = `
            <div class="submissions__project">
                <h4></h4>
                <p></p>
            </div>
            <div class="submissions__cell submissions__cell--status">
                <span class="badge ${badgeClass}"></span>
            </div>
            <div class="submissions__cell submissions__cell--grade">
                <span class="grade ${gradeClass}"></span>
            </div>
            <div class="submissions__cell submissions__cell--action">
                <a href="${href}" class="btn btn--outline">Megnyitás →</a>
            </div>
            <a href="${href}" class="submissions__mobile-link">Projekt megnyitása →</a>
        `;
        row.querySelector('h4').textContent = title;
        row.querySelector('p').textContent = authors;
        row.querySelector('.badge').textContent = statusLabel;
        row.querySelector('.grade').textContent = gradeText;

        rowsContainer.appendChild(row);
    });

    document.getElementById('submissionsCount').textContent = `${submissions.length} projekt`;
}

try {
    showPageLoader();

    const { stats, submissions } = await fetchProjectsOverview();
    renderStats(stats);
    renderSubmissions(submissions);
} catch (error) {
    console.error('Nem sikerült betölteni a projekteket:', error);
    document.getElementById('submissionsCount').textContent = 'Hiba történt a betöltés során.';
} finally {
    hidePageLoader();
}
