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

	async updateUsername(newUsername) {
		try {
			return await this.fetchJson('/api/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username: newUsername })
			});
		} catch (error) {
			console.error('Username change error:', error);
			return false;
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

	async getAllUsers() {
		try {
			return await this.fetchJson('/api/users?type=simple');

		} catch (error) {
			console.error('Users error:', error);
			return false;
		}
	},

	async getBlockedUsers() {
		try {
			const response = await this.fetchJson('/api/profile?include=friendships');

			const blockedNames = response.friendships
			.filter(friendship =>
				friendship.status_display === 'first_user_block' || friendship.status_display === 'second_user_block')
			.map(friendship => friendship.other_user_username);

			return blockedNames;
		} catch (error) {
			console.error('Blocked users error:', error);
			return false;
		}
	},

	async getChatMessages() {
		try {
			return await this.fetchJson('/api/chat');
		} catch (error) {
			console.error('Chat messages error:', error);
			return false;
		}
	},

	async getFriendUsers() {
		try {
			const response = await this.fetchJson('/api/profile?include=friendships');

			const friendNames = response.friendships
			.filter(friendship => friendship.status_display === 'friends')
			.map(friendship => friendship.other_user_username);

			return friendNames;
		} catch (error) {
			console.error('Friendship info error:', error);
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

	async getPendingFriendRequests() {
		try {
			const response = await this.fetchJson('/api/profile?include=friendships');

			const pendingNames = response.friendships
			.filter(friendship => friendship.status_display === 'pending')
			.map(friendship => friendship.other_user_username);

			return pendingNames;
		} catch (error) {
			console.error('Pending requests error:', error);
			return false;
		}
	},

	async getUsername() {
		try {
			const data = await this.fetchJson('/api/profile');
			return data.username;
		} catch (error) {
			console.error('Username error:', error);
			return false;
		}
	},

	async getUserProfile(username) {
		try {
			const data = await this.fetchJson(`/api/users?type=full&name=${username}`);
			return data[0];
		} catch (error) {
			console.error('User profile error:', error);
			return false;
		}
	},

	async getUsers() {
		try {
			return await this.fetchJson('/api/users?type=simple');
		} catch (error) {
			console.error('Users error:', error);
			return false;
		}
	},

	async getProfileInfo() {
		try {
			return await this.fetchJson('/api/profile?include=created_at&include=history&include=email');
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

export default api;