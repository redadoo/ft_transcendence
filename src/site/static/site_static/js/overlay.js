import api from './api.js';
import SocketManager from '../../common_static/js/SocketManager.js';

export default class SocialOverlayManager {
	constructor() {
		this.initialized = false;
		this.socialData = {
			socket: null,
			currentUsername: null,
			activeFriends: [],
			blockedContacts: [],
			registeredUsers: [],
			pendingFriendRequests: []
		};
		this.initializeUIElements();
	}

	// DOM Elements
	initializeUIElements() {
		this.socialOverlay = document.getElementById('overlay');
		this.statusOverlay = document.getElementById('statusOverlay');
		this.notificationButton = document.getElementById('notificationBtn');
		this.currentUserStatus = document.getElementById('userStatus');
		this.displayUsername = document.getElementById('overlayUsername');
		this.friendLists = {
			online: document.getElementById('onlineList'),
			all: document.getElementById('allList'),
			blocked: document.getElementById('blockedList')
		};
		this.navigationTabs = document.querySelectorAll('.tab');
		this.statusOptions = document.querySelectorAll('.nav-link-right.user-status');
		this.handleKeyboardControls = this.handleKeyboardControls.bind(this);
	}

	// Setup initial data and connections
	async initialize() {
		if (this.initialized) return;
		try {
			this.initializeNotificationSystem();
			const [currentUsername, activeFriends, blockedContacts, registeredUsers, pendingFriendRequests] = await Promise.all([
				api.getUsername(),
				api.getFriendUsers(),
				api.getBlockedUsers(),
				api.getAllUsers(),
				api.getPendingFriendRequests()
			]);

			this.socialData = {
				...this.socialData,
				currentUsername,
				activeFriends,
				blockedContacts,
				pendingFriendRequests,
				registeredUsers
			}
			this.displayUsername.textContent = currentUsername;
			this.socialData.socket = new SocketManager()
			this.socialData.socket.initWebSocket('social/', this.handleSocketMessage.bind(this));
			this.updateFriendLists();
			this.setupEventHandlers();
			this.socialData.pendingFriendRequests.forEach(username => { this.handleFriendRequest(username) });

			window.handleNotificationAction = (notificationId, actionIndex) => {
				const notification = this.notifications.find(notification => notification.id === notificationId);
				if (notification && notification.actions && notification.actions[actionIndex]) {
					notification.actions[actionIndex].handler();
					this.removeNotification(notificationId);
				}
			};
			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize Social Overlay:', error);
		}
	}

	// Event listeners
	setupEventHandlers() {
		this.notificationButton?.addEventListener('click', () => this.toggleOverlay(this.socialOverlay));
		this.socialOverlay.addEventListener('click', (event) => {
			if (event.target === this.socialOverlay) this.hideOverlay(this.socialOverlay);
		});
		document.body.addEventListener('keydown', this.handleKeyboardControls);

		this.navigationTabs.forEach(tab => {
			tab.addEventListener('click', () => this.switchActiveTab(tab));
		});

		this.currentUserStatus?.addEventListener('click', (event) => {
			event.stopPropagation();
			this.toggleOverlay(this.statusOverlay);
		});
		this.statusOptions.forEach(option => {
			option.addEventListener('click', () => this.updateUserStatus(option));
		});

		// User action handlers
		document.addEventListener('click', (event) => {
			const blockButton = event.target.closest('#blockUser');
			if (blockButton) {
				const friendListItem = blockButton.closest('.friend-item');
				const targetUsername = friendListItem.querySelector('.friend-name').textContent;
				this.blockUser(targetUsername);
			}
		});

		document.addEventListener('click', (event) => {
			const unblockButton = event.target.closest('#unblockUser');
			if (unblockButton) {
				const userListItem = unblockButton.closest('.friend-item');
				const targetUsername = userListItem.querySelector('.friend-name').textContent;
				this.unblockUser(targetUsername);
			}
		});

		document.addEventListener('click', (event) => {
			const removeButton = event.target.closest('#removeFriend');
			if (removeButton) {
				const friendListItem = removeButton.closest('.friend-item');
				const targetUsername = friendListItem.querySelector('.friend-name').textContent;
				this.removeFriend(targetUsername);
			}
		});

		document.addEventListener('click', (event) => {
			const addButton = event.target.closest('#addFriend');
			if (addButton) {
				const friendListItem = addButton.closest('.friend-item');
				const targetUsername = friendListItem.querySelector('.friend-name').textContent;
				this.sendFriendRequest(targetUsername);
			}
		});

		// Search handler
		const searchInput = document.querySelector('.search-input');
		searchInput?.addEventListener('input', (event) => {
			this.handleUserSearch(event.target.value);
		});
	}

	// Search functionality
	handleUserSearch(searchTerm) {
		if (!searchTerm) {
			this.updateFriendLists();
			return;
		}

		const searchResults = this.searchUsers(searchTerm);
		this.displaySearchResults(searchResults);
	}

	searchUsers(searchTerm) {
		const term = searchTerm.toLowerCase();
		const { registeredUsers, activeFriends, blockedContacts } = this.socialData;

		return registeredUsers
			.filter(user => {
				if (user.username === this.socialData.currentUsername) {
					return false;
				}

				const matchesSearch = user.username.toLowerCase().includes(term);
				const isFriend = activeFriends.includes(user.username);
				const isBlocked = blockedContacts.includes(user.username);

				user.isFriend = isFriend;
				user.isBlocked = isBlocked;

				return matchesSearch;
			});
	}

	displaySearchResults(results) {
		const searchResultsHTML = results.map(user => {
			if (user.isBlocked) {
				return this.createBlockedUserItem(user.username, user.image_url.avatar_url);
			}
			if (user.isFriend) {
				return this.createFriendListItem(
					user.username,
					user.image_url.avatar_url,
					user.status
				);
			}
			return this.createSearchResultItem(
				user.username,
				user.image_url.avatar_url,
			);
		}).join('');

		Object.values(this.friendLists).forEach(list => {
			if (list) {
				list.innerHTML = searchResultsHTML || this.getEmptyListMessage('search');
			}
		});
	}

	// Friends list rendering
	updateFriendLists() {
		const { activeFriends, blockedContacts, registeredUsers } = this.socialData;
		const findUserDetails = username => registeredUsers.find(user => user.username === username);
		const listContents = {
			online: this.createOnlineFriendsList(activeFriends, findUserDetails),
			all: this.createCompleteFriendsList(activeFriends, findUserDetails),
			blocked: this.createBlockedUsersList(blockedContacts, findUserDetails)
		};
		Object.entries(listContents).forEach(([listType, content]) => {
			if (this.friendLists[listType]) {
				this.friendLists[listType].innerHTML = content || this.getEmptyListMessage(listType);
			}
		});
	}

	// Generate lists
	createOnlineFriendsList(activeFriends, findUserDetails) {
		return activeFriends
			.map(findUserDetails)
			.filter(friend => friend?.status === 'Online')
			.map(friend => this.createFriendListItem(
				friend.username,
				friend.image_url.avatar_url,
				friend.status
			))
			.join('');
	}

	createCompleteFriendsList(activeFriends, findUserDetails) {
		return activeFriends
			.map(friendName => {
				const friendDetails = findUserDetails(friendName);
				return friendDetails ? this.createFriendListItem(
					friendDetails.username,
					friendDetails.image_url.avatar_url,
					friendDetails.status
				) : '';
			})
			.join('');
	}

	createBlockedUsersList(blockedContacts, findUserDetails) {
		return blockedContacts
			.map(blockedName => {
				const userDetails = findUserDetails(blockedName);
				return userDetails ? this.createBlockedUserItem(
					userDetails.username,
					userDetails.image_url.avatar_url
				) : '';
			})
			.join('');
	}

	// UI elements creation
	createFriendListItem(username, avatarUrl, status) {
		return `
			<div class="friend-item" id="friendItem">
				<img src="${avatarUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-status ${status.toLowerCase()}">${status}</span>
				<span class="friend-action" id="blockUser">🔒</span>
				<span class="friend-action" id="removeFriend">💔</span>
			</div>
		`;
	}

	createBlockedUserItem(username, avatarUrl) {
		return `
			<div class="friend-item">
				<img src="${avatarUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-action" id="unblockUser">🔓</span>
			</div>
		`;
	}

	createSearchResultItem(username, avatarUrl) {
		return `
			<div class="friend-item" id="friendItem">
				<img src="${avatarUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-action" id="addFriend">❤️</span>
			</div>
		`;
	}

	getEmptyListMessage(listType) {
		const messages = {
			online: 'No online friends',
			all: 'No friends added',
			blocked: 'No blocked users',
			search: 'No users found'
		};
		return `<div class="pixel-font no-friends">${messages[listType]}</div>`;
	}

	// WebSocket handling
	handleSocketMessage(event) {
		try {
			const socketData = JSON.parse(event.data);
			const messageHandlers = {
				'get_status_change': () => this.handleFriendStatusUpdate(socketData.friend_username, socketData.new_status),
				'get_blocked': () => this.handleUserBlocked(socketData.username),
				'get_unblocked': () => this.handleUserUnblocked(socketData.username),
				'get_friend_request': () => this.handleFriendRequest(socketData.username),
				'get_friend_request_accepted': () => this.handleFriendRequestAccepted(socketData.username),
				'get_friend_request_declined': () => this.handleFriendRequestDeclined(socketData.username),
				'get_friend_removed': () => this.handleFriendRemoved(socketData.username),
			};

			const handler = messageHandlers[socketData.type];
			if (handler) {
				handler();
			} else {
				console.log('Unhandled WebSocket message:', socketData);
			}
		} catch (error) {
			console.error('Error processing WebSocket message:', error);
		}
	}

	// Status updates
	handleFriendStatusUpdate(username, newStatus) {
		const friend = this.socialData.registeredUsers.find(user => user.username === username);
		if (friend) {
			friend.status = newStatus;
			this.updateFriendLists();
			this.addNotification({
				type: 'status_update',
				title: 'Friend Status Update',
				message: `${username} is now ${newStatus}`
			});
		}
	}

	handleUserBlocked(username) {
		this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== username);
		this.updateFriendLists();
	}

	handleUserUnblocked(username) {
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.updateFriendLists();
		}
	}

	handleFriendRequest(username) {
		if (!this.socialData.pendingFriendRequests.includes(username)) {
			this.socialData.pendingFriendRequests.push(username);
		}

		this.addNotification({
			type: 'friend_request',
			title: 'Friend Request',
			message: `${username} wants to be your friend`,
			actions: [
				{
					label: 'Accept',
					handler: () => this.acceptFriendRequest(username)
				},
				{
					label: 'Decline',
					handler: () => this.declineFriendRequest(username)
				}
			]
		});
	}

	handleFriendRequestAccepted(username) {
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.updateFriendLists();
		}

		this.addNotification({
			type: 'friend_request',
			title: 'Friend Request Accepted',
			message: `${username} accepted your friend request`
		});
	}

	handleFriendRequestDeclined(username) {
		this.addNotification({
			type: 'friend_request',
			title: 'Friend Request Declined',
			message: `${username} declined your friend request`
		});
	}

	handleFriendRemoved(username) {
		this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== username);
		this.updateFriendLists();

		this.addNotification({
			type: 'friend_removed',
			title: 'Friend Removed',
			message: `${username} removed you as a friend`
		});
	}

	// User actions
	updateUserStatus(statusOption) {
		const newStatus = statusOption.dataset.status;
		if (this.currentUserStatus) {
			this.currentUserStatus.textContent = newStatus;
			this.currentUserStatus.className = `friend-status ${newStatus.toLowerCase()}`;
		}
		this.hideOverlay(this.statusOverlay);
		this.sendStatusUpdate(newStatus);
	}

	blockUser(targetUsername) {
		if (!this.socialData.blockedContacts.includes(targetUsername)) {
			this.socialData.blockedContacts.push(targetUsername);
			this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== targetUsername);
			this.updateFriendLists();
			this.sendBlockUserUpdate(targetUsername);
		}
	}

	unblockUser(targetUsername) {
		if (this.socialData.blockedContacts.includes(targetUsername)) {
			this.socialData.activeFriends.push(targetUsername);
			this.socialData.blockedContacts = this.socialData.blockedContacts.filter(blocked => blocked !== targetUsername);
			this.updateFriendLists();
			this.sendUnblockUserUpdate(targetUsername);
		}
	}

	removeFriend(targetUsername) {
		if (this.socialData.activeFriends.includes(targetUsername)) {
			this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== targetUsername);
			this.updateFriendLists();
			this.sendRemoveFriendUpdate(targetUsername);
		}
	}

	acceptFriendRequest(username) {
		this.socialData.pendingFriendRequests = this.socialData.pendingFriendRequests.filter(request => request !== username);
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.updateFriendLists();
		}
		this.sendFriendRequestAcceptedUpdate(username);
	}

	declineFriendRequest(username) {
		this.socialData.pendingFriendRequests = this.socialData.pendingFriendRequests.filter(request => request !== username);
		this.sendFriendRequestDeclinedUpdate(username);
	}

	// Socket messages
	sendStatusUpdate(newStatus) {
		this.socialData.socket.send(JSON.stringify({
			type: 'status_change',
			new_status: newStatus
		}));
	}

	sendBlockUserUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'block_user',
			username: targetUsername
		}));
	}

	sendUnblockUserUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'unblock_user',
			username: targetUsername
		}));
	}

	sendFriendRequest(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'friend_request',
			username: targetUsername
		}));
	}

	sendFriendRequestAcceptedUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'friend_request_accepted',
			username: targetUsername
		}));
	}

	sendFriendRequestDeclinedUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'friend_request_declined',
			username: targetUsername
		}));
	}

	sendRemoveFriendUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'remove_friend',
			username: targetUsername
		}));
	}

	//Notification System methods
	initializeNotificationSystem() {
		this.notifications = [];
		this.notificationCount = 0;
		this.notificationContainer = document.getElementById('notifications');
		this.notificationCountDisplay = document.getElementById('notificationCount');
	}

	addNotification(notification) {
		const notificationId = Date.now();
		const notificationData = {
			id: notificationId,
			...notification
		};

		this.notifications.unshift(notificationData);
		this.notificationCount++;
		this.updateNotificationDisplay();

		if (!notification.actions) {
			setTimeout(() => this.removeNotification(notificationId), 5000);
		}
	}

	removeNotification(notificationId) {
		const index = this.notifications.findIndex(notification => notification.id === notificationId);
		if (index !== -1) {
			this.notifications.splice(index, 1);
			this.notificationCount = Math.max(0, this.notificationCount - 1);
			this.updateNotificationDisplay();
		}
	}

	updateNotificationDisplay() {
		this.notificationCountDisplay.textContent = this.notificationCount;

		// Update notifications list
		this.notificationContainer.innerHTML = this.notifications.map(notification => `
			<div class="notification-item ${notification.type}" id="notification-${notification.id}">
				<div class="notification-content">
					<div class="notification-title pixel-font">${notification.title}</div>
					<div class="notification-message pixel-font">${notification.message}</div>
					${notification.actions ? `
						<div class="notification-actions">
							${notification.actions.map((action, index) => `
								<button class="notification-action pixel-font"
										onclick="window.handleNotificationAction(${notification.id}, ${index})">
									${action.label}
								</button>
							`).join('')}
						</div>
					` : ''}
				</div>
			</div>
		`).join('');
	}

	// UI handlers
	switchActiveTab(selectedTab) {
		this.navigationTabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
		const selectedListType = selectedTab.textContent.trim().toLowerCase();
		Object.entries(this.friendLists).forEach(([listType, list]) => {
			if (list) {
				list.classList.toggle('d-none', listType !== selectedListType);
			}
		});
	}

	handleKeyboardControls(event) {
		switch (event.key) {
			case 'Tab':
				event.preventDefault();
				this.toggleOverlay(this.socialOverlay);
				break;
			case 'Escape':
				this.hideOverlay(this.socialOverlay);
				break;
		}
	}

	// Utility methods
	toggleOverlay(overlayElement) {
		overlayElement?.classList.contains('d-none') ? this.showOverlay(overlayElement) : this.hideOverlay(overlayElement);
	}

	showOverlay(overlayElement) {
		overlayElement?.classList.remove('d-none');
	}

	hideOverlay(overlayElement) {
		overlayElement?.classList.add('d-none');
	}

	cleanup() {
		document.body.removeEventListener('keydown', this.handleKeyboardControls);
		this.socialData.socket.close();
	}
}