import SocketManager from '../../../common_static/js/SocketManager.js';

export default class MatchmakingManager {
	constructor() 
	{
		this.gameSocket = null;
		this.events = {};
		this.init();
	}

	init() {
		this.setupMultiplayerUI();
	}

  /**
   * Sets up the UI and binds the matchmaking button to the matchmaking socket setup.
   */
	setupMultiplayerUI() 
	{
		const matchmakingButton = document.getElementById('startMatchmaking');
		if (matchmakingButton) 
			matchmakingButton.addEventListener('click', () => this.setupMatchmakingSocket());
	}

	/**
	 * Initializes the matchmaking WebSocket and defines its behavior.
	 */
	setupMatchmakingSocket() 
	{
		this.gameSocket = new SocketManager();
		this.gameSocket.initWebSocket(
			'multiplayer/pong/matchmaking',
			this.handleMatchmakingSocketMessage.bind(this)
		);

		this.gameSocket.socket.onopen = () => {
			this.gameSocket.send(JSON.stringify({ action: 'join_matchmaking' }));
		};
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
				this.emit('setupLobby', data);
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
		document.getElementById('pong-container')?.remove();
		if (this.gameSocket) {
			this.gameSocket.close();
			this.gameSocket = null;
		}
	}

	/**
	 * Registers an event listener for a custom event.
	 * @param {string} eventName - The name of the event.
	 * @param {Function} callback - The callback to invoke when the event is triggered.
	 */
	on(eventName, callback) 
	{
		if (!this.events[eventName])
			this.events[eventName] = [];
		this.events[eventName].push(callback);
	}

	/**
	 * Emits a custom event and invokes all registered listeners.
	 * @param {string} eventName - The name of the event.
	 * @param {...any} args - The arguments to pass to the event listeners.
	 */
	emit(eventName, ...args) 
	{
		if (this.events[eventName]) {
			this.events[eventName].forEach(callback => callback(...args));
		}
	}

	/**
	 * Sets up the lobby based on the provided data.
	 * @param {Object} data - The data received for the lobby setup.
	 */
	setupLobby(data) 
	{
		this.cleanUp();
		console.log('Lobby setup data:', data);
	}
}
