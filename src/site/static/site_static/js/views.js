import api from './api.js';
import html from './html.js';
import matchHistory from './matchHistory.js';
import router from './router.js';
import setupConfigEventListeners from './Config.js';
import Pong2D from '../../pong_static/js/Pong2D.js';
import Pong3D from '../../pong_static/js/Pong3D.js';

import LiarsGame from '../../liarsbar_static/js/Game.js';
import dateFormatter from './dateFormatter.js';
import './Tournament.js';

async function instantiateGameClass(player_id)
{
	let pongGame;

    if (router.is2dPong)
	{
		pongGame = new Pong2D();
		pongGame.init(player_id);
	}
    else
	{
        pongGame = new Pong3D();
		await pongGame.init(player_id);
	}

    pongGame.animate();

	return pongGame;
}

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
		if (await api.checkAuth() == false) { return router.navigateTo('/login'); }
		await router.overlay.initialize();
		const data = await api.getHeaderInfo();
		console.log("Header info data:", data);

		this.player_id = data.id;
		['profileBtn', 'notificationBtn'].forEach(id => document.getElementById(id).classList.remove('d-none'));
		document.getElementById('headerUsername').textContent = data.username;
		window.localStorage['username'] = data.username;
		document.getElementById('headerLevel').textContent = "LV." + data.stat.level;
		document.getElementById('headerProfileImage').src = data.image_url.avatar_url;
		return html.home;
	},

	async login() {
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
		const success = await api.logout();
		if (success) {
			router.overlay.cleanup();
			router.init();
			['profileBtn', 'notificationBtn'].forEach(id => document.getElementById(id).classList.add('d-none'));
		}
		router.navigateTo('/login');
	},

	// Game views

	async multiplayer() {
		return html.multiplayer;
	},

	async pongSelection() {
		return html.pongSelection;
	},

	async pongSelectionScripts() {
		const lobbyID = document.getElementById('lobbyID');

		lobbyID.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				api.checkLobby(lobbyID.value).then(res => {
					if (res.success === 'true') {
						window.localStorage['room_name'] = lobbyID.value;
						window.localStorage['invited_username'] = res.host;
						router.navigateTo('/lobby/guest');
					}
					else {
						alert('Invalid lobby ID');
					}
				});
			}
		});
	},

	async pong() {
		return html.pong;
	},

	async singleplayerPong() {
		return html.singleplayerPong;
	},

	async singleplayerPongVsBot() {
		return html.empty;
	},

	async singleplayerPongSameKeyboard() {
		return html.empty;
	},

	async liarsbar() {
		return html.liarsbar;
	},

	async pongScripts() {
		await instantiateGameClass(this.player_id);
	},

	async singleplayerPongScripts() {
	},

	async singleplayerPongVsBotScripts() {
		await instantiateGameClass(this.player_id);
	},

	async singleplayerPongSameKeyboardScripts() {
		await instantiateGameClass(this.player_id);
	},

	async liarsbarScripts() {
		const liarsGame = new LiarsGame();
		await liarsGame.init(this.player_id);
		liarsGame.sceneManager.animate();
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

		const formatTimeDelta = (seconds) => {
			const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
			const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
			const secs = (seconds % 60).toString().padStart(2, '0');
			return `${hrs}:${mins}:${secs}`;
		};


		const parseTimeDelta = (timeString) => {
			const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
			return (hours * 3600) + (minutes * 60) + Math.floor(seconds);
		};

		// Format date as DD/MM/YYYY
		const formatDate = (isoDate) => {
			const date = new Date(isoDate);
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
			const year = date.getFullYear();
			return `${day}/${month}/${year}`;
		};


		const data = await api.getProfileInfo();
		console.log(data); // Check the structure of the data

		const updateElement = (id, value) => document.getElementById(id).textContent = value;

		document.getElementById('profilePageImage').src = data.image_url.avatar_url;
		document.getElementById('profilePagePercent').style.width = data.stat.percentage_next_level;

		updateElement('profilePageName', data.username);
		updateElement('profilePageLevel', data.stat.level);
		updateElement('currentExp', `${data.stat.exp} / ${data.stat.cap_exp} XP`);
		updateElement('profilePageMmr', `${data.stat.mmr}`);
		updateElement('profilePageWin', `${data.stat.win}`);
		updateElement('profilePageLose', `${data.stat.lose}`);
		updateElement('profilePageStreak', `${data.stat.longest_winstreak}`);
		updateElement('profilePagePoint', `${data.stat.total_points_scored}`);

		let longestGameSeconds = 0;
		if (data.stat.longest_game_duration != null)
			longestGameSeconds = parseTimeDelta(data.stat.longest_game_duration);

		const longestGame = formatTimeDelta(longestGameSeconds);
		updateElement('profilePageLongestGame', `${longestGame}`);

		const timeOnSite = data.stat.time_on_site;
		if (timeOnSite)
		{
			const [hours, minutes, seconds] = timeOnSite.split(":");
			const [sec, ms] = seconds.split(".");
			const formattedTime = `${hours}:${minutes}:${sec}`;
			updateElement('profilePageTime', formattedTime);
		}
		else
			updateElement('profilePageTime', "00:00:00");

		updateElement('profilePageCreated', `${formatDate(data.created_at)}`);

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
		const player1Name = document.getElementById('player1Name');
		const player1Avatar = document.getElementById('player1Avatar');
		const startButton = document.getElementById('startGame');

		const pongGame = await instantiateGameClass(this.player_id);

		await new Promise(resolve => setTimeout(resolve, 1000));

		lobbyCode.textContent = window.localStorage['room_name'];
		api.getProfileInfo().then(data => {
			player1Name.textContent = data.username;
			player1Avatar.src = data.image_url.avatar_url;
		});

		startButton.addEventListener('click', function handleClick() {
			pongGame.mode.sendStart();
			// router.navigateTo('/lobby/playing');
			startButton.removeEventListener('click', handleClick);
		});
	},

	async lobbyGuest() {
		return html.lobbyGuest;
	},

	async lobbyPlaying() {
		return html.empty;
	},

	async lobbyPlayingScripts() {

	},

	async lobbyGuestScripts() {
		const player1Name = document.getElementById('player1Name');
		const player2Name = document.getElementById('player2Name');
		const player1Avatar = document.getElementById('player1Avatar');
		const player2Avatar = document.getElementById('player2Avatar');

		api.getProfileInfo().then(data => {
			player2Name.textContent = data.username;
			player2Avatar.src = data.image_url.avatar_url;
		});

		api.getUserProfile(window.localStorage['invited_username']).then(data => {
			player1Name.textContent = data.username;
			player1Avatar.src = data.image_url.avatar_url;
		});

		await instantiateGameClass(this.player_id);
	},

	async matchResult() {
		return html.matchResult;
	},

	async matchResultScripts() {
		const data = await api.getLastMatch();
		const updateElement = (id, value) => document.getElementById(id).textContent = value;

		updateElement('player1Name', data.first_user_username);
		updateElement('player2Name', data.second_user_username);
		updateElement('player1Score', data.first_user_score);
		updateElement('player2Score', data.second_user_score);
		updateElement('player1MMR', data.first_user_mmr_gain);
		updateElement('player2MMR', data.second_user_mmr_gain);
		updateElement('winnerName', data.winner);
		updateElement('matchDuration', dateFormatter.formatDuration(data.duration));
		updateElement('matchStart', dateFormatter.formatDateString(data.start_date));
		updateElement('matchEnd', dateFormatter.formatDateString(data.end_date));

		api.getUserProfile(data.first_user_username).then(data => {
			document.getElementById('player1Avatar').src = data.image_url.avatar_url;
		});

		api.getUserProfile(data.second_user_username).then(data => {
			document.getElementById('player2Avatar').src = data.image_url.avatar_url;
		});
	},

	async tournamentResult() {
		return html.tournamentResult;
	},

	async tournamentResultScripts() {
		const data = await api.getLastTournament();
		const updateElement = (id, value) => document.getElementById(id).textContent = value;

		updateElement('winnerName', data.winner);
		api.getUserProfile(data.winner).then(data => {
			document.getElementById('winnerAvatar').src = data.image_url.avatar_url;
		});

		let losers = data.players.filter(player => player !== data.winner);

		losers.forEach((loser, index) => {
			updateElement(`loser${index + 1}Name`, loser);
			api.getUserProfile(loser).then(data => {
				document.getElementById(`loser${index + 1}Avatar`).src = data.image_url.avatar_url;
			});
		});
	},

	async liarsbarResult() {
		return html.liarsbarResult;
	},

	async liarsbarResultScripts() {
		const data = await api.getLastLiarsbar();
		const updateElement = (id, value) => document.getElementById(id).textContent = value;

		updateElement('liarsbarWinnerName', data.user_winner_username);
		api.getUserProfile(data.user_winner_username).then(data => {
			document.getElementById('liarsbarWinnerAvatar').src = data.image_url.avatar_url;
		});

		let losers = [
			data.first_user_username,
			data.second_user_username,
			data.third_user_username,
			data.fourth_user_username
		].filter(loser => loser !== data.user_winner_username);

		losers.forEach((loser, index) => {
			updateElement(`liarsbarLoser${index + 1}Name`, loser);
			api.getUserProfile(loser).then(data => {
				document.getElementById(`liarsbarLoser${index + 1}Avatar`).src = data.image_url.avatar_url;
			});
		});
	},

	async tournament() {
		return html.tournament;
	},

	async tournamentScripts() {

		router.tournament.reset();

		const startButton = document.getElementById('startTournament');

		const pongGame = await instantiateGameClass(this.player_id);

		startButton.addEventListener('click', () => {
			pongGame.mode.sendStart();
			startButton.disabled = true;
		});
	},

	async tournamentGuest() {
		return html.tournamentGuest;
	},

	async tournamentGuestScripts() {
		router.tournament.reset();

		await instantiateGameClass(this.player_id);
	},

	async tournamentPlaying() {
		return html.empty;
	},
};

export default views;