class overlayManager {
	constructor() {
		this.overlay = document.getElementById('overlay');
		this.overlayStatus = document.getElementById('statusOverlay');

		this.handleKeyboardShortcutsBound = this.handleKeyboardShortcuts.bind(this);
	}

	initialize() {
		this.tabs = document.querySelectorAll('.tab');
		this.notificationBtn = document.getElementById('notificationBtn');
		this.userStatus = document.getElementById('userStatus');
		this.userStatusOptions = document.querySelectorAll('.nav-link-right.user-status');

		this.setupEventListeners();
	}

	setupEventListeners() {
		this.notificationBtn?.addEventListener('click', () => this.toggle(this.overlay)); // Notification button
		this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.hide(this.overlay); }); // Overlay click handling
		document.body.addEventListener(	'keydown', this.handleKeyboardShortcutsBound); // Keyboard shortcuts
		this.tabs.forEach(tab => { tab.addEventListener('click', () => this.handleTabSwitch(tab)); }); // Tab switching
		this.userStatus?.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(this.overlayStatus); }); // Status overlay handling
		this.userStatusOptions.forEach(statusOption => { statusOption.addEventListener('click', () => this.handleStatusChange(statusOption)); }); // Status options
	}

	cleanup() {
		document.body.removeEventListener('keydown', this.handleKeyboardShortcutsBound);
	}

	toggle(overlay) {
		if (overlay.classList.contains('d-none')) {
			this.show(overlay);
		} else {
			this.hide(overlay);
		}
	}

	show(overlay) {
		overlay.classList.remove('d-none');
	}

	hide(overlay) {
		overlay.classList.add('d-none');
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

	handleTabSwitch(selectedTab) {
		this.tabs.forEach(tab => {
			tab.classList.toggle('active', tab === selectedTab);
		});
	}

	handleStatusChange(statusOption) {
		const newStatus = statusOption.dataset.status;
		this.userStatus.textContent = newStatus;
		this.userStatus.className = `friend-status ${newStatus.toLowerCase()}`;
		this.hide(this.overlayStatus);
	}
}