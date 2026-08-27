document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const teamHeaderContainer = document.getElementById('team-header-container');
    const teamEditContainer = document.getElementById('team-edit-container');
    const editTeamBtn = document.getElementById('edit-team-btn');
    const teamEditForm = document.getElementById('team-edit-form');
    const teamNameInput = document.getElementById('team-name-input');
    const cancelTeamBtn = document.getElementById('cancel-team-btn');
    const teamEditStatus = document.getElementById('team-edit-status');

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

    // State Variables
    const urlParams = new URLSearchParams(window.location.search);
    // 1. Support ?id= (row number, 1-based index) or fallback to ?team= (legacy)
    const idParam = urlParams.get('id');
    const legacyTeamParam = urlParams.get('team');
    let teamId = idParam ? parseInt(idParam, 10) : null;
    let selectedTeam = '';
    let teamsList = []; // [{ id: 1, name: 'Team 1' }, ...]

    // Load Teams tab data
    async function loadTeamsData() {
        try {
            const rows = await fetchSheetData('Teams');
            teamsList = rows.map((r, idx) => ({
                id: idx + 1,
                name: r && r[0] ? String(r[0]).trim() : `Team ${idx + 1}`
            })).filter(t => t.name !== '');
        } catch (err) {
            console.warn('Error loading Teams sheet tab, falling back to default 11 teams:', err);
            teamsList = [];
            for (let i = 1; i <= 11; i++) {
                teamsList.push({ id: i, name: `Team ${i}` });
            }
        }
    }

    await loadTeamsData();

    // Determine selected team and render header
    if (teamId && !isNaN(teamId)) {
        const found = teamsList.find(t => t.id === teamId);
        selectedTeam = found ? found.name : `Team ${teamId}`;
        renderTeamHeaderLocked(selectedTeam);
        teamEditContainer.style.display = 'block';
    } else if (legacyTeamParam) {
        selectedTeam = legacyTeamParam;
        const found = teamsList.find(t => t.name.toLowerCase() === legacyTeamParam.toLowerCase());
        if (found) teamId = found.id;
        renderTeamHeaderLocked(selectedTeam);
        if (teamId) teamEditContainer.style.display = 'block';
    } else {
        renderTeamDropdown();
    }

    function renderTeamHeaderLocked(teamName) {
        teamHeaderContainer.innerHTML = `
            <div class="team-badge" id="team-badge">
                ${escapeHtml(teamName)}
            </div>
        `;
    }

    function renderTeamDropdown() {
        let optionsHtml = '<option value="">-- Choose Your Team --</option>';
        if (teamsList.length === 0) {
            for (let i = 1; i <= 11; i++) {
                teamsList.push({ id: i, name: `Team ${i}` });
            }
        }
        teamsList.forEach(t => {
            const selected = t.name === selectedTeam ? 'selected' : '';
            optionsHtml += `<option value="${t.id}" data-name="${escapeHtml(t.name)}" ${selected}>${escapeHtml(t.name)}</option>`;
        });

        teamHeaderContainer.innerHTML = `
            <div class="team-select-group">
                <label for="global-team-select">Team:</label>
                <select id="global-team-select">${optionsHtml}</select>
            </div>
        `;

        const globalTeamSelect = document.getElementById('global-team-select');
        globalTeamSelect.addEventListener('change', (e) => {
            const selectedOpt = globalTeamSelect.options[globalTeamSelect.selectedIndex];
            if (e.target.value) {
                teamId = parseInt(e.target.value, 10);
                selectedTeam = selectedOpt.getAttribute('data-name') || selectedOpt.text;
                teamEditContainer.style.display = 'block';
            } else {
                teamId = null;
                selectedTeam = '';
                teamEditContainer.style.display = 'none';
            }
            validateForm();
            if (selectedTeam && eventSelect.value) {
                loadExistingScores(selectedTeam, eventSelect.value);
            }
        });
    }

    // Team Name Edit Handlers
    editTeamBtn.addEventListener('click', () => {
        teamNameInput.value = selectedTeam;
        teamEditForm.style.display = 'flex';
        editTeamBtn.style.display = 'none';
        teamEditStatus.style.display = 'none';
    });

    cancelTeamBtn.addEventListener('click', () => {
        teamEditForm.style.display = 'none';
        editTeamBtn.style.display = 'inline-flex';
        teamEditStatus.style.display = 'none';
    });

    teamEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTeamName = teamNameInput.value.trim();
        if (!newTeamName) return;

        if (!selectedTeam) {
            showStatus(teamEditStatus, 'error', 'No Team selected to edit.');
            return;
        }

        showStatus(teamEditStatus, 'info', 'Updating team name...');
        const saveTeamBtn = document.getElementById('save-team-btn');
        saveTeamBtn.disabled = true;

        try {
            // Send POST payload specifically targeting 'renameTeam' action
            const payload = {
                action: "renameTeam",
                oldName: selectedTeam,
                newName: newTeamName
            };

            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            const oldTeamName = selectedTeam;
            selectedTeam = newTeamName;

            // Update in teamsList
            if (teamId) {
                const item = teamsList.find(t => t.id === teamId);
                if (item) item.name = newTeamName;
            }

            // Re-render team display
            if (idParam || legacyTeamParam) {
                renderTeamHeaderLocked(newTeamName);
            } else {
                renderTeamDropdown();
            }

            teamEditForm.style.display = 'none';
            editTeamBtn.style.display = 'inline-flex';
            showStatus(teamEditStatus, 'success', `Team name updated to "${newTeamName}"!`);
            setTimeout(() => { teamEditStatus.style.display = 'none'; }, 4000);

            // Re-load scores if an event is selected
            if (eventSelect.value) {
                loadExistingScores(selectedTeam, eventSelect.value);
            }
        } catch (err) {
            console.error('Failed to update team name:', err);
            showStatus(teamEditStatus, 'error', `Failed to update team name: ${err.message || 'Network error'}`);
        } finally {
            saveTeamBtn.disabled = false;
        }
    });

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

    // 3. Dynamic Form Schemas & Score Pre-population
    eventSelect.addEventListener('change', () => {
        renderFormForEvent(eventSelect.value);
        validateForm();
        if (selectedTeam && eventSelect.value) {
            loadExistingScores(selectedTeam, eventSelect.value);
        }
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

    // Load existing scores from Google Sheet
    async function loadExistingScores(team, eventName) {
        try {
            const rawRows = await fetchRawSheetRows(eventName);
            if (!rawRows || rawRows.length === 0) return;

            const matchingRows = rawRows.filter(r => r && r.c && r.c[0] && String(r.c[0].v).trim() === String(team).trim());
            if (matchingRows.length === 0) return;

            const getVal = (cell) => cell ? cell.v : '';

            if (eventName === 'Dark Side of the Rainbow' || eventName === 'The Fast & The Furious') {
                const c = matchingRows[0].c;
                if (c[1]) {
                    const rxEl = document.getElementById('field-rx');
                    if (rxEl) rxEl.value = getVal(c[1]);
                }
                if (c[2]) {
                    const minEl = document.getElementById('field-minutes');
                    if (minEl) minEl.value = getVal(c[2]);
                }
                if (c[3]) {
                    const secEl = document.getElementById('field-seconds');
                    if (secEl) secEl.value = getVal(c[3]);
                }
            } else if (eventName === 'The Three Amigos') {
                const c = matchingRows[0].c;
                if (c[1]) {
                    const calEl = document.getElementById('field-calories');
                    if (calEl) calEl.value = getVal(c[1]);
                }
            } else if (eventName === 'Tire Fire') {
                const c = matchingRows[0].c;
                if (c[1]) {
                    const rxEl = document.getElementById('field-rx');
                    if (rxEl) rxEl.value = getVal(c[1]);
                }
                if (c[2]) {
                    const repsEl = document.getElementById('field-reps');
                    if (repsEl) repsEl.value = getVal(c[2]);
                }
            } else if (eventName === 'The Jerk') {
                matchingRows.forEach((rObj, idx) => {
                    const memberNum = idx + 1;
                    const c = rObj.c;
                    if (c[1]) {
                        const genderEl = document.getElementById(`field-gender-${memberNum}`);
                        if (genderEl) genderEl.value = getVal(c[1]);
                    }
                    if (c[2]) {
                        const weightEl = document.getElementById(`field-weight-${memberNum}`);
                        if (weightEl) weightEl.value = getVal(c[2]);
                    }
                });
            } else if (eventName === "White Men Can't Jump") {
                matchingRows.forEach((rObj, idx) => {
                    const memberNum = idx + 1;
                    const c = rObj.c;
                    if (c[1]) {
                        const genderEl = document.getElementById(`field-gender-${memberNum}`);
                        if (genderEl) genderEl.value = getVal(c[1]);
                    }
                    if (c[2]) {
                        const heightEl = document.getElementById(`field-height-${memberNum}`);
                        if (heightEl) heightEl.value = getVal(c[2]);
                    }
                    if (c[3]) {
                        const ftEl = document.getElementById(`field-ft-${memberNum}`);
                        if (ftEl) ftEl.value = getVal(c[3]);
                    }
                });
            }
        } catch (err) {
            console.warn('Could not load existing scores for pre-population:', err);
        }
    }

    // 4. Form Submission (POST to Google Apps Script Endpoint)
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
            const payload = buildPayload(eventName, selectedTeam);

            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            showStatus(formStatus, 'success', `Successfully recorded score for ${selectedTeam} in ${eventName}!`);
            // Do not reset scoreForm or re-render dynamic fields so submitted values persist in inputs
        } catch (err) {
            console.error('Submission error:', err);
            showStatus(formStatus, 'error', `Failed to submit score: ${err.message || 'Network error'}`);
        } finally {
            submitBtn.disabled = false;
        }
    });

    function buildPayload(eventName, team) {
        if (eventName === 'Dark Side of the Rainbow' || eventName === 'The Fast & The Furious') {
            const rx = document.getElementById('field-rx').value;
            const minutes = Number(document.getElementById('field-minutes').value || 0);
            const seconds = Number(document.getElementById('field-seconds').value || 0);
            return {
                sheetName: eventName,
                team: team,
                values: [rx, minutes, seconds],
                offset: 0
            };
        } else if (eventName === 'The Three Amigos') {
            const calories = Number(document.getElementById('field-calories').value || 0);
            return {
                sheetName: eventName,
                team: team,
                values: [calories],
                offset: 0
            };
        } else if (eventName === 'Tire Fire') {
            const rx = document.getElementById('field-rx').value;
            const reps = Number(document.getElementById('field-reps').value || 0);
            return {
                sheetName: eventName,
                team: team,
                values: [rx, reps],
                offset: 0
            };
        } else if (eventName === 'The Jerk') {
            const items = [];
            for (let i = 1; i <= 4; i++) {
                const gender = document.getElementById(`field-gender-${i}`).value;
                const weight = Number(document.getElementById(`field-weight-${i}`).value || 0);
                items.push({
                    sheetName: eventName,
                    team: team,
                    values: [gender, weight],
                    offset: i - 1
                });
            }
            return {
                action: "batch",
                items: items
            };
        } else if (eventName === "White Men Can't Jump") {
            const items = [];
            for (let i = 1; i <= 4; i++) {
                const gender = document.getElementById(`field-gender-${i}`).value;
                const height = Number(document.getElementById(`field-height-${i}`).value || 0);
                const ftPoints = Number(document.getElementById(`field-ft-${i}`).value || 0);
                items.push({
                    sheetName: eventName,
                    team: team,
                    values: [gender, height, ftPoints],
                    offset: i - 1
                });
            }
            return {
                action: "batch",
                items: items
            };
        }

        return {};
    }

    // 5. Direct Google Sheet Reading via Google Visualization API (gviz/tq)
    async function fetchRawSheetRows(sheetName) {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}`);
        }
        const text = await res.text();
        const json = JSON.parse(text.substring(47, text.length - 2));
        return json.table.rows;
    }

    async function fetchSheetData(sheetName) {
        const rows = await fetchRawSheetRows(sheetName);
        return rows.map(row => row.c ? row.c.map(cell => cell ? cell.v : "") : []);
    }

    // 6. Live Leaderboard Tab Fetch & Render
    refreshLeaderboardBtn.addEventListener('click', () => {
        fetchLeaderboard();
    });

    async function fetchLeaderboard() {
        showStatus(leaderboardStatus, 'info', 'Loading live rankings...');
        leaderboardTbody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-cell">Fetching summary data directly from Google Sheet...</td>
            </tr>
        `;

        try {
            const data = await fetchSheetData('Summary');
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

        // Assuming first row is headers
        if (Array.isArray(data[0])) {
            const headers = data[0];
            leaderboardTheadTr.innerHTML = headers.map(h => `<th>${escapeHtml(String(h !== null && h !== undefined ? h : ''))}</th>`).join('');

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
