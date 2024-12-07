const router = {
	init: function() {
		this.routes = {
			'/': 'home',
			'/about': 'about',
			'/already-logged-in': 'alreadyLoggedIn',
			'/config': 'config',
			'/leaderboard': 'leaderboard',
			'/login': 'login',
			'/login42': 'login42',
			'/logout': 'logout',
			'/multiplayer': 'multiplayer',
			'/multiplayer/liarsbar': 'liarsbar',
			'/multiplayer/pong_ranked': 'pongMatchmaking',
			'/multiplayer/pong_selection': 'pongSelection',
			'/multiplayer/pong_unranked': 'pongMatchmaking',
			'/profile': 'profile',
			'/register': 'register',
			'/singleplayer': 'singleplayer',
			'/singleplayer/pong': 'pong',
		};

		this.setupEventListeners();
		this.handleLocation();
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
		if (view) {
			document.getElementById('app').innerHTML = view;

			if (views[route + 'Scripts']) {
				views[route + 'Scripts']();
			}
		}
	},

	navigateTo: function(url) {
		if (window.location.pathname !== url) {
			history.pushState(null, null, url);
		} else {
			history.replaceState(null, null, url);
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
				this.navigateTo(path);
			}
		});

		// document.
	},
};