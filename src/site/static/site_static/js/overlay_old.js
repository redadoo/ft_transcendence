document.addEventListener('DOMContentLoaded', function () {
	// Cache DOM elements
	const elements = {
		notificationBtn: document.getElementById('notificationBtn'),
		overlay: document.getElementById('overlay'),
		statusOverlay: document.getElementById('status-overlay'),
		userStatus: document.querySelector('.friends-header .friend-status'),
		onlineList: document.getElementById('online-list'),
		allList: document.getElementById('all-list'),
		tabs: document.querySelectorAll('.tab'),
		friendsLists: document.querySelectorAll('.friends-list')
	};

	// WebSocket handling
	class FriendsWebSocket {
		constructor() {
			this.connect();
			this.reconnectAttempts = 5;
			this.maxReconnectAttempts = 5;
			this.reconnectDelay = 5000;
		}

		connect() {
			this.socket = new WebSocket(`ws://${window.location.host}/ws/friends/`);
			this.bindEvents();
		}

		bindEvents() {
			this.socket.onmessage = this.handleMessage.bind(this);
			this.socket.onerror = this.handleError.bind(this);
			this.socket.onclose = this.handleClose.bind(this);
			this.socket.onopen = () => {
				console.log('WebSocket connected');
				this.reconnectAttempts = 0;
			};
		}

		handleMessage(event) {
			try {
				const data = JSON.parse(event.data);
				console.log('WebSocket message received:', data);

				if (data.type === 'StatusUpdate') {
					const friendData = {
						username: data.friend_username,
						status: data.status
					};
					console.log('Processing status update for:', friendData);
					updateFriendStatus(friendData);
				}
			} catch (error) {
				console.error('Error parsing WebSocket message:', error);
			}
		}

		handleError() {
			console.error("WebSocket error occurred");
			this.attemptReconnect();
		}

		handleClose() {
			console.warn("WebSocket connection closed");
			this.attemptReconnect();
		}

		attemptReconnect() {
			if (this.reconnectAttempts < this.maxReconnectAttempts) {
				this.reconnectAttempts++;
				setTimeout(() => this.connect(), this.reconnectDelay);
			} else {
				console.error('Max reconnection attempts reached');
			}
		}

		sendStatus(status) {
			if (this.socket.readyState === WebSocket.OPEN) {
				this.socket.send(JSON.stringify({
					type: 'status_update',
					status: status
				}));
			}
		}

		sendUserStatusUpdate(status) {
			if (this.socket.readyState === WebSocket.OPEN) {
				let statusNumber;
				switch(status) {
					case 'Online':
						statusNumber = 1;
						break;
					case 'Away':
						statusNumber = 3;
						break;
					case 'Busy':
						statusNumber = 4;
						break;
					default:
						statusNumber = 0;
				}

				const message = {
					type: 'user_status_update',
					status: statusNumber
				};

				console.log('Sending user status update:', message);
				this.socket.send(JSON.stringify(message));
			}
		}
	}


	const ws = new FriendsWebSocket();

	// Status handling
	function updateFriendStatus(friendData) {
		if (!friendData?.username) {
			console.warn('Invalid friend data received:', friendData);
			return;
		}

		[elements.onlineList, elements.allList].forEach(list => {
			if (!list) return;

			// Update selector to match by username instead of id
			const existingItem = list.querySelector(`.friend-item .friend-name[data-username="${friendData.username}"]`)?.closest('.friend-item');
			console.log(`Found friend element in ${list.id}:`, existingItem);

			if (existingItem) {
				updateStatusElement(existingItem, friendData);
				handleListTransfer(existingItem, friendData.status, list);
			}
		});
	}

	function updateStatusElement(element, friendData) {
		const statusElement = element.querySelector('.friend-status');
		if (statusElement) {
			statusElement.textContent = friendData.status;
			statusElement.className = `friend-status ${friendData.status.toLowerCase()}`;
		}
	}

	function handleListTransfer(element, status, currentList) {
		if (status === 'Online' && currentList === elements.allList) {
			const clone = element.cloneNode(true);
			elements.onlineList?.appendChild(clone);
			console.log('Added to online list:', clone);
		} else if (status !== 'Online' && currentList === elements.onlineList) {
			element.remove();
			console.log('Removed from online list:', element);
		}
	}

	// Overlay handling
	const overlayManager = {
		timeout: null,
		transitionDuration: 300,

		toggle(overlay) {
			if (this.timeout) return;

			if (overlay.classList.contains('d-none')) {
				this.show(overlay);
			} else {
				this.hide(overlay);
			}
		},

		show(overlay) {
			overlay.classList.remove('d-none');
			requestAnimationFrame(() => overlay.classList.add('active'));
		},

		hide(overlay) {
			overlay.classList.remove('active');
			this.timeout = setTimeout(() => {
				overlay.classList.add('d-none');
				this.timeout = null;
			}, this.transitionDuration);
		}
	};

	// Event Listeners
	function initializeEventListeners() {

		// Add status click handler
		if (elements.userStatus) {
			elements.userStatus.style.cursor = 'pointer';
			elements.userStatus.addEventListener('click', (e) => {
				e.stopPropagation();
				console.log('Status clicked, showing overlay');
				overlayManager.toggle(elements.statusOverlay);
			});
		}

		// Add click handlers for status options
		document.querySelectorAll('.nav-link-right.user-status').forEach(statusOption => {
			statusOption.addEventListener('click', () => handleStatusChange(statusOption));
		});

		// Notification button
		elements.notificationBtn?.addEventListener('click', () =>
			overlayManager.toggle(elements.overlay));

		// Overlay click handling
		elements.overlay?.addEventListener('click', (e) => {
			if (e.target === elements.overlay) {
				overlayManager.hide(elements.overlay);
			}
		});

		// Status overlay handling
		elements.statusOverlay?.addEventListener('click', (e) => {
			if (e.target === elements.statusOverlay) {
				overlayManager.hide(elements.statusOverlay);
			}
		});

		// Tab switching
		elements.tabs.forEach(tab => {
			tab.addEventListener('click', () => handleTabSwitch(tab));
		});

		// Status buttons
		document.querySelectorAll('.user-status[data-status]').forEach(button => {
			button.addEventListener('click', () => handleStatusChange(button));
		});

		// Initial status classes
		document.querySelectorAll('.friend-item').forEach(initializeFriendStatus);

		// Keyboard shortcuts
		document.addEventListener('keydown', handleKeyboardShortcuts);
	}

	function handleStatusChange(button) {
	const newStatus = button.dataset.status;
	console.log('Status change requested:', newStatus);

	ws.sendUserStatusUpdate(newStatus);

	if (elements.userStatus) {
		elements.userStatus.textContent = newStatus;
		elements.userStatus.className = `friend-status ${newStatus.toLowerCase()}`;
	}

	overlayManager.hide(elements.statusOverlay);
}


	function handleTabSwitch(selectedTab) {
		elements.tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
		const selectedType = selectedTab.textContent.trim().toLowerCase();
		elements.friendsLists.forEach(list => {
			list.classList.toggle('d-none', list.id !== `${selectedType}-list`);
		});
	}

	function initializeFriendStatus(item) {
		const statusElement = item.querySelector('.friend-status');
		if (statusElement) {
			const statusText = statusElement.textContent.trim().toLowerCase();
			statusElement.classList.add(statusText);
		}
	}

	function handleKeyboardShortcuts(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			overlayManager.toggle(elements.overlay);
		} else if (e.key === 'Escape') {
			overlayManager.hide(elements.overlay);
			overlayManager.hide(elements.statusOverlay);
		}
	}

	// Initialize
	initializeEventListeners();
});
