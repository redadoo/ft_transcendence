import api from './api.js';
import html from './html.js';
import matchHistory from './matchHistory.js';
import router from './router.js';
import setupConfigEventListeners from './Config.js';
import SocialOverlayManager from './overlay.js';
import SocketHandler from './SocketHandler.js';

const views = {
	// Auth views
	async alreadyLoggedIn() {
		return html.alreadyLoggedIn;
	},

	async alreadyLoggedInScripts() {
		const data = await api.getProfileInfo();
		document.getElementById('alreadyLoggedInUsername').textContent = "You are already logged in as " + data.username;
	},

	async home() {
		await router.overlay.initialize();
		const data = await api.getHeaderInfo();
		console.log("Header info data:", data);
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
		router.overlay.cleanup();
		await api.logout();
		['profileBtn', 'notificationBtn'].forEach(id => document.getElementById(id).classList.add('d-none'));
		router.navigateTo('/login');
	},

	// Game views

	async multiplayer() {
		return html.multiplayer;
	},

	async pongSelection() {
		return html.pongSelection;
	},

	async singleplayer() {
		return html.singleplayer;
	},

	async pong() {
		return html.pong;
	},

	async singleplayerPong() {
		return html.singleplayerPong;
	},

	async liarsbar() {
		return html.liarsbar;
	},

	pongScripts() {
		import('../../pong_static/js/Game.js')
		.catch(e => console.error('Pong script error:', e));
	},

	singleplayerPongScripts() {
		import('../../pong_static/js/Game.js')
		.catch(e => console.error('Pong script error:', e));
	},

	liarsbarScripts() {
		import('../../liarsbar_static/js/Game.js')
		.catch(e => console.error('Liars bar script error:', e));
	},

	// Profile views
	async friendsProfile() {
		return html.friendsProfile;
	},

	async friendsProfileScripts() {
		const username = router.friendProfile;
		const data = await api.getUserProfile(username);
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
		updateElement('header_text', `${username}\'s Profile`);

		matchHistory.renderMatchHistory(data.history, data.username);
	},

	async profile() {
		return html.profile;
	},

	async profileScripts() {
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

	async about() {
		return html.about;
	},

	async config() {
		return html.config;
	},

	async configScripts() {
		setupConfigEventListeners();
	},

	async lobby() {
		return html.lobby;
	},

	async lobbyScripts() {
		const lobbyCode = document.getElementById('lobbyCode');
		const copyButton = document.getElementById('copyCode');
		const startButton = document.getElementById('startGame');
		const player1Name = document.getElementById('player1Name');
		const player2Name = document.getElementById('player2Name');
		const player1Avatar = document.getElementById('player1Avatar');
		const player2Avatar = document.getElementById('player2Avatar');

		import('../../pong_static/js/Game.js')
		.catch(e => console.error('Pong script error:', e));

		await new Promise(r => setTimeout(r, 5000));

		console.log("room_name:", Window.localStorage['room_name']);
		lobbyCode.textContent = Window.localStorage['room_name'];
		api.getProfileInfo().then(data => {
			player1Name.textContent = data.username;
			player1Avatar.src = data.image_url.avatar_url;
		});

		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText(lobbyCode.textContent).then(() => {
				const originalText = copyButton.textContent;
				copyButton.textContent = 'COPIED!';
				setTimeout(() => {
					copyButton.textContent = originalText;
				}, 2000);
			});
		});
	},
};

export default views;