import api from "./api.js";

export default class Tournament {
	constructor() {
		this.players = new Array(4).fill(null);
	}

	async initialize(room_name) {
		this.room_name = room_name;

		try {
			const playersResponse = await api.getTournamentPlayers(this.room_name);
			console.log("Tournament players:", playersResponse);

			for (const player of playersResponse.usernames) {
				await this.addNewPlayer(player);
			}
		} catch (error) {
			console.error("Error initializing tournament", error);
		}
	}

	updatePlayers() {
		console.log("Updating players in tournament:", this.players);
		const updatePlayerDOM = (index, player) => {
			const nameEl = document.getElementById(`player${index}Name`);
			const avatarEl = document.getElementById(`player${index}Avatar`);

			if (nameEl) nameEl.textContent = player.alias;
			if (avatarEl) avatarEl.src = player.profile_picture;
		};

		updatePlayerDOM(1, this.player1);
		updatePlayerDOM(2, this.player2);
		updatePlayerDOM(3, this.player3);
		updatePlayerDOM(4, this.player4);
	}

	async addNewPlayer(username) {
		console.log("Adding new player to tournament:", username);
		const emptySlotIndex = this.players.findIndex((player) => player === null);
		if (emptySlotIndex !== -1) {
			const userDetails = await api.getUserProfile(username);
			const newPlayerObj = {
				username: userDetails.username,
				alias: userDetails.username,
				profile_picture: userDetails.image_url.avatar_url,
			};
			this.players[emptySlotIndex] = newPlayerObj;
			this.updatePlayers();
		} else {
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
		return this.players.every((player) => player !== null);
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