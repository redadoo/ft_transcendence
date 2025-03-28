import api from './api.js';
import router from './router.js';

export default class SocketHandler {
	constructor(socialData, userActions, notificationManager, friendListManager, chatManager) {
		this.socialData = socialData;
		this.userActions = userActions;
		this.notificationManager = notificationManager;
		this.friendListManager = friendListManager;
		this.chatManager = chatManager;
		console.log('🔌 SocketHandler initialized');
	}

	handleSocketMessage(socketData) {
		try {
			console.log('🔍 Parsed socket data:', socketData);
			const messageHandlers = {
				'get_status_change': () => this.handleFriendStatusUpdate(socketData.friend_username, socketData.new_status),
				'get_blocked': () => this.handleUserBlocked(socketData.username),
				'get_unblocked': () => this.handleUserUnblocked(socketData.username),
				'get_friend_request': () => this.handleFriendRequest(socketData.username),
				'get_friend_request_accepted': () => this.handleFriendRequestAccepted(socketData.username),
				'get_friend_request_declined': () => this.handleFriendRequestDeclined(socketData.username),
				'get_friend_removed': () => this.handleFriendRemoved(socketData.username),
				'get_message': () => this.handleIncomingMessage(socketData),
				'get_lobby_room_name': () => this.handleLobbyRoomName(socketData.lobby_room_name),
				'get_lobby_invite': () => this.handleLobbyInvite(socketData),
				'get_player_joined': () => this.handlePlayerJoined(socketData),
				'get_tournament_room_name': () => this.handleTournamentRoomName(socketData.tournament_room_name),
				'get_tournament_invite': () => this.handleTournamentInvite(socketData),
				'get_tournament_player_joined': () => this.handleTournamentPlayerJoined(socketData),
				'get_update_users': () => this.userActions.addNewRegisteredUser(socketData.username)
			};

			const handler = messageHandlers[socketData.type];
			if (handler) {
				console.log(`🎯 Executing handler for message type: ${socketData.type}`);
				handler();
			} else {
				console.warn('⚠️ Unhandled WebSocket message type:', socketData.type);
			}
		} catch (error) {
			console.error('❌ Error processing WebSocket message:', error);
		}
	}

	handleFriendStatusUpdate(username, newStatus) {
		console.log(`🔄 Handling status update for ${username} to ${newStatus}`);
		const friend = this.socialData.registeredUsers.find(user => user.username === username);
		if (friend) {
			friend.status = newStatus;
			this.friendListManager.updateFriendLists(this.socialData);
		} else {
			console.warn(`⚠️ Friend not found: ${username}`);
		}
	}

	handleUserBlocked(username) {
		console.log(`🚫 Handling block for user: ${username}`);
		this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== username);
		this.friendListManager.updateFriendLists(this.socialData);

		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'You have been blocked',
			message: `${username} has blocked you`
		});
	}

	handleUserUnblocked(username) {
		console.log(`✅ Handling unblock for user: ${username}`);
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.friendListManager.updateFriendLists(this.socialData);
		}

		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'You have been unblocked',
			message: `${username} has unblocked you`
		});
	}

	handleFriendRequest(username) {
		console.log(`👥 Handling friend request from: ${username}`);
		if (!this.socialData.pendingFriendRequests.includes(username)) {
			this.socialData.pendingFriendRequests.push(username);
		}

		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'Friend Request',
			message: `${username} wants to be your friend`,
			actions: [
				{
					label: 'Accept',
					handler: () => this.userActions.accept(username)
				},
				{
					label: 'Decline',
					handler: () => this.userActions.decline(username)
				}
			]
		});
	}

	handleFriendRequestAccepted(username) {
		console.log(`✨ Handling friend request accepted from: ${username}`);
		if (!this.socialData.activeFriends.includes(username)) {
			this.socialData.activeFriends.push(username);
			this.friendListManager.updateFriendLists(this.socialData);
		}

		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'Friend Request Accepted',
			message: `${username} accepted your friend request`
		});
	}

	handleFriendRequestDeclined(username) {
		console.log(`❌ Handling friend request declined from: ${username}`);
		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'Friend Request Declined',
			message: `${username} declined your friend request`
		});
	}

	handleFriendRemoved(username) {
		console.log(`👋 Handling friend removal for: ${username}`);
		this.socialData.activeFriends = this.socialData.activeFriends.filter(friend => friend !== username);
		this.friendListManager.updateFriendLists(this.socialData);

		this.notificationManager.addNotification({
			type: 'friend_request',
			title: 'Friend Removed',
			message: `${username} removed you as a friend`
		});
	}

	handleIncomingMessage(messageData) {
		console.log('💬 Handling incoming message:', messageData);
		this.chatManager.addMessage(messageData.message, messageData.username);

		this.notificationManager.addNotification({
			type: 'chat_message',
			title: `New message from ${messageData.username}`,
			message: messageData.message
		});
	}

	handleLobbyRoomName(lobbyRoomName) {
		console.log('🎮 Handling lobby room name:', lobbyRoomName);
		window.localStorage['room_name'] = lobbyRoomName;
	}

	handleLobbyInvite(inviteData) {
		console.log('🎟️ Handling lobby invite:', inviteData);

		this.notificationManager.addNotification({
			type: 'lobby_invite',
			title: 'Game Invite',
			message: `${inviteData.username} has invited you to a game`,
			actions: [
				{
					label: 'Accept',
					handler: () => this.userActions.acceptInviteToGame(inviteData)
				},
				{
					label: 'Decline',
					handler: () => this.userActions.declineInviteToGame(inviteData.username)
				}
			]
		});
	}

	handlePlayerJoined(playerData) {
		console.log('👥 Handling player joined:', playerData);
		if (window.location.pathname === '/lobby' && playerData.username !== window.localStorage['username']) {
			const player2Name = document.getElementById('player2Name');
			const player2Avatar = document.getElementById('player2Avatar');
			const startButton = document.getElementById('startGame');

			api.getUserProfile(playerData.username).then(data => {
				player2Name.textContent = data.username;
				player2Avatar.src = data.image_url.avatar_url;
			});

			startButton.disabled = false;
		}
	}

	handleTournamentRoomName(tournamentRoomName) {
		console.log('🏆 Handling tournament room name:', tournamentRoomName);
		window.localStorage['room_name'] = tournamentRoomName;
	}

	handleTournamentInvite(inviteData) {
		console.log('🎟️ Handling tournament invite:', inviteData);

		this.notificationManager.addNotification({
			type: 'tournament_invite',
			title: 'Tournament Invite',
			message: `${inviteData.username} has invited you to a tournament`,
			actions: [
				{
					label: 'Accept',
					handler: () => this.userActions.acceptInviteToTournament(inviteData)
				},
				{
					label: 'Decline',
					handler: () => this.userActions.declineInviteToTournament(inviteData.username)
				}
			]
		});
	}

	handleTournamentPlayerJoined(playersData) 
	{
		console.log('👥 Handling tournament player joined:', playersData);
		for (const playerId in playersData.players) 
		{
			const player = playersData.players[playerId];
			router.tournament.addNewPlayer(player.username, player.image_url);
		}
	}

	handleNewRegisteredUser(username) {
		console.log(`👤 Handling new registered user: ${username}`);
		this.socialData.registeredUsers.push({ username });
		this.friendListManager.updateFriendLists(this.socialData);
	}
}