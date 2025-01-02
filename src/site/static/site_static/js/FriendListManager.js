// FriendListManager.js
export default class FriendListManager {
	constructor() {
		this.friendLists = {
			online: document.getElementById('onlineList'),
			all: document.getElementById('allList'),
			blocked: document.getElementById('blockedList')
		};
	}

	updateFriendLists(socialData) {
		const { activeFriends, blockedContacts, registeredUsers } = socialData;
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

	createFriendListItem(username, avatarUrl, status) {
		return `
			<div class="friend-item" id="friendItem">
				<img src="${avatarUrl}" alt="avatar" class="friend-avatar">
				<span class="friend-name pixel-font">${username}</span>
				<span class="friend-status ${status.toLowerCase()}">${status}</span>
				<span class="friend-action" id="blockUser">🔒</span>
				<span class="friend-action" id="removeFriend">💔</span>
				<span class="friend-chat-action" id="openChat">💬</span>
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

	displaySearchResults(results, socialData) {
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
}