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
		window.handleNotificationAction = (notificationId, actionIndex) => {
			const notification = this.notifications.find(notification => notification.id === notificationId);
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

		Sound.play('notificationSound');
		this.notifications.unshift(notificationData);
		this.notificationCount++;

		this.updateNotificationDisplay();

		if (!notification.actions) {
			setTimeout(() => this.removeNotification(notificationId), 25000);
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
		this.notificationCounter.textContent = this.notificationCount;

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
}