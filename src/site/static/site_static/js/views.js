	const views = {
		// AlreadyLoggedIn
		async alreadyLoggedIn() {
			return html.alreadyLoggedIn;
		},

		// Home
		async home() {
			try {
				const isAuthenticated = await api.checkAuth();
				if (!isAuthenticated) {
					router.navigateTo('/login');
					return;
				}

				const HeaderInfo = await api.getHeaderInfo();

				const profileButton = document.getElementById('profileBtn');
				const notificationBtn = document.getElementById('notificationBtn');
				const headerUsername = document.getElementById('headerUsername');
				const headerLevel = document.getElementById('headerLevel');
				const headerProfileImage = document.getElementById('headerProfileImage');


				profileButton.classList.remove('d-none');
				notificationBtn.classList.remove('d-none');
				headerUsername.textContent = HeaderInfo.username;
				headerLevel.textContent = "LV." + HeaderInfo.stat.level;
				headerProfileImage.src = HeaderInfo.image_url.avatar_url;

				return html.home;
			} catch (error) {
				console.error('Auth check failed:', error);
				return;
			}
		},

		// Login
		async login() {
			const isAuthenticated = await api.checkAuth();
			if (isAuthenticated) {
				router.navigateTo('/already-logged-in');
				return;
			}
			return html.login;
		},

		loginScripts() {
			const form = document.getElementById('loginForm');
			if (!form) return;

			form.addEventListener('submit', async (e) => {
				e.preventDefault();

				const username = document.getElementById('username').value;
				const password = document.getElementById('password').value;
				const errorDiv = document.getElementById('loginError');

				try {
					const response = await api.login(username, password);

					if (response.success === 'true') {
						router.navigateTo('/');
					} else {
						errorDiv.textContent = response.error || 'Login failed';
						errorDiv.classList.remove('d-none');
					}
				} catch (error) {
					console.error('Login error:', error);
					errorDiv.textContent = 'An error occurred during login';
					errorDiv.classList.remove('d-none');
				}
			});
		},

		// Login42
		async login42() {
			const isAuthenticated = await api.checkAuth();
			if (isAuthenticated) {
				router.navigateTo('/already-logged-in');
				return;
			}
			return html.login42;
		},

		login42Scripts() {
			const form = document.getElementById('loginForm');
			if (!form) return;

			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const errorDiv = document.getElementById('loginError');

				try {
					await api.login42();
				} catch (error) {
					console.error('Login error:', error);
					errorDiv.textContent = 'An error occurred during login';
					errorDiv.classList.remove('d-none');
				}
			});
		},

		// Logout
		async logout() {
			await api.logout();
			const profileButton = document.getElementById('profileBtn');
			const notificationBtn = document.getElementById('notificationBtn');

			profileButton.classList.add('d-none');
			notificationBtn.classList.add('d-none');
			router.navigateTo('/login');
		},

		// Multiplayer
		async multiplayer() {
			return html.multiplayer;
		},

		// Pong
		async pong() {
			return html.pong;
		},

		pongScripts() {
			import('../../pong_static/js/Game.js')
				.then(module => {
					console.log('Pong script loaded');
				})
				.catch(error => {
					console.error('Pong script error:', error);
				});
		},

		// Profile
		async profile() {
			return html.profile;
		},

		async profileScripts() {
			try {
				const isAuthenticated = await api.checkAuth();
				if (!isAuthenticated) {
					router.navigateTo('/login');
					return;
				}

				const ProfileInfo = await api.getProfileInfo();

				const profilePageImage = document.getElementById('profilePageImage');
				const profilePageName = document.getElementById('profilePageName');
				const profilePageLevel = document.getElementById('profilePageLevel');
				const profilePagePercent = document.getElementById('profilePagePercent');
				const currentExp = document.getElementById('currentExp');
				const profilePageMmr = document.getElementById('profilePageMmr');
				const profilePageWin = document.getElementById('profilePageWin');
				const profilePageLose = document.getElementById('profilePageLose');
				const profilePageStreak = document.getElementById('profilePageStreak');
				const profilePagePoint = document.getElementById('profilePagePoint');
				const profilePageLongestGame = document.getElementById('profilePageLongestGame');
				const profilePageTime = document.getElementById('profilePageTime');
				const profilePageCreated = document.getElementById('profilePageCreated');

				profilePageImage.src = ProfileInfo.image_url.avatar_url;
				profilePageName.textContent = ProfileInfo.username;
				profilePageLevel.textContent = "LV." + ProfileInfo.stat.level;
				profilePagePercent.style.width = ProfileInfo.stat.percentage_next_level;
				currentExp.textContent = ProfileInfo.stat.exp + " / " + ProfileInfo.stat.cap_exp + "XP";
				profilePageMmr.textContent = ProfileInfo.stat.mmr;
				profilePageWin.textContent = ProfileInfo.stat.win;
				profilePageLose.textContent = ProfileInfo.stat.lose;
				profilePageStreak.textContent = ProfileInfo.stat.longest_winstreak;
				profilePagePoint.textContent = ProfileInfo.stat.total_points_scored;
				profilePageLongestGame.textContent = ProfileInfo.stat.longest_game;
				profilePageTime.textContent = ProfileInfo.stat.time_on_site;
				profilePageCreated.textContent = ProfileInfo.created_at;



			} catch (error) {
				console.error('Profile info error:', error);
				return;
			}
		},

		// Register
		async register() {
			const isAuthenticated = await api.checkAuth();
			if (isAuthenticated) {
				router.navigateTo('/already-logged-in');
				return;
			}
			return html.register;
		},

		registerScripts() {
			const form = document.getElementById('registerForm');
			if (!form) return;

			form.addEventListener('submit', async (e) => {
				e.preventDefault();

				const username = document.getElementById('username').value;
				const email = document.getElementById('email').value;
				const password1 = document.getElementById('password1').value;
				const password2 = document.getElementById('password2').value;

				const errorDiv = document.getElementById('non-field-errors');
				const invalidUsername = document.getElementById('invalid-username');
				const invalidEmail = document.getElementById('invalid-email');
				const invalidPassword1 = document.getElementById('invalid-password1');
				const invalidPassword2 = document.getElementById('invalid-password2');

				try {
					const response = await api.register(username, email, password1, password2);
					if (response.success === 'true') {
						router.navigateTo('/login');
					} else {
						if (response.errors) {
							if (response.errors.non_field_errors) {
								errorDiv.textContent = response.errors.non_field_errors.join(' ');
								errorDiv.classList.remove('d-none');
							}
							if (response.errors.username) {
								invalidUsername.textContent = response.errors.username.join(' ');
								invalidUsername.classList.remove('d-none');
							}
							if (response.errors.email) {
								invalidEmail.textContent = response.errors.email.join(' ');
								invalidEmail.classList.remove('d-none');
							}
							if (response.errors.password1) {
								invalidPassword1.textContent = response.errors.password1.join(' ');
								invalidPassword1.classList.remove('d-none');
							}
							if (response.errors.password2) {
								invalidPassword2.textContent = response.errors.password2.join(' ');
								invalidPassword2.classList.remove('d-none');
							}
						}
					}
				} catch (error) {
					console.error('Registration error:', error);
					errorDiv.textContent = 'An error occurred during registration';
					errorDiv.classList.remove('d-none');
				}
			});
		},

		// Singleplayer
		async singleplayer() {
			return html.singleplayer;
		},
	};
