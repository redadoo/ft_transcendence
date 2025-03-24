import SocketManager from './SocketManager.js';
import Sound from '../../site_static/js/Sound.js';

/**
 * Manages the matchmaking process for multiplayer games.
 */
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

    /**
     * Sends a request to join matchmaking when the WebSocket opens.
     */
	onSocketOpen()
	{
		this.gameSocket.send(JSON.stringify({ 
			action: 'join_matchmaking' 
		}));
	}

    /**
     * Sends a request to close matchmaking when the WebSocket closes.
     */
	onSocketClose()
	{
		if (this.gameSocket != null)
		{
			this.gameSocket.send(JSON.stringify({
				action: 'close_matchmaking' 
			}));	
		}
	}

   	/**
     * Handles matchmaking button click event.
     * Plays a matchmaking sound and updates the UI while initiating matchmaking.
     */
	onClick()
	{
		// Sound.play("matchmakingSound");
		this.matchmakingButton.innerText = "SEARCHING...";
		this.matchmakingButton.disabled = true;
		this.matchmakingStatus.innerText = "Looking for an opponent...";
		this.setupMatchmakingSocket()
	}

    /**
     * Initializes the matchmaking WebSocket and sets up event handlers.
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
     * @param {Object} data - The WebSocket message data.
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
     * Cleans up the matchmaking UI and removes any previous elements.
     */
	cleanUp()
	{
		setTimeout(() => {
			if (this.matchmakingButton) 
			{
				this.matchmakingButton.innerText = "START MATCHMAKING";
				this.matchmakingButton.disabled = false;
			}

			if (this.matchmakingStatus) 
				this.matchmakingStatus.innerText = "Click below to start matchmaking";
	
			const pongContainer = document.getElementById('pong-container');
			if (pongContainer) 
				pongContainer.remove();
			else 
				console.warn("pong-container not found!");

				document.querySelectorAll('#pong-container').forEach(el => el.remove());

		}, 100);
	}
	
    /**
     * Sets up the game lobby when matchmaking is successful.
     * @param {Object} data - The lobby setup data received from the WebSocket.
     */
	setupLobby(data)
	{
		this.cleanUp();
		this.onMatchFound(data);
	}

    /**
     * Disposes of the matchmaking manager by closing the WebSocket and removing event listeners.
     */
	dispose()
	{
		if (this.gameSocket) 
		{
			this.onSocketClose();
			this.gameSocket.close();
			this.gameSocket = null;
		}

		if (this.matchmakingButton)
			this.matchmakingButton.removeEventListener("click", this.onClick.bind(this));
	}
}
