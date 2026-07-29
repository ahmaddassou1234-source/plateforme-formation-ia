const API_URL = 'http://localhost:3000/api';

// --- Identité institutionnelle commune à toutes les pages ---
function injectChrome() {
    if (!document.getElementById('gov-topbar')) {
        const topbar = document.createElement('div');
        topbar.id = 'gov-topbar';
        topbar.className = 'gov-topbar';
        topbar.innerHTML = `
            <div class="gov-topbar__inner">
                <span>Royaume du Maroc</span>
                <span>Ministère de l'Éducation Nationale, du Préscolaire et des Sports</span>
            </div>
            <div class="gov-topbar__accent"></div>`;
        document.body.insertBefore(topbar, document.body.firstChild);
    }
    if (!document.getElementById('site-footer')) {
        const footer = document.createElement('footer');
        footer.id = 'site-footer';
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="site-footer__top">
                <div class="site-footer__col">
                    <h4>Formation en IA</h4>
                    <p>Plateforme officielle du MENPS dédiée à la montée en compétences des enseignants en intelligence artificielle, réalisée avec l'appui de l'UNESCO.</p>
                </div>
                <div class="site-footer__col">
                    <h4>Liens utiles</h4>
                    <a href="https://www.men.gov.ma" target="_blank" rel="noopener">Portail du MENPS</a>
                    <a href="https://www.gov.ma" target="_blank" rel="noopener">Portail national gov.ma</a>
                </div>
                <div class="site-footer__col">
                    <h4>Informations légales</h4>
                    <a href="#">Mentions légales</a>
                    <a href="#">Accessibilité : non conforme</a>
                    <a href="#">Données personnelles</a>
                </div>
            </div>
            <div class="site-footer__bottom">© 2026 Ministère de l'Éducation Nationale, du Préscolaire et des Sports — Direction des Ressources Pédagogiques et Numériques (DRPN)</div>`;
        document.body.appendChild(footer);
    }
}
injectChrome();

function getToken() { return localStorage.getItem('token'); }
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function setAuth(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/index.html'; }

function updateHeader() {
    const token = getToken(), user = getUser();
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const navAdmin = document.getElementById('nav-admin-link');
    if (token && user) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (userName) userName.textContent = user.nom;
        if (navAdmin) navAdmin.classList.toggle('hidden', user.role !== 'Administrateur');
        initSupportWidget();
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (navAdmin) navAdmin.classList.add('hidden');
    }
}

// --- Contact du support (accessible depuis toutes les pages connectées) ---
function initSupportWidget() {
    if (document.getElementById('support-widget')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'support-widget';
    wrapper.innerHTML = `
        <button id="support-fab" class="support-fab" title="Contacter le support">Aide</button>
        <div id="support-modal" class="support-modal hidden">
            <div class="support-modal__box">
                <h3>Contacter le support</h3>
                <div id="support-alert" class="fr-alert hidden"></div>
                <form id="support-form">
                    <div class="fr-form-group">
                        <label class="fr-label" for="support-sujet">Sujet</label>
                        <input type="text" id="support-sujet" class="fr-input" required>
                    </div>
                    <div class="fr-form-group">
                        <label class="fr-label" for="support-message">Message</label>
                        <textarea id="support-message" class="fr-input" rows="4" required></textarea>
                    </div>
                    <div style="display:flex;gap:0.5rem;margin-top:1rem">
                        <button type="submit" class="fr-btn">Envoyer</button>
                        <button type="button" class="fr-btn fr-btn--secondary" onclick="toggleSupportModal(false)">Fermer</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.appendChild(wrapper);
    document.getElementById('support-fab').addEventListener('click', () => toggleSupportModal(true));
    document.getElementById('support-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await api('/support', { method: 'POST', body: {
                sujet: document.getElementById('support-sujet').value,
                contenu: document.getElementById('support-message').value
            }});
            showAlert('support-alert', 'Message envoyé au support. Vous serez recontacté rapidement.', 'success');
            document.getElementById('support-form').reset();
        } catch (err) { showAlert('support-alert', err.message, 'error'); }
    });
}
function toggleSupportModal(show) {
    const modal = document.getElementById('support-modal');
    if (modal) modal.classList.toggle('hidden', !show);
}

async function api(endpoint, options = {}) {
    const token = getToken();
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) },
        ...options
    };
    if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erreur serveur');
        return data;
    } catch (error) { console.error('API Error:', error); throw error; }
}

function showAlert(elementId, message, type = 'info') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `fr-alert fr-alert--${type}`;
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function requireAuth() { if (!getToken()) window.location.href = 'login.html'; }
function requireAdmin() { const user = getUser(); if (!user || user.role !== 'Administrateur') window.location.href = 'modules.html'; }
