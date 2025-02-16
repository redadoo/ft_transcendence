import api from "./api.js";

export default class Tournament {
constructor(username) {
	this.players = new Array(4).fill(null);

	this.newPlayer = {
	username,
	profile_picture: "default.png",
	};

	this.initialize(username);
}

async initialize(username) {
	try {
	const lobbyPlayers = await api.getTournamentPlayers(username);

	lobbyPlayers.forEach((player, index) => {
		if (index < this.players.length) {
		this.players[index] = player;
		}
	});

	const isPlayerInLobby = lobbyPlayers.some(
		(player) => player.username === username
	);

	if (!isPlayerInLobby) {
		const emptySlotIndex = this.players.findIndex((player) => player === null);
		if (emptySlotIndex !== -1) {
		this.players[emptySlotIndex] = this.newPlayer;
		}
	}
	} catch (error) {
	console.error("Error loading tournament players:", error);
	}
}

	get player1() {
		return this.players[0] || { username: "", profile_picture: "" };
	}
	get player2() {
		return this.players[1] || { username: "", profile_picture: "" };
	}
	get player3() {
		return this.players[2] || { username: "", profile_picture: "" };
	}
	get player4() {
		return this.players[3] || { username: "", profile_picture: "" };
	}
}
