const api = {
	async fetchJson(url, options = {}) {
		try {
			const defaultOpts = {
				headers: {
					'Accept': 'application/json',
					'X-Requested-With': 'XMLHttpRequest'
				},
				credentials: 'include'
			};

			const mergedOptions = {
				...defaultOpts,
				...options,
				headers: {
					...defaultOpts.headers,
					...options.headers
				}
			};

			const response = await fetch(url, mergedOptions);
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			return await response.json();
		} catch (error) {
			throw error;
		}
	},

	async checkAuth() {
		try {
			const data = await this.fetchJson('/api/users/is_logged_in/');
			return data.success === 'true';
		} catch (error) {
			console.error('Auth check failed:', error);
			return false;
		}
	},

	async getHeaderInfo() {
		try {
			return await this.fetchJson('/api/profile');
		} catch (error) {
			console.error('Header info error:', error);
			return false;
		}
	},

	async getProfileInfo() {
		try {
			return await this.fetchJson('/api/profile?include=created_at');
		} catch (error) {
			console.error('Profile info error:', error);
			return false;
		}
	},

	async login(username, password) {
		try {
			return await this.fetchJson('/api/users/login/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			});
		} catch (error) {
			console.error('Login error:', error);
			return { success: false, error: 'Network error' };
		}
	},

	login42() {
		window.location.href = '/42login';
	},

	async logout() {
		try {
			const data = await this.fetchJson('/api/users/logout/');
			return data.success === 'true';
		} catch (error) {
			console.error('Logout error:', error);
			return false;
		}
	},

	async register(username, email, password1, password2) {
		try {
			return await this.fetchJson('/api/users/register/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, email, password1, password2 })
			});
		} catch (error) {
			console.error('Register error:', error);
			return false;
		}
	}
};