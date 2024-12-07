const views = {
	// Auth views
	async alreadyLoggedIn() {
		return html.alreadyLoggedIn;
	},

	async alreadyLoggedInScripts() {
		if (!await api.checkAuth()) { return router.navigateTo('/login'); }
		const data = await api.getProfileInfo();
		document.getElementById('alreadyLoggedInUsername').textContent = "You are already logged in as " + data.username;
	},

	async home() {
		if (!await api.checkAuth()) { return router.navigateTo('/login'); }
		document.getElementById('overlay').innerHTML = html.overlay;
		document.getElementById('status-overlay').innerHTML = html.statusOverlay;
		document.getElementById('header').innerHTML = html.header;
		overlayManager.addEventListeners();
		const data = await api.getHeaderInfo();
		['profileBtn', 'notificationBtn'].forEach(id => document.getElementById(id).classList.remove('d-none'));
		document.getElementById('headerUsername').textContent = data.username;
		document.getElementById('headerLevel').textContent = "LV." + data.stat.level;
		document.getElementById('headerProfileImage').src = data.image_url.avatar_url;
		return html.home;
	},


	async login() {
		if (await api.checkAuth()) { return router.navigateTo('/already-logged-in'); }
		return html.login;
	},

	loginScripts() {
		document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
			e.preventDefault();
			const res = await api.login(document.getElementById('username').value, document.getElementById('password').value);
			if (res.success === 'true') {
				router.navigateTo('/');
			}
			else {
				const err = document.getElementById('loginError');
				err.textContent = res.error || 'Login failed';
				err.classList.remove('d-none');
			}
		});
	},

	async login42() {
		if (await api.checkAuth()) { return router.navigateTo('/already-logged-in'); }
		return html.login42;
	},

	login42Scripts() {
		document.getElementById('loginForm')?.addEventListener('submit', (e) => {
			e.preventDefault();
			window.location.href = '/42login';
		});
	},

	async register() {
		if (await api.checkAuth()) { return router.navigateTo('/already-logged-in'); }
		return html.register;
	},

	registerScripts() {
		document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
			e.preventDefault();
			const res = await api.register(
				document.getElementById('username').value,
				document.getElementById('email').value,
				document.getElementById('password1').value,
				document.getElementById('password2').value
			);
			if (res.success === 'true') {
				router.navigateTo('/login');
			}
			else if (res.errors) {
				Object.entries(res.errors).forEach(([field, errors]) => {
					const elem = document.getElementById(field === 'non_field_errors' ? 'non-field-errors' : `invalid-${field}`);
					if (elem) {
						elem.textContent = errors.join(' ');
						elem.classList.remove('d-none');
					}
				});
			}
		});
	},

	async logout() {
		overlayManager.removeEventListener();
		await api.logout();
		['profileBtn', 'notificationBtn'].forEach(id => document.getElementById(id).classList.add('d-none'));
		router.navigateTo('/login');
	},

	// Game views

	async pongMatchmaking() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.pongMatchmaking;
	},

	pongMatchmakingScripts: () => {
		import('../../common_static/js/Matchmaking.js')
		.catch(e => console.error('Pong script error:', e));
	},

	async multiplayer() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.multiplayer;
	},

	async pongSelection() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.pongSelection;
	},

	async singleplayer() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.singleplayer;
	},
	async pong() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.pong;
	},
	async liarsbar() {
		if (!await api.checkAuth()) { router.navigateTo('/login'); }
		return html.liarsbar;
	},

	pongScripts() {
		import('../../pong_static/js/Game.js')
		.catch(e => console.error('Pong script error:', e));
	},

	liarsbarScripts() {
		import('../../liarsbar_static/js/Game.js')
		.catch(e => console.error('Liars bar script error:', e));
	},

	// Profile views
	async profile() {
		return html.profile;
	},

	async profileScripts() {
		if (!await api.checkAuth()) { return router.navigateTo('/login'); }
		const data = await api.getProfileInfo();
		const updateElement = (id, value) => document.getElementById(id).textContent = value;

		document.getElementById('profilePageImage').src = data.image_url.avatar_url;
		document.getElementById('profilePagePercent').style.width = data.stat.percentage_next_level;

		updateElement('profilePageName', data.username);
		updateElement('profilePageLevel', "LV." + data.stat.level);
		updateElement('currentExp', `${data.stat.exp} / ${data.stat.cap_exp}XP`);
		updateElement('profilePageMmr', data.stat.mmr);
		updateElement('profilePageWin', data.stat.win);
		updateElement('profilePageLose', data.stat.lose);
		updateElement('profilePageStreak', data.stat.longest_winstreak);
		updateElement('profilePagePoint', data.stat.total_points_scored);
		updateElement('profilePageLongestGame', data.stat.longest_game);
		updateElement('profilePageTime', data.stat.time_on_site);
		updateElement('profilePageCreated', data.created_at);

		matchHistory.renderMatchHistory(data.history, data.username);
	},
};

