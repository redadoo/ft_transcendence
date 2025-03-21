// ChatManager.js
import api from './api.js';

export default class ChatManager {
	constructor(socialOverlay) {
		// Core state
		this.chats = new Map();
		this.activeChat = null;
		this.currentUsername = null;
		this.socialOverlay = socialOverlay;

		this.overlay = {
			friends: null,
			chat: null
		};
	}

	async initialize() {
		try {
			this.overlay.friends = document.querySelector('.friends-sidebar');
			this.overlay.chat = document.querySelector('.chat-sidebar');

			this.createChatTemplate();

			const chatData = await api.getChatMessages();
			this.loadChatHistory(chatData);

			return true;
		} catch (error) {
			console.error('Failed to initialize chat:', error);
			return false;
		}
	}

	loadChatHistory(chatData) {
		if (!Array.isArray(chatData)) return;

		chatData.forEach(chat => {
			if (!chat.users?.[0]?.username) return;

			const otherUser = chat.users[0].username;
			this.chats.set(otherUser, {
				messages: chat.messages || [],
				unreadCount: 0
			});
		});
	}

	createChatTemplate() {
		this.overlay.chat.innerHTML = `
			<div class="chat-interface">
				<div class="chat-header">
					<div class="d-flex justify-content-between align-items-center">
						<div class="d-flex align-items-center gap-3">
							<span class="back-to-friends pixel-font" id="backToFriends">←</span>
							<span class="pixel-font" id="chatTitle">CHAT</span>
						</div>
					</div>
				</div>

				<div class="chat-messages pixel-font" id="messageList"></div>

				<div class="chat-input">
					<input type="text"
						id="messageInput"
						class="message-input pixel-font"
						placeholder="Type a message..."
						autocomplete="off">
					<button id="sendMessage" class="send-button pixel-font">Send</button>
				</div>
			</div>`;
	}

	openChat(username) {
		this.overlay.friends.classList.add('d-none');
		this.overlay.chat.classList.remove('d-none');

		this.activeChat = username;
		this.initializeChatUI(username);
		this.setupEventListeners();

		if (!this.chats.has(username)) {
			this.chats.set(username, { messages: [], unreadCount: 0 });
		}
		this.displayMessages(username);
	}

	initializeChatUI(username) {
		const titleElement = document.getElementById('chatTitle');
		if (titleElement) {
			titleElement.innerText = `CHAT WITH ${username}`;
		}

		const statusElement = document.getElementById('chatStatus');
		if (statusElement) {
			const userStatus = this.socialOverlay.socialData.registeredUsers
				.find(user => user.username === username)?.status || 'Offline';
			statusElement.innerText = userStatus.toUpperCase();
		}
	}

	setupEventListeners() {
		const messageInput = document.getElementById('messageInput');
		const sendButton = document.getElementById('sendMessage');
		const backButton = document.getElementById('backToFriends');

		messageInput?.addEventListener('keypress', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});

		sendButton?.addEventListener('click', () => this.sendMessage());
		backButton?.addEventListener('click', () => this.returnToFriends());
	}

	displayMessages(username) {
		console.log('📚 Displaying messages for:', username);
		const messageList = document.getElementById('messageList');
		if (!messageList) return;

		const chat = this.chats.get(username);
		if (!chat) return;

		console.log('msgs:', chat.messages);
		const messagesHTML = chat.messages.map(msg => this.createMessageHTML(msg)).join('');
		messageList.innerHTML = messagesHTML;
		messageList.scrollTop = messageList.scrollHeight;
	}

	createMessageHTML(msg) {
		const messageType = msg.sender.username === this.currentUsername ? 'sent' : 'received';
		return `
			<div class="message ${messageType}">
				<div class="message-content">
					<div class="message-sender pixel-font">${msg.sender.username}</div>
					<div class="message-text pixel-font">${this.escapeHTML(msg.message_text)}</div>
				</div>
			</div>`;
	}

	escapeHTML(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	sendMessage() {
		const messageInput = document.getElementById('messageInput');
		
		if (!messageInput) 
			return;
		
		if (messageInput.value.length > 500)
		{
			messageInput.value = "";
			alert("message too long");
			return;
		}
		
		const message = messageInput.value.trim();
		if (!message || !this.activeChat) return;

		this.addMessage(message, this.currentUsername);

		this.socialOverlay.sendChatMessageUpdate(this.activeChat, message);

		messageInput.value = '';
	}

	addMessage(message, username) {
		console.log('📩 Adding message:', message, 'to:', username);
		if (!username) return;

		// Create chat if it doesn't exist
		if (!this.chats.has(username)) {
			this.chats.set(username, { messages: [], unreadCount: 0 });
		}

		if (username === this.currentUsername) {
			const chat = this.chats.get(this.activeChat);
			chat.messages.push({
				sender: { username: this.currentUsername },
				message_text: message
			});
			this.displayMessages(this.activeChat);
			return;
		}

		const chat = this.chats.get(username);
		chat.messages.push({
			sender: { username: username },
			message_text: message
		});
		// Update unread count if not active chat
		if (username !== this.activeChat) {
			chat.unreadCount++;
		}

		// Update display if this is the active chat
		if (username === this.activeChat) {
			this.displayMessages(username);
		}
	}

	returnToFriends() {
		this.overlay.friends.classList.remove('d-none');
		this.overlay.chat.classList.add('d-none');
		this.activeChat = null;
	}

	cleanup() {
		this.activeChat = null;
		this.chats.clear();
	}
}