import api from './api.js';
import SocketManager from '../../common_static/js/SocketManager.js';

export default class overlayManager {
	constructor() {
		this.initializeElements();
		this.data = {
			socket: new SocketManager(),
			username: null,
			friendUsers: [],
			blockedUsers: [],
			allUsers: []
		};
	}

	initializeElements() {
		this.data.socket.initWebSocket('chat/', this.handleSocketMessage.bind(this));

		this.overlay = document.getElementById('overlay');
		this.overlayStatus = document.getElementById('statusOverlay');
		this.notificationBtn = document.getElementById('notificationBtn');
		this.userStatus = document.getElementById('userStatus');
		this.overlayUsername = document.getElementById('overlayUsername');

		this.lists = {
			online: document.getElementById('onlineList'),
			all: document.getElementById('allList'),
			other: document.getElementById('otherList'),
			blocked: document.getElementById('blockedList')
		};

		this.tabs = document.querySelectorAll('.tab');
		this.userStatusOptions = document.querySelectorAll('.nav-link-right.user-status');

		this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
	}

	async initialize() {
		try {
			const [username, friendUsers, blockedUsers, allUsers] = await Promise.all([
				api.getUsername(),
				api.getFriendUsers(),
				api.getBlockedUsers(),
				api.getAllUsers()
			]);

			this.data = { username, friendUsers, blockedUsers, allUsers };

			this.overlayUsername.textContent = username;
			this.setupFriendList();
			this.setupEventListeners();
		} catch (error) {
			console.error('Failed to initialize OverlayManager:', error);
		}
	}

	setupEventListeners() {
		this.notificationBtn?.addEventListener('click', () => this.toggle(this.overlay));
		this.overlay.addEventListener('click', (e) => {
			if (e.target === this.overlay) this.hide(this.overlay);
		});

		document.body.addEventListener('keydown', this.handleKeyboardShortcuts);

		this.tabs.forEach(tab => {
			tab.addEventListener('click', () => this.handleTabSwitch(tab));
		});

		this.userStatus?.addEventListener('click', (e) => {
			e.stopPropagation();
			this.toggle(this.overlayStatus);
		});

		this.userStatusOptions.forEach(statusOption => {
			statusOption.addEventListener('click', () => this.handleStatusChange(statusOption));
		});

		document.addEventListener('click', (e) => {
			const blockBtn = e.target.closest('#blockUser');
			if (blockBtn) {
				const friendItem = blockBtn.closest('.friend-item');
				const username = friendItem.querySelector('.friend-name').textContent;
				this.handleBlockUser(username);
			}
		});

		document.addEventListener('click', (e) => {
			const unblockBtn = e.target.closest('#unblockUser');
			if (unblockBtn) {
				const friendItem = unblockBtn.closest('.friend-item');
				const username = friendItem.querySelector('.friend-name').textContent;
				this.handleUnblockUser(username);
			}
		});
	}

	setupFriendList() {
		const { friendUsers, blockedUsers, allUsers } = this.data;
		const getUserInfo = username => allUsers.find(user => user.username === username);
		const lists = {
			online: this.generateOnlineList(friendUsers, getUserInfo),
			all: this.generateFriendList(friendUsers, getUserInfo),
			other: null,
			blocked: this.generateBlockedList(blockedUsers, getUserInfo)
		};

		Object.entries(lists).forEach(([key, content]) => {
			if (this.lists[key]) {
				this.lists[key].innerHTML = content || this.getEmptyStateMessage(key);
			}
		});
	}

	generateOnlineList(friendUsers, getUserInfo) {
		return friendUsers
			.map(getUserInfo)
			.filter(friend => friend?.status === 'Online')
			.map(friend => this.createFriendElement(
				friend.username,
				friend.image_url?.avatar_url || '/media/default_avatar.png',
				friend.status
			))
			.join('');
	}

	generateFriendList(friendUsers, getUserInfo) {
		return friendUsers
			.map(friendName => {
				const friend = getUserInfo(friendName);
				return friend ? this.createFriendElement(
					friend.username,
					friend.image_url?.avatar_url || '/media/default_avatar.png',
					friend.status
				) : '';
			})
			.join('');
	}

	generateBlockedList(blockedUsers, getUserInfo) {
		return blockedUsers
			.map(blockedName => {
				const blocked = getUserInfo(blockedName);
				return blocked ? this.createBlockedElement(
					blocked.username,
					blocked.image_url?.avatar_url || '/media/default_avatar.png'
				) : '';
			})
			.join('');
	}

	getEmptyStateMessage(listType) {
		const messages = {
			online: 'No online friends',
			all: 'No friends added',
			other: 'No other users',
			blocked: 'No blocked users'
		};
		return `<div class="pixel-font no-friends">${messages[listType]}</div>`;
	}

	createFriendElement(username, imageUrl, status) {
		return `
			<div class="friend-item" id="friendItem">
				<img src="${imageUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-status">${status}</span>
				<span class="friend-action" id="openChat">💬</span>
				<span class="friend-action" id="blockUser">🔒 </span>
			</div>
		`;
	}

	createBlockedElement(username, imageUrl) {
		return `
			<div class="friend-item">
				<img src="${imageUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-action" id="unblockUser">🔓</span>
			</div>
		`;
	}

	handleSocketMessage(event) {
		console.log('Received message:', event.data);
	}

	handleBlockUser(username) {
		if (!this.data.blockedUsers.includes(username)) {
			this.data.blockedUsers.push(username);
			this.data.friendUsers = this.data.friendUsers.filter(friend => friend !== username);

			this.setupFriendList();
		}
	}

	handleUnblockUser(username) {
		if (this.data.blockedUsers.includes(username)) {
			this.data.friendUsers.push(username);
			this.data.blockedUsers = this.data.blockedUsers.filter(blocked => blocked !== username);
			this.setupFriendList();
		}
	}

	handleTabSwitch(selectedTab) {
		this.tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));

		const selectedType = selectedTab.textContent.trim().toLowerCase();
		Object.entries(this.lists).forEach(([type, list]) => {
			if (list) {
				list.classList.toggle('d-none', type !== selectedType);
			}
		});
	}

	handleStatusChange(statusOption) {
		const newStatus = statusOption.dataset.status;
		if (this.userStatus) {
			this.userStatus.textContent = newStatus;
			this.userStatus.className = `friend-status ${newStatus.toLowerCase()}`;
		}
		this.hide(this.overlayStatus);
	}

	handleKeyboardShortcuts(event) {
		switch (event.key) {
			case 'Tab':
				event.preventDefault();
				this.toggle(this.overlay);
				break;
			case 'Escape':
				this.hide(this.overlay);
				break;
		}
	}

	toggle(overlay) {
		overlay?.classList.contains('d-none') ? this.show(overlay) : this.hide(overlay);
	}

	show(overlay) {
		overlay?.classList.remove('d-none');
	}

	hide(overlay) {
		overlay?.classList.add('d-none');
	}

	cleanup() {
		document.body.removeEventListener('keydown', this.handleKeyboardShortcuts);
	}
}