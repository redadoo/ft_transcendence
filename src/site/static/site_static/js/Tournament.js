import api from "./api.js";

export default class Tournament {
	constructor(username, room_name) {
		this.players = new Array(4).fill(null);

		this.newPlayer = {
			username,
			profile_picture: "",
		};

		this.room_name = room_name;

		this.initialize();
		this.updatePlayers();
	}

	async initialize() {
		try {
			const response = await api.getTournamentPlayers(this.room_name);
			const usernames = response.usernames;

			const playersFromApi = await Promise.all(
				usernames.map(async (username) => {
					const userDetails = await api.getUserProfile(username);
					let profile_picture = "";
					profile_picture = userDetails.image_url.avatar_url;
					return { username, profile_picture };
				})
			);

			playersFromApi.forEach((player, index) => {
				if (index < this.players.length) {
					this.players[index] = player;
				}
			});

			if (!usernames.includes(this.newPlayer.username)) {
				const emptySlotIndex = this.players.findIndex((player) => player === null);
				if (emptySlotIndex !== -1) {
					const newUserDetails = await api.getUserProfile(this.newPlayer.username);
					this.newPlayer.profile_picture = newUserDetails.image_url.avatar_url;
					this.players[emptySlotIndex] = this.newPlayer;
				}
			}

		} catch (error) {
			console.error("Error initializing tournament", error);
		}
	}

	updatePlayers() {
		document.getElementById('player1Name').textContent = this.player1.username;
		document.getElementById('player1Avatar').src = this.player1.profile_picture;
		document.getElementById('player2Name').textContent = this.player2.username;
		document.getElementById('player2Avatar').src = this.player2.profile_picture;
		document.getElementById('player3Name').textContent = this.player3.username;
		document.getElementById('player3Avatar').src = this.player3.profile_picture;
		document.getElementById('player4Name').textContent = this.player4.username;
		document.getElementById('player4Avatar').src = this.player4.profile_picture;
	}

	async addNewPlayer(username) {
		if (emptySlotIndex !== -1) {
			const newUserDetails = await api.getUserProfile(username);

			this.newPlayer = {
				username,
				profile_picture: newUserDetails.image_url.avatar_url,
			};

			this.updatePlayers();
		}
	}

	get player1() {
		return this.players[0] || { username: "WAITING...", profile_picture: "" };
	}
	get player2() {
		return this.players[1] || { username: "WAITING...", profile_picture: "" };
	}
	get player3() {
		return this.players[2] || { username: "WAITING...", profile_picture: "" };
	}
	get player4() {
		return this.players[3] || { username: "WAITING...", profile_picture: "" };
	}
}
