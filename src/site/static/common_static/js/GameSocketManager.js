
/**
 * Manages WebSocket connections for the game.
 */
export default class GameSocketManager {
	constructor() {
		this.socket = undefined;
	}

	/**
	 * Initializes a basic WebSocket connection.
	 * @param {string} finalSocketUrl - The final segment of the WebSocket URL.
	 * @param {function} handleSocketMessage - Callback to handle incoming WebSocket messages.
	 */
	async initWebSocket(finalSocketUrl, handleSocketMessage) {
		if (this.socket)
			this.socket.close();
		
		try {
			const socketUrl = `ws://${window.location.host}/ws/${finalSocketUrl}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
			};
		
			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
			};
		
			this.socket.onerror = (error) => {
				console.error('WebSocket error:', error);
			};

			this.socket.onmessage = handleSocketMessage;
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error.message);
		}
	}

	/**
	 * Initializes the WebSocket connection for a game.
	 * @param {string} gameName - The name of the game.
	 * @param {function} handleSocketMessage - Callback to handle incoming WebSocket messages.
	 * @param {string} roomName - The uuid of the room.
	 */
	async initGameWebSocket(gameName, handleSocketMessage, roomName) {

		if (this.socket)
		{
			console.log("try to init connection with socket but the connection is already establish");
			this.socket.close();
		}
		
		try {
			const mode = GameSocketManager.getModeFromPath();
			
			const socketUrl = `ws://${window.location.host}/ws/${mode}/${gameName}/${roomName}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
			};
		
			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
			};
		
			this.socket.onerror = (error) => {
				console.error('WebSocket error:', error);
			};
			
			this.socket.onmessage = handleSocketMessage;
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error.message);
		}
	}

	/**
	 * Fetches the room name from the API.
	 * @param {string} apiUrl - The API URL.
	 * @returns {Promise<string>} The room name.
	 * @throws Will throw an error if the fetch request fails.
	 */
	async fetchRoomName(apiUrl) {
		try {
			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'X-Requested-With': 'XMLHttpRequest',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			return data.room_name;
		} catch (error) {
			console.error('Error fetching room info:', error.message);
			throw error;
		}
	}

	/**
	 * Extracts the mode from the current URL path.
	 * @returns {string} The mode (first segment of the path).
	 */
	static getModeFromPath() {
		const pathSegments = window.location.pathname.split('/').filter(Boolean);
		return pathSegments[0] || 'default';
	}

	send(data)
	{
		this.socket.send(data);
	}

	close() 
	{
		if(this.socket != undefined)
		{
			console.log("close socket connection and set to undefined the socket");
			this.socket.close();
			delete this.socket;
			this.socket = undefined;
		}
	}
}
