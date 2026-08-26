document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const teamHeaderContainer = document.getElementById('team-header-container');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabViews = document.querySelectorAll('.tab-view');
    const eventSelect = document.getElementById('event-select');
    const dynamicFormFields = document.getElementById('dynamic-form-fields');
    const scoreForm = document.getElementById('score-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');
    const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard');
    const leaderboardStatus = document.getElementById('leaderboard-status');
    const leaderboardTheadTr = document.getElementById('leaderboard-thead-tr');
    const leaderboardTbody = document.getElementById('leaderboard-tbody');

    // 1. QR Code Parameter Parsing & Team Locking
    const urlParams = new URLSearchParams(window.location.search);
    const teamParam = urlParams.get('team');
    let selectedTeam = teamParam || '';

    if (teamParam) {
        teamHeaderContainer.innerHTML = `
            <div class="team-badge" id="team-badge">
                Logging for ${escapeHtml(teamParam)}
            </div>
        `;
    } else {
        let optionsHtml = '<option value="">-- Choose Your Team --</option>';
        for (let i = 1; i <= 11; i++) {
            const teamName = `Team ${i}`;
            optionsHtml += `<option value="${teamName}">${teamName}</option>`;
        }
        teamHeaderContainer.innerHTML = `
            <div class="team-select-group">
                <label for="global-team-select">Team:</label>
                <select id="global-team-select">${optionsHtml}</select>
            </div>
        `;

        const globalTeamSelect = document.getElementById('global-team-select');
        globalTeamSelect.addEventListener('change', (e) => {
            selectedTeam = e.target.value;
            validateForm();
        });
    }

    // 2. Navigation & Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabViews.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`view-${targetTab}`).classList.add('active');

            if (targetTab === 'leaderboard') {
                fetchLeaderboard();
            }
        });
    });

    // 3. Dynamic Form Schemas
    eventSelect.addEventListener('change', () => {
        renderFormForEvent(eventSelect.value);
        validateForm();
    });

    function renderFormForEvent(eventName) {
        formStatus.className = 'status-message';
        formStatus.style.display = 'none';

        if (!eventName) {
            dynamicFormFields.innerHTML = '<p class="placeholder-text">Please select an event above to display scoring fields.</p>';
            submitBtn.disabled = true;
            return;
        }

        submitBtn.disabled = false;

        switch (eventName) {
            case 'Dark Side of the Rainbow':
            case 'The Fast & The Furious':
                dynamicFormFields.innerHTML = `
                    <div class="form-group">
                        <label>Division:</label>
                        <select id="field-rx" required>
                            <option value="Rx">Rx</option>
                            <option value="Scaled">Scaled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Minutes:</label>
                        <input type="number" id="field-minutes" min="0" placeholder="0" required>
                    </div>
                    <div class="form-group">
                        <label>Seconds:</label>
                        <input type="number" id="field-seconds" min="0" max="59" placeholder="0" required>
                    </div>
                `;
                break;

            case 'The Three Amigos':
                dynamicFormFields.innerHTML = `
                    <div class="form-group">
                        <label>Total Calories:</label>
                        <input type="number" id="field-calories" min="0" placeholder="0" required>
                    </div>
                `;
                break;

            case 'Tire Fire':
                dynamicFormFields.innerHTML = `
                    <div class="form-group">
                        <label>Division:</label>
                        <select id="field-rx" required>
                            <option value="Rx">Rx</option>
                            <option value="Scaled">Scaled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Total Reps:</label>
                        <input type="number" id="field-reps" min="0" placeholder="0" required>
                    </div>
                `;
                break;

            case 'The Jerk':
                renderMultiMemberForm(4, (i) => `
                    <div class="member-card">
                        <h4>Member ${i}</h4>
                        <div class="member-card-fields">
                            <div class="form-group">
                                <label>Gender:</label>
                                <select id="field-gender-${i}" required>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Weight (lbs):</label>
                                <input type="number" id="field-weight-${i}" min="0" placeholder="0" required>
                            </div>
                        </div>
                    </div>
                `);
                break;

            case "White Men Can't Jump":
                renderMultiMemberForm(4, (i) => `
                    <div class="member-card">
                        <h4>Member ${i}</h4>
                        <div class="member-card-fields">
                            <div class="form-group">
                                <label>Gender:</label>
                                <select id="field-gender-${i}" required>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Max Height (in):</label>
                                <input type="number" id="field-height-${i}" min="0" placeholder="0" required>
                            </div>
                            <div class="form-group">
                                <label>Free Throw Points:</label>
                                <input type="number" id="field-ft-${i}" min="0" placeholder="0" required>
                            </div>
                        </div>
                    </div>
                `);
                break;
        }
    }

    function renderMultiMemberForm(count, templateFn) {
        let html = '<div class="member-cards">';
        for (let i = 1; i <= count; i++) {
            html += templateFn(i);
        }
        html += '</div>';
        dynamicFormFields.innerHTML = html;
    }

    function validateForm() {
        if (!selectedTeam || !eventSelect.value) {
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
        }
    }

    // 4. Form Submission (POST)
    scoreForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedTeam) {
            showStatus(formStatus, 'error', 'Please select a Team before submitting.');
            return;
        }

        const eventName = eventSelect.value;
        if (!eventName) {
            showStatus(formStatus, 'error', 'Please select an Event.');
            return;
        }

        submitBtn.disabled = true;
        showStatus(formStatus, 'info', 'Submitting score...');

        try {
            const payloads = buildPayloads(eventName, selectedTeam);

            // Execute POST requests (sequential or Promise.all)
            for (const payload of payloads) {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
            }

            showStatus(formStatus, 'success', `Successfully recorded score for ${selectedTeam} in ${eventName}!`);
            scoreForm.reset();
            renderFormForEvent(eventName);
        } catch (err) {
            console.error('Submission error:', err);
            showStatus(formStatus, 'error', `Failed to submit score: ${err.message || 'Network error'}`);
        } finally {
            submitBtn.disabled = false;
        }
    });

    function buildPayloads(eventName, team) {
        const payloads = [];

        if (eventName === 'Dark Side of the Rainbow' || eventName === 'The Fast & The Furious') {
            const rx = document.getElementById('field-rx').value;
            const minutes = Number(document.getElementById('field-minutes').value || 0);
            const seconds = Number(document.getElementById('field-seconds').value || 0);
            payloads.push({
                sheetName: eventName,
                team: team,
                values: [rx, minutes, seconds],
                offset: 0
            });
        } else if (eventName === 'The Three Amigos') {
            const calories = Number(document.getElementById('field-calories').value || 0);
            payloads.push({
                sheetName: eventName,
                team: team,
                values: [calories],
                offset: 0
            });
        } else if (eventName === 'Tire Fire') {
            const rx = document.getElementById('field-rx').value;
            const reps = Number(document.getElementById('field-reps').value || 0);
            payloads.push({
                sheetName: eventName,
                team: team,
                values: [rx, reps],
                offset: 0
            });
        } else if (eventName === 'The Jerk') {
            for (let i = 1; i <= 4; i++) {
                const gender = document.getElementById(`field-gender-${i}`).value;
                const weight = Number(document.getElementById(`field-weight-${i}`).value || 0);
                payloads.push({
                    sheetName: eventName,
                    team: team,
                    values: [gender, weight],
                    offset: i - 1
                });
            }
        } else if (eventName === "White Men Can't Jump") {
            for (let i = 1; i <= 4; i++) {
                const gender = document.getElementById(`field-gender-${i}`).value;
                const height = Number(document.getElementById(`field-height-${i}`).value || 0);
                const ftPoints = Number(document.getElementById(`field-ft-${i}`).value || 0);
                payloads.push({
                    sheetName: eventName,
                    team: team,
                    values: [gender, height, ftPoints],
                    offset: i - 1
                });
            }
        }

        return payloads;
    }

    // 5. Live Leaderboard (GET)
    refreshLeaderboardBtn.addEventListener('click', () => {
        fetchLeaderboard();
    });

    async function fetchLeaderboard() {
        showStatus(leaderboardStatus, 'info', 'Loading live rankings...');
        leaderboardTbody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-cell">Fetching summary data...</td>
            </tr>
        `;

        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?sheetName=Summary`);
            if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}`);
            }
            const data = await res.json();
            renderLeaderboard(data);
            showStatus(leaderboardStatus, 'success', 'Leaderboard updated.');
            setTimeout(() => {
                leaderboardStatus.style.display = 'none';
            }, 3000);
        } catch (err) {
            console.error('Leaderboard error:', err);
            showStatus(leaderboardStatus, 'error', `Unable to load leaderboard. (${err.message})`);
            leaderboardTbody.innerHTML = `
                <tr>
                    <td colspan="3" class="loading-cell">Failed to load data. Please click refresh to try again.</td>
                </tr>
            `;
        }
    }

    function renderLeaderboard(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            leaderboardTbody.innerHTML = `
                <tr>
                    <td colspan="3" class="loading-cell">No leaderboard data available.</td>
                </tr>
            `;
            return;
        }

        // Assuming first row is headers if array of arrays or array of objects
        if (Array.isArray(data[0])) {
            const headers = data[0];
            leaderboardTheadTr.innerHTML = headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('');

            const rows = data.slice(1);
            if (rows.length === 0) {
                leaderboardTbody.innerHTML = `<tr><td colspan="${headers.length}" class="loading-cell">No entries yet.</td></tr>`;
                return;
            }

            leaderboardTbody.innerHTML = rows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${escapeHtml(String(cell !== null && cell !== undefined ? cell : ''))}</td>`).join('')}
                </tr>
            `).join('');
        } else if (typeof data[0] === 'object') {
            const keys = Object.keys(data[0]);
            leaderboardTheadTr.innerHTML = keys.map(k => `<th>${escapeHtml(k)}</th>`).join('');

            leaderboardTbody.innerHTML = data.map(rowObj => `
                <tr>
                    ${keys.map(k => `<td>${escapeHtml(String(rowObj[k] !== undefined ? rowObj[k] : ''))}</td>`).join('')}
                </tr>
            `).join('');
        }
    }

    // Helper functions
    function showStatus(element, type, message) {
        element.className = `status-message ${type}`;
        element.textContent = message;
        element.style.display = 'block';
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
