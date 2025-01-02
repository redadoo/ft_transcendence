
/**
 * Manages WebSocket connections for the game.
 */
export default class SocketManager 
{
	constructor() {
		this.socket = undefined;
		this.connected = false;
	}

	/**
	 * Initializes a basic WebSocket connection.
	 * @param {string} finalSocketUrl - The final segment of the WebSocket URL.
	 * @param {function} handleSocketMessage - Callback to handle incoming WebSocket messages.
	 */
	initWebSocket(finalSocketUrl, handleSocketMessage, onSocketOpen = null, onSocketClose = null, onSocketError = null) 
	{
		if (this.connected) 
		{
			console.warn('WebSocket is already connected.');
			return;
		}

		try {
			const socketUrl = `ws://${window.location.host}/ws/${finalSocketUrl}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
				this.connected = true;
	
				if (onSocketOpen) 
					onSocketOpen();
			};

			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
				this.connected = false;
	
				if (onSocketClose)
					onSocketClose();
			};

			this.socket.onerror = (error) => {
				console.error('WebSocket error:', error);
	
				if (onSocketError)
					onSocketError(error);
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
	initGameWebSocket(gameName, handleSocketMessage, roomName, onSocketOpen = null, onSocketClose = null, onSocketError = null) 
	{
		if (this.connected) 
		{
			console.warn('WebSocket is already connected.');
			return;
		}

		try {
			const mode = SocketManager.getModeFromPath();

			const socketUrl = `ws://${window.location.host}/ws/${mode}/${gameName}/${roomName}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
				this.connected = true;
	
				if (onSocketOpen) 
					onSocketOpen();
			};

			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
				this.connected = false;
	
				if (onSocketClose)
					onSocketClose();
			};

			this.socket.onerror = (error) => {
				console.error('WebSocket error:', error);
	
				if (onSocketError)
					onSocketError(error);
			};

			this.socket.onmessage = handleSocketMessage;
		} catch (error) {
			console.error('Failed to initialize WebSocket:', error.message);
		}
	}

	/**
	 * Initializes a WebSocket connection with retry logic.
	 * 
	 * Attempts to establish a WebSocket connection to the given URL with a specified number of retries 
	 * and delay between retries.
	 *
	 * @param {string} finalSocketUrl - The final segment of the WebSocket URL.
	 * @param {function} handleSocketMessage - Callback function to handle incoming WebSocket messages.
	 * @param {number} [retries=3] - The number of retry attempts for establishing the connection. Default is 3.
	 * @param {number} [delay=2000] - The delay (in milliseconds) between retry attempts. Default is 2000 ms.
	 * @throws Will throw an error if the connection fails after the specified number of retries.
	 * @returns {Promise<void>}
	 */
	async initWebSocketWithRetries(finalSocketUrl, handleSocketMessage, retries = 3, delay = 2000) 
	{
		if (this.connected) 
		{
			console.warn('WebSocket is already connected.');
			return;
		}

		let attempt = 0;
		while (attempt < retries) {
			try {
				const socketUrl = `ws://${window.location.host}/ws/${finalSocketUrl}`;
				this.socket = new WebSocket(socketUrl);
				this.socket.onmessage = handleSocketMessage;
				this.socket.onopen = () => {
					console.log('WebSocket connection opened');
					this.connected = true;
				};
				
				this.socket.onerror = (error) => {
					console.error('WebSocket error:', error);
				};

				this.socket.onclose = () => {
					console.log('WebSocket connection closed');
					this.connected = false;
				};

				return;
			} catch (error) {
				attempt++;
				console.warn(`Retrying WebSocket connection... Attempt ${attempt}`);
				if (attempt >= retries) {
					console.error('Failed to establish WebSocket connection after retries.');
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	/**
	 * Fetches the room name from the API.
	 * @param {string} apiUrl - The API URL.
	 * @returns {Promise<string>} The room name.
	 * @throws Will throw an error if the fetch request fails.
	 */
	async fetchRoomName(apiUrl) 
	{
		try {
			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'X-Requested-With': 'XMLHttpRequest',
				},
				credentials: 'include',
			});

			if (!response.ok) 
				throw new Error(`HTTP error! Status: ${response.status}`);

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
	static getModeFromPath() 
	{
		const pathSegments = window.location.pathname.split('/').filter(Boolean);
		return pathSegments[0] || 'default';
	}

	send(data) 
	{
		if (!this.connected) 
		{
			console.warn('Cannot send data. WebSocket is not connected.');
			return;
		}
		// console.log("send to socket this data : " + data);
		this.socket.send(data);
	}

	close()
	close()
	{
		if (this.socket) {
			this.socket.close();
			this.connected = false;
			this.socket = undefined;
			delete this.socket;
		}
	}
}
