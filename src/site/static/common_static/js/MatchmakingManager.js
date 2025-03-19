import SocketManager from './SocketManager.js';
import Sound from '../../site_static/js/Sound.js';

export default class MatchmakingManager
{
	constructor(gameName, onMatchFound) {

		this.onMatchFound = onMatchFound;
		this.gameName = gameName;
		this.gameSocket = null;
		
		this.matchmakingButton = document.getElementById("startMatchmaking");
		this.matchmakingStatus = document.getElementById("matchmakingStatus");
		
		this.matchmakingButton.addEventListener('click',this.onClick.bind(this));
	}

	dispose()
	{
		if (this.gameSocket) 
		{
			console.log("Closing WebSocket connection...");
			this.gameSocket.close();
			this.gameSocket = null;
		}

		if (this.matchmakingButton)
			this.matchmakingButton.removeEventListener("click", this.onClick.bind(this));
	}

	onSocketOpen()
	{
		this.gameSocket.send(JSON.stringify({ 
			action: 'join_matchmaking' 
		}));
	}

	onSocketClose()
	{
		this.gameSocket.send(JSON.stringify({
			action: 'close_matchmaking' 
		}));
	}

	onClick()
	{
		Sound.play("matchmakingSound");
		this.matchmakingButton.innerText = "SEARCHING...";
		this.matchmakingButton.disabled = true;
		this.matchmakingStatus.innerText = "Looking for an opponent...";
		this.setupMatchmakingSocket()
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
			this.onSocketOpen.bind(this),
			this.onSocketClose.bind(this)
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
			if (this.matchmakingButton) 
			{
				console.log("Resetting matchmaking button");
				this.matchmakingButton.innerText = "START MATCHMAKING";
				this.matchmakingButton.disabled = false;
			}

			if (this.matchmakingStatus) 
			{
				console.log("Resetting matchmaking status");
				this.matchmakingStatus.innerText = "Click below to start matchmaking";
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
