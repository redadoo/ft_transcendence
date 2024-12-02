	const api = {
		async checkAuth() {
			try {
				const response = await fetch('/api/users/is_logged_in/', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Auth check response:', data);
				return data.success === 'true';
			} catch (error) {
				console.error('Auth check failed:', error);
				return false;
			}
		},

		async getHeaderInfo() {
			try {
				const response = await fetch('/api/profile', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Header info response:', data);
				return data;
			} catch (error) {
				console.error('Header info error:', error);
				return false;
			}
		},

		async getProfileInfo() {
			try {
				const response = await fetch('/api/profile?include=created_at', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Profile info response:', data);
				return data;
			} catch (error) {
				console.error('Profile info error:', error);
				return false;
			}
		},

		async login(username, password) {
			try {
				const response = await fetch('/api/users/login/', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					body: JSON.stringify({
						username: username,
						password: password
					}),
					credentials: 'include',
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Login response:', data);
				return data;
			} catch (error) {
				console.error('Login error:', error);
				return { success: false, error: 'Network error' };
			}
		},

		async login42() {
			try {
				window.location.href = '/42login';
			} catch (error) {
				console.error('42Login error:', error);
			}
		},

		async logout() {
			try {
				const response = await fetch('/api/users/logout/', {
					method: 'GET',
					headers: {
						'Accept': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Logout response:', data);
				return data.success === 'true';
			} catch (error) {
				console.error('Logout error:', error);
				return false;
			}
		},

		async register(username, email, password1, password2) {
			try {
				const response = await fetch('/api/users/register/', {
					method: 'POST',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
						'X-Requested-With': 'XMLHttpRequest'
					},
					body: JSON.stringify({
						username: username,
						email: email,
						password1: password1,
						password2: password2
					}),
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				console.log('Register response:', data);
				return data;
			} catch (error) {
				console.error('Register error:', error);
				return false;
			}
		},
	};