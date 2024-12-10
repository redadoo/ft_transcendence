const matchHistory = {
	getMatchDetails(match, currentUser) {
		const isPongMatch = match.type === "Pong Match";
		const details = match.details;

		const pongWinner = isPongMatch && (
			(details.first_user_username === currentUser && details.first_user_score > details.second_user_score) ||
			(details.second_user_username === currentUser && details.second_user_score > details.first_user_score)
		);

		return {
			isWinner: isPongMatch ? pongWinner : details.user_winner_username === currentUser,
			otherUsers: isPongMatch ?
			(currentUser === details.first_user_username ? details.second_user_username : details.first_user_username) :
			[details.first_user_username, details.second_user_username, details.third_user_username, details.fourth_user_username]
			.filter(user => user !== currentUser)
			.join(' '),
			mmrGain: isPongMatch ?
			(currentUser === details.first_user_username ? details.first_user_mmr_gain : details.second_user_mmr_gain) :
			null,
			score: isPongMatch ?
			(currentUser === details.first_user_username ?
				`${details.first_user_score} - ${details.second_user_score}` :
				`${details.second_user_score} - ${details.first_user_score}`) :
			null,
			duration: details.duration,
			gameType: isPongMatch ? 'pong' : 'liarsbar'
		};
	},

	createMatchHistoryItem(match, currentUser) {
		const {isWinner, otherUsers, mmrGain, score, duration, gameType} = this.getMatchDetails(match, currentUser);
		const isPongMatch = gameType === 'pong';

		return `
			<div class="match-item d-flex justify-content-between align-items-center mb-2">
			<div class="result-box ${isWinner ? 'win' : 'lose'}">
				<span class="pixel-font result-box">${isWinner ? 'WIN' : 'LOSE'}</span>
			</div>

			<div class="match-history-box left">
				<span class="pixel-font match-history-entry">${otherUsers}</span>
			</div>

			${isPongMatch ? `
				<div class="match-history-box center">
				<span class="pixel-font match-history-entry">${score}</span>
				</div>
			` : '<div class="match-history-box"></div>'}

			<div class="match-history-box left">
				<span class="pixel-font match-history-entry">${duration}</span>
			</div>

			${isPongMatch ? `
				<div class="match-history-box center">
				<span class="pixel-font ${mmrGain >= 0 ? 'plus-rp' : 'minus-rp'}">
					${mmrGain >= 0 ? '+' : ''}${mmrGain}RP
				</span>
				</div>
			` : '<div class="match-history-box"></div>'}

			<div class="history-image-container">
				<img src="/static/site_static/media/img/${gameType}.gif" alt="${gameType}" class="history-image">
			</div>
			</div>
		`;
	},

	renderMatchHistory(matchHistory, currentUser) {
		const container = document.getElementById('matchHistoryContent');
		if (!container || !matchHistory?.length || !matchHistory[0]?.all_matches) return;

		container.innerHTML = matchHistory[0].all_matches
		.map(match => this.createMatchHistoryItem(match, currentUser))
		.join('');
	}
};

const overlayManager = {
	overlay: document.getElementById('overlay'),
	overlayStatus: document.getElementById('statusOverlay'),
	handleKeyboardShortcutsBound: null,

	toggle(overlay) {
		console.log('Toggling overlay');
		if (overlay.classList.contains('d-none')) {
			this.show(overlay);
		} else {
			this.hide(overlay);
		}
	},

	show(overlay) {
		overlay.classList.remove('d-none');
	},

	hide(overlay) {
		overlay.classList.add('d-none');
	},

	addEventListeners() {
		tabs = document.querySelectorAll('.tab');
		notificationBtn = document.getElementById('notificationBtn');
		userStatus = document.getElementById('userStatus');
		userStatusOptions = document.querySelectorAll('.nav-link-right.user-status');

		this.handleKeyboardShortcutsBound = this.handleKeyboardShortcuts.bind(this);

		notificationBtn?.addEventListener('click', () => this.toggle(this.overlay));
		this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.hide(this.overlay); });
		document.body.addEventListener('keydown', this.handleKeyboardShortcutsBound);
		tabs.forEach(tab => { tab.addEventListener('click', () => this.handleTabSwitch(tabs, tab)); });
		userStatus?.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(this.overlayStatus); });
		userStatusOptions.forEach(statusOption => { statusOption.addEventListener('click', () => this.handleStatusChange(statusOption)); });
	},

	removeEventListener() {
		document.body.removeEventListener('keydown', this.handleKeyboardShortcutsBound);
	},

	handleKeyboardShortcuts(e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			this.toggle(this.overlay);
		} else if (e.key === 'Escape') {
			this.hide(this.overlay);
		}
	},

	handleTabSwitch(tabs, selectedTab) {
		tabs.forEach(tab => tab.classList.toggle('active', tab === selectedTab));
		// const selectedType = selectedTab.textContent.trim().toLowerCase();
	},

	handleStatusChange(statusOption) {
		userStatus = document.getElementById('userStatus');
		newStatus = statusOption.dataset.status;

		userStatus.textContent = newStatus;
		userStatus.className = `friend-status ${newStatus.toLowerCase()}`;

		this.hide(this.overlayStatus);
	},
};

