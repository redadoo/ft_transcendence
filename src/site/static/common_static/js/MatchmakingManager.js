import SocketManager from './SocketManager.js';

export default class MatchmakingManager
{
	constructor(gameName, onMatchFound) {

		this.onMatchFound = onMatchFound;
		this.gameName = gameName;
		this.gameSocket = null;
		this.onSocketOpen = () => {
			this.gameSocket.send(JSON.stringify(
				{ action: 'join_matchmaking' }
			));
		}
		this.addEventToButton();
	}

  	/**
   	 * Sets up the UI and binds the matchmaking button to the matchmaking socket setup.
   	 */
	addEventToButton()
	{
		const matchmakingButton = document.getElementById("startMatchmaking");
		const matchmakingStatus = document.getElementById("matchmakingStatus");

		if (matchmakingButton) {
			matchmakingButton.addEventListener('click', () => {
				matchmakingButton.innerText = "SEARCHING...";
				matchmakingButton.disabled = true;
				matchmakingStatus.innerText = "Looking for an opponent...";
				this.setupMatchmakingSocket()
			});
		}
	}

	/**
	 * Initializes the matchmaking WebSocket and defines its behavior.
	 */
	setupMatchmakingSocket()
	{
		this.gameSocket = new SocketManager();
		this.gameSocket.initWebSocket(
			`multiplayer/${this.gameName}/matchmaking`,
			this.handleMatchmakingSocketMessage.bind(this),
			this.onSocketOpen
		);
	}

	/**
	 * Handles incoming messages from the matchmaking WebSocket.
	 * @param {MessageEvent} event - The WebSocket message event.
	 */
	handleMatchmakingSocketMessage(event)
	{
		try
		{
			const data = JSON.parse(event.data);
			switch (data.type) {
			case 'setup_pong_lobby':
				this.setupLobby(data);
				break;
			default:
				console.log(`Unhandled matchmaking event type: ${data.type}`);
			}
		} catch (error) {
			console.error('Error processing matchmaking WebSocket message:', error);
		}
	}

	/**
	 * Cleans up the matchmaking UI and WebSocket resources.
	 */
	cleanUp()
	{
		const matchmakingButton = document.getElementById("startMatchmaking");
		const matchmakingStatus = document.getElementById("matchmakingStatus");

		if (matchmakingButton) {
			matchmakingButton.innerText = "START MATCHMAKING";
			matchmakingButton.disabled = false;
		}
		if (matchmakingStatus) {
			matchmakingStatus.innerText = "Click below to start matchmaking";
		}

		document.getElementById('pong-container')?.remove();
		if (this.gameSocket)
		{
			this.gameSocket.close();
			this.gameSocket = null;
		}
	}

	/**
	 * Sets up the lobby based on the provided data.
	 * @param {Object} data - The data received for the lobby setup.
	 */
	setupLobby(data)
	{
		this.cleanUp();
		this.onMatchFound(data);
	}
}
