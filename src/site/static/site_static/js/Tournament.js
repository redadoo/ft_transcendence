
export default class Tournament {
	constructor() {
		this.players = new Array(4).fill(null);
	}

	updatePlayers() {
		console.log("Updating players in tournament:", this.players);
		const updatePlayerDOM = (index, player) => {
			const nameEl = document.getElementById(`player${index}Name`);
			const avatarEl = document.getElementById(`player${index}Avatar`);

			if (nameEl) nameEl.textContent = player.username;
			if (avatarEl) avatarEl.src = player.profile_picture;
		};

		updatePlayerDOM(1, this.player1);
		updatePlayerDOM(2, this.player2);
		updatePlayerDOM(3, this.player3);
		updatePlayerDOM(4, this.player4);
	}

	async addNewPlayer(username, image_url) 
	{
		console.log(`Adding new player to tournament: ${username}, ${image_url}`);
	
		const playerExists = this.players.some(player => player && player.username === username);
	
		if (playerExists) 
			return;

		const emptySlotIndex = this.players.indexOf(null);
	
		if (emptySlotIndex !== -1)
		{
			const newPlayerObj = {
				username: username,
				profile_picture: image_url.avatar_url,
			};
	
			this.players[emptySlotIndex] = newPlayerObj;
			this.updatePlayers();
	
			if (this.isLobbyFull() && window.localStorage['username'] === this.player1.username) 
			{
				const startButton = document.getElementById('startTournament');
				startButton.disabled = false;
			}
		} 
		else 
		{
			console.warn("No empty slot available to add a new player.");
		}
	}

	updatePlayerAlias(username, alias) {
		const player = this.players.find((player) => player.username === username);
		if (player) {
			player.alias = alias;
			this.updatePlayers();
		}
	}

	isLobbyFull() {
		return this.players.every(player => player !== null);
	}

	get player1() {
		return (
			this.players[0] || { username: "WAITING...", alias: "WAITING...", profile_picture: "" }
		);
	}
	get player2() {
		return (
			this.players[1] || { username: "WAITING...", alias: "WAITING...", profile_picture: "" }
		);
	}
	get player3() {
		return (
			this.players[2] || { username: "WAITING...", alias: "WAITING...", profile_picture: "" }
		);
	}
	get player4() {
		return (
			this.players[3] || { username: "WAITING...", alias: "WAITING...", profile_picture: "" }
		);
	}
}