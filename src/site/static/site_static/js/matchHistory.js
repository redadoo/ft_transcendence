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

export default matchHistory;