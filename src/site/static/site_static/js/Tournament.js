import api from "./api.js";

export default class Tournament {
	constructor(username) {
		this.players = [
			{
				"username": null,
				"profile_picture": null,
			},
			{
				"username": null,
				"profile_picture": null,
			},
			{
				"username": null,
				"profile_picture": null,
			},
			{
				"username": null,
				"profile_picture": null,
			},
		];
	}

	// async TournamentInfo() {
	// 	api.getTournamentInfo().then((data) => {

	// 	});
	// }
}