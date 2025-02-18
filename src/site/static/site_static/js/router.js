import api from './api.js';
import {HeaderText, FooterText}  from './HeaderFooterText.js';
import html from './html.js';
import overlayManager from './overlay.js';
import views from './views.js';
import Tournament from './Tournament.js';

const router = {
	init: function() {
		this.routes = {
			'/': 'home',
			'/about': 'about',
			'/already-logged-in': 'alreadyLoggedIn',
			'/config': 'config',
			'/friends-profile': 'friendsProfile',
			'/leaderboard': 'leaderboard',
			'/lobby': 'lobby',
			'/lobby/guest': 'lobbyGuest',
			'/lobby/playing': 'lobbyPlaying',
			'/login': 'login',
			'/login42': 'login42',
			'/logout': 'logout',
			'/multiplayer': 'multiplayer',
			'/multiplayer/liarsbar': 'liarsbar',
			'/multiplayer/pong_ranked': 'pong',
			'/multiplayer/pong_unranked': 'pong',
			'/multiplayer/pong_selection': 'pongSelection',
			'/tournament': 'tournament',
			'/tournament/guest': 'tournamentGuest',
			'/tournament/playing': 'tournamentPlaying',
			'/match-result': 'matchResult',
			'/profile': 'profile',
			'/register': 'register',
			'/singleplayer/pong': 'singleplayerPong',
		};

		this.firstLoad = true;
		this.friendProfile = null;

		document.getElementById('overlay').innerHTML = html.overlay;
		document.getElementById('statusOverlay').innerHTML = html.statusOverlay;
		document.getElementById('pongOverlay').innerHTML = html.pongOverlay;
		document.getElementById('header').innerHTML = html.header;

		this.tournament = new Tournament();

		this.overlay = new overlayManager();
		this.setupEventListeners();

		this.navigateTo(window.location.pathname);
	},

	async handleLocation() {
		const path = window.location.pathname;
		const route = this.routes[path] || 'notFound';


		if (!views[route]) {
			console.error(`View "${route}" not found`);
			this.navigateTo('/');
			return;
		}

		const view = await views[route]();
		console.log('Rendering view:', route);
		if (view) {
			document.getElementById('app').innerHTML = view;
			document.getElementById('header_text').innerText = HeaderText[route];
			document.getElementById('footer').innerText = FooterText[route];

			if (views[route + 'Scripts']) {
				views[route + 'Scripts']();
			}
		}
	},

	navigateTo: async function(url) {
		if (window.location.pathname !== url) {
			history.pushState(null, null, url);
		} else {
			history.replaceState(null, null, url);
		}


		if (!await api.checkAuth() && url !== '/login' && url !== '/register' && url !== '/login42') {
			console.log('Not authenticated, redirecting to login');
			this.navigateTo('/login');
			return;
		}

		if (this.firstLoad) {
			this.firstLoad = false;
			this.navigateTo('/');
			return;
		}

		this.handleLocation();
	},

	setupEventListeners: function() {
		window.addEventListener('popstate', this.handleLocation.bind(this));

		document.body.addEventListener('click', (e) => {
			const link = e.target.closest('[data-link]');
			if (link) {
				e.preventDefault();
				const path = link.getAttribute('data-link');
				console.log('Navigating to:', path);
				if (path === '/friends-profile') {
					this.friendProfile = link.getAttribute('data-username');
				}

				this.navigateTo(path);
			}
		});
	},
};

document.addEventListener('DOMContentLoaded', () => {
	router.init();
	console.log('App initialized');
});

export default router;