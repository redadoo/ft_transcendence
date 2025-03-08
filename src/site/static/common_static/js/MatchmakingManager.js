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
		this.gameSocket = new SocketManager(false);
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
	handleMatchmakingSocketMessage(data)
	{
		try
		{
			switch (data.type) 
			{
				case 'setup_pong_lobby':
					this.setupLobby(data);
					break;
				case 'setup_liarsbar_lobby':
					this.setupLobby(data);
					break;
				default:
					console.log(`Unhandled matchmaking event: `, data);
					break;
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
		console.log("Cleaning up matchmaking UI...");
	
		setTimeout(() => {
			const matchmakingButton = document.getElementById("startMatchmaking");
			const matchmakingStatus = document.getElementById("matchmakingStatus");
	
			if (matchmakingButton) 
			{
				console.log("Resetting matchmaking button");
				matchmakingButton.innerText = "START MATCHMAKING";
				matchmakingButton.disabled = false;
			}

			if (matchmakingStatus) 
			{
				console.log("Resetting matchmaking status");
				matchmakingStatus.innerText = "Click below to start matchmaking";
			}
	
			const pongContainer = document.getElementById('pong-container');
			if (pongContainer) 
			{
				console.log("Removing pong-container");
				pongContainer.remove();
			} 
			else 
			{
				console.warn("pong-container not found!");
			}
	
			if (this.gameSocket) 
			{
				console.log("Closing WebSocket connection...");
				this.gameSocket.close();
				this.gameSocket = null;
			}

			document.querySelectorAll('#pong-container').forEach(el => el.remove());

		}, 100);
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
