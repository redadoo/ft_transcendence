import Sound from './Sound.js';

export default class NotificationManager {
	constructor() {
		this.notifications = [];
		this.notificationCount = 0;
		this.notificationContainer = document.getElementById('notifications');
		this.notificationCountDisplay = document.getElementById('notificationCount');
		this.notificationCounter = document.getElementById('notificationCounter');
		this.setupWindowHandlers();
	}

	setupWindowHandlers() {
		// Keep a global handler in case other parts of your code call it.
		window.handleNotificationAction = (notificationId, actionIndex) => {
			const notification = this.notifications.find(n => n.id === notificationId);
			if (notification && notification.actions && notification.actions[actionIndex]) {
				notification.actions[actionIndex].handler();
				this.removeNotification(notificationId);
			}
		};
	}

	addNotification(notification) {
		const notificationId = Date.now();
		const notificationData = {
			id: notificationId,
			...notification
		};

		// Play notification sound (ensure Sound.play exists and works as expected)
		Sound.play('notificationSound');

		this.notifications.unshift(notificationData);
		this.notificationCount++;
		this.updateNotificationDisplay();

		// Auto-remove notification if there are no actions
		if (!notification.actions) {
			setTimeout(() => this.removeNotification(notificationId), 25000);
		}
	}

	removeNotification(notificationId) {
		const index = this.notifications.findIndex(n => n.id === notificationId);
		if (index !== -1) {
			this.notifications.splice(index, 1);
			this.notificationCount = Math.max(0, this.notificationCount - 1);
			this.updateNotificationDisplay();
		}
	}

	updateNotificationDisplay() {
		// Update notification counts
		this.notificationCountDisplay.textContent = this.notificationCount;
		this.notificationCounter.textContent = this.notificationCount;

		// Clear the container safely by removing its children
		while (this.notificationContainer.firstChild) {
			this.notificationContainer.removeChild(this.notificationContainer.firstChild);
		}

		// Build each notification element using DOM methods
		this.notifications.forEach(notification => {
			// Create the main container for the notification
			const notificationItem = document.createElement('div');
			notificationItem.classList.add('notification-item', notification.type);
			notificationItem.id = `notification-${notification.id}`;

			// Create a container for the notification content
			const contentDiv = document.createElement('div');
			contentDiv.classList.add('notification-content');

			// Create and append the title element
			const titleDiv = document.createElement('div');
			titleDiv.classList.add('notification-title', 'pixel-font');
			titleDiv.textContent = notification.title;
			contentDiv.appendChild(titleDiv);

			// Create and append the message element
			const messageDiv = document.createElement('div');
			messageDiv.classList.add('notification-message', 'pixel-font');
			messageDiv.textContent = notification.message;
			contentDiv.appendChild(messageDiv);

			// If the notification has actions, create buttons without inline handlers
			if (notification.actions && notification.actions.length > 0) {
				const actionsDiv = document.createElement('div');
				actionsDiv.classList.add('notification-actions');

				notification.actions.forEach((action, index) => {
					const button = document.createElement('button');
					button.classList.add('notification-action', 'pixel-font');
					button.textContent = action.label;

					// Attach event listener securely without using inline event attributes
					button.addEventListener('click', () => {
						window.handleNotificationAction(notification.id, index);
					});

					actionsDiv.appendChild(button);
				});
				contentDiv.appendChild(actionsDiv);
			}

			notificationItem.appendChild(contentDiv);
			this.notificationContainer.appendChild(notificationItem);
		});
	}
}
