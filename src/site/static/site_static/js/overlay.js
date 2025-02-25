// SocialOverlayManager.js
import ChatManager from './ChatManager.js';
import NotificationManager from './NotificationManager.js';
import FriendListManager from './FriendListManager.js';
import SocketHandler from './SocketHandler.js';
import api from './api.js';
import SocketManager from '../../common_static/js/SocketManager.js';
import router from './router.js';

export default class SocialOverlayManager {
	constructor() {
		this.initialized = false;
		this.invalidPathnames = ['/lobby',
			'/lobby/guest',
			'/lobby/playing',
			'/multiplayer/pong_ranked',
			'/multiplayer/pong_unranked',
			'/tournament',
			'/tournament/guest',
			'/tournament/playing',
			'/singleplayer/pong',
		];

		this.socialData = {
			socket: null,
			currentUsername: null,
			activeFriends: [],
			blockedContacts: [],
			registeredUsers: [],
			pendingFriendRequests: []
		};
		this.userActions = {
			block: this.blockUser.bind(this),
			unblock: this.unblockUser.bind(this),
			remove: this.removeFriend.bind(this),
			accept: this.acceptFriendRequest.bind(this),
			decline: this.declineFriendRequest.bind(this),
			chat: this.openChat.bind(this),
			inviteToGame: this.sendInviteToGame.bind(this),
			acceptInviteToGame: this.acceptInviteToGame.bind(this),
			acceptInviteToTournament: this.acceptInviteToTournament.bind(this),
			declineInviteToGame: this.declineInviteToGame.bind(this),
			declineInviteToTournament: this.declineInviteToTournament.bind(this),
			addNewRegisteredUser: this.addNewRegisteredUser.bind(this),
		}
		this.initializeUIElements();
		this.notificationManager = new NotificationManager();
		this.friendListManager = new FriendListManager();
		this.chatManager = new ChatManager(this);
	}

	initializeUIElements() {
		this.socialOverlay = document.getElementById('overlay');
		this.statusOverlay = document.getElementById('statusOverlay');
		this.notificationButton = document.getElementById('notificationBtn');
		this.currentUserStatus = document.getElementById('userStatus');
		this.displayUsername = document.getElementById('overlayUsername');
		this.navigationTabs = document.querySelectorAll('.tab');
		this.statusOptions = document.querySelectorAll('.nav-link-right.user-status');
		this.handleKeyboardControls = this.handleKeyboardControls.bind(this);
	}

	async initialize() {
		if (this.initialized) return;
		try {
			await this.chatManager.initialize();

			const [currentUsername, activeFriends, blockedContacts, registeredUsers, pendingFriendRequests] =
				await Promise.all([
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
			};

			this.chatManager.currentUsername = currentUsername;

			this.displayUsername.textContent = currentUsername;
			this.socialData.socket = new SocketManager();

			this.socketHandler = new SocketHandler(
				this.socialData,
				this.userActions,
				this.notificationManager,
				this.friendListManager,
				this.chatManager
			);

			this.socialData.socket.initWebSocket(
				'social/',
				this.socketHandler.handleSocketMessage.bind(this.socketHandler)
			);

			this.chatManager.initialize();

			this.friendListManager.updateFriendLists(this.socialData);
			this.setupEventHandlers();

			this.socialData.pendingFriendRequests.forEach(username => {
				this.socketHandler.handleFriendRequest(username);
			});

			document.body.addEventListener('keydown', this.handleKeyboardControls);

			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize Social Overlay:', error);
		}
	}

	setupEventHandlers() {
		this.notificationButton?.addEventListener('click', () => this.toggleOverlay(this.socialOverlay));

		this.socialOverlay.addEventListener('click', (event) => {
			if (event.target === this.socialOverlay) this.hideOverlay(this.socialOverlay);
		});

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

		this.setupUserActions();
		this.setupSearch();
	}

	setupStatusHandlers() {
		this.currentUserStatus?.addEventListener('click', (event) => {
			event.stopPropagation();
			this.toggleOverlay(this.statusOverlay);
		});

		this.statusOptions.forEach(option => {
			option.addEventListener('click', () => this.updateUserStatus(option));
		});
	}

	setupUserActions() {
		document.addEventListener('click', (event) => {
			const chatButton = event.target.closest('#openChat');
			if (chatButton) {
				const friendItem = chatButton.closest('.friend-item');
				const username = friendItem.querySelector('.friend-name').textContent;
				this.openChat(username);
			}
		});

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

		document.addEventListener('click', (event) => {
			const inviteButton = event.target.closest('#inviteToGame');
			if (inviteButton) {
				const friendListItem = inviteButton.closest('.friend-item');
				const targetUsername = friendListItem.querySelector('.friend-name').textContent;
				if (window.location.pathname === '/lobby' || window.location.pathname === '/tournament') {
				this.sendInviteToGame(targetUsername);
				} else {
					alert('You must be in a game lobby to invite a friend to play a game.');
				}
			}
		});
	}

	openChat(username) {
		if (this.chatManager) {
			this.chatManager.openChat(username);
		}
	}

	setupSearch() {
		const searchInput = document.querySelector('.search-input');
		searchInput?.addEventListener('input', (event) => {
			this.handleUserSearch(event.target.value);
		});
	}

	handleUserSearch(searchTerm) {
		if (!searchTerm) {
			this.friendListManager.updateFriendLists(this.socialData);
			return;
		}

		const searchResults = this.searchUsers(searchTerm);
		this.friendListManager.displaySearchResults(searchResults, this.socialData);
	}

	searchUsers(searchTerm) {
		const term = searchTerm.toLowerCase();
		const { registeredUsers, activeFriends, blockedContacts } = this.socialData;
		console.log('Searching for:', term);
		console.log('Registered users:', registeredUsers);

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

	addNewRegisteredUser() {
		api.getAllUsers().then(users => {
			this.socialData.registeredUsers = users;
			this.socketHandler = new SocketHandler(
				this.socialData,
				this.userActions,
				this.notificationManager,
				this.friendListManager,
				this.chatManager
			);
		});
	}

	updateUserStatus(statusOption) {
		const newStatus = statusOption.dataset.status;
		if (this.currentUserStatus) {
			this.currentUserStatus.textContent = newStatus;
			this.currentUserStatus.className = `friend-status ${newStatus.toLowerCase()}`;
		}
		this.hideOverlay(this.statusOverlay);
		this.sendStatusUpdate(newStatus);
	}

	// User actions
	blockUser(targetUsername) {
		if (!this.socialData.blockedContacts.includes(targetUsername)) {
			this.socialData.blockedContacts.push(targetUsername);
			this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== targetUsername);
			this.friendListManager.updateFriendLists(this.socialData);
			this.sendBlockUserUpdate(targetUsername);
		}
	}

	unblockUser(targetUsername) {
		if (this.socialData.blockedContacts.includes(targetUsername)) {
			this.socialData.activeFriends.push(targetUsername);
			this.socialData.blockedContacts = this.socialData.blockedContacts.filter(blocked => blocked !== targetUsername);
			this.friendListManager.updateFriendLists(this.socialData);
			this.sendUnblockUserUpdate(targetUsername);
		}
	}

	removeFriend(targetUsername) {
		if (this.socialData.activeFriends.includes(targetUsername)) {
			this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== targetUsername);
			this.friendListManager.updateFriendLists(this.socialData);
			this.sendRemoveFriendUpdate(targetUsername);
		}
	}

	acceptFriendRequest(username) {
		this.socialData.pendingFriendRequests = this.socialData.pendingFriendRequests.filter(request => request !== username);
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.friendListManager.updateFriendLists(this.socialData);
			console.log('Friend request accepted:', username);
		}
		this.sendFriendRequestAcceptedUpdate(username);
	}

	declineFriendRequest(username) {
		this.socialData.pendingFriendRequests = this.socialData.pendingFriendRequests.filter(request => request !== username);
		this.sendFriendRequestDeclinedUpdate(username);
	}

	sendInviteToGame(targetUsername) {
		if (window.location.pathname === '/lobby') {
			this.sendInviteToGameUpdate(targetUsername);
			this.notificationManager.addNotification({
				type: 'game_invite',
				title: 'Game Invite',
				message: `You have invited ${targetUsername} to a game`
			});
		} else if (window.location.pathname === '/tournament') {
			this.sendInviteToTournamentUpdate(targetUsername);
			this.notificationManager.addNotification({
				type: 'tournament_invite',
				title: 'Tournament Invite',
				message: `You have invited ${targetUsername} to a tournament`
			});
		}
	}

	acceptInviteToGame(inviteData) {
		if (this.invalidPathnames.includes(window.location.pathname)) {
			alert('You cannot accept a game invite while in a game lobby');
			return;
		}

		window.localStorage[`room_name`] = inviteData.room_name;
		window.localStorage[`invited_username`] = inviteData.username;

		router.navigateTo('/lobby/guest');
	}

	acceptInviteToTournament(inviteData) {
		if (this.invalidPathnames.includes(window.location.pathname)) {
			alert('You cannot accept a tournament invite while in a game lobby');
			return;
		}

		window.localStorage[`room_name`] = inviteData.room_name;
		window.localStorage[`invited_username`] = inviteData.username;

		router.navigateTo('/tournament/guest');
	}

	declineInviteToGame(inviteData) {
		console.log('Declining invite to game:', inviteData);
	}

	declineInviteToTournament(inviteData) {
		console.log('Declining invite to tournament:', inviteData);
	}

	// Socket message senders
	sendStatusUpdate(newStatus) {
		this.socialData.socket.send(JSON.stringify({
			type: 'status_change',
			new_status: newStatus
		}));
		console.log('📡 Sending status update:', newStatus);
	}

	sendBlockUserUpdate(targetUsername) {
		console.log('🚫 Blocking user:', targetUsername);
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

	sendRemoveFriendUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'remove_friend',
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

	sendChatMessageUpdate(user ,message) {
		this.socialData.socket.send(JSON.stringify({
			type: 'send_message',
			username: user,
			message: message
		}));

	}

	sendInviteToGameUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'send_lobby_invite',
			username: targetUsername,
			room_name: window.localStorage['room_name']
		}));
	}

	sendInviteToTournamentUpdate(targetUsername) {
		this.socialData.socket.send(JSON.stringify({
			type: 'send_tournament_invite',
			username: targetUsername,
			room_name: window.localStorage['room_name']
		}));
	}

	acceptInviteToGameUpdate(inviteData) {
		this.socialData.socket.send(JSON.stringify({
			type: 'accept_lobby_invite',
			room_name: inviteData.room_name
		}));
	}

	declineInviteToGameUpdate(inviteData) {

	}


	// UI handlers
	switchActiveTab(selectedTab) {
		this.navigationTabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
		const selectedListType = selectedTab.textContent.trim().toLowerCase();
		Object.entries(this.friendListManager.friendLists).forEach(([listType, list]) => {
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

		if (this.socialData && this.socialData.socket) {
			this.socialData.socket.close();
		}
		this.initialized = false;
	}
}