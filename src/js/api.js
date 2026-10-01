// Mock API payload — swap fetchProjectsOverview's body with a real `fetch('/api/projects')` call when the backend exists.
const MOCK_RESPONSE = {
    stats: [
        { label: 'Összes projekt', value: '24' },
        { label: 'Értékelt', value: '17' },
        { label: 'Várakozik', value: '7' },
        { label: 'Átlagjegy', value: '4,2' }
    ],
    submissions: [
        { title: 'Interaktív történelmi térkép', authors: 'Nagy Anna · Kovács Bence', status: 'evaluated', statusLabel: 'Értékelve', grade: 4, href: 'project.html' },
        { title: 'Modern könyvtár', authors: 'Szabó Péter', status: 'pending', statusLabel: 'Értékelésre vár', grade: null, href: 'project.html' },
        { title: 'Fenntartható városok', authors: 'Tóth Emese · Varga Noel', status: 'progress', statusLabel: 'Folyamatban', grade: null, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Kortárs tipográfiai archívum', authors: 'Molnár Luca', status: 'evaluated', statusLabel: 'Értékelve', grade: 5, href: 'project.html' },
        { title: 'Zenei hangulatgenerátor', authors: 'Balogh Áron · Kiss Dorka', status: 'pending', statusLabel: 'Értékelésre vár', grade: null, href: 'project.html' }
    ]
};

export async function fetchProjectsOverview() {
    const response = await new Promise((resolve) => {
        setTimeout(() => resolve(structuredClone(MOCK_RESPONSE)), 300);
    });

    return response;
}
