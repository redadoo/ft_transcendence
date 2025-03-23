import router from '../../site_static/js/router.js';


/**
 * Manages WebSocket connections for the game.
 */
export default class SocketManager 
{
	constructor(activePing) {
		
		this.lastPingTime = 0;
		this.connected = false;
		this.socket = undefined;
		this.pingThreshold = 200;
		this.pingInterval = null;
		this.onSlowConnection = null;
		this.activePing = activePing;
		this.isSlowConnection = false;
		this.onNormalConnection = null;
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
			
			var wsProtocol = 'ws:/';

			if (window.location.protocol == 'https:') 
				wsProtocol = 'wss:/';

			const socketUrl = `${wsProtocol}/${window.location.host}/ws/${finalSocketUrl}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
				this.connected = true;
				this.startPing();
				if (onSocketOpen) 
					onSocketOpen();
			};

			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
				this.connected = false;
				this.stopPing();
				if (onSocketClose)
					onSocketClose();
			};

			this.socket.onerror = (error) => {
				alert("WebSocket error : " + error);
				router.navigateTo('/');
				if (onSocketError)
					onSocketError(error);
			};

			this.socket.onmessage = (event) => {
				let data;
				try {
					data = JSON.parse(event.data);
				} catch (e) {
					console.error("Error parsing message:", e);
					console.log("Raw received data:", event.data);
					return;
				}
			
				if (this.processPingMessage(data)) 
					return;
			
				handleSocketMessage(data);
			};
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
			var wsProtocol = 'ws:/';
			
			if (window.location.protocol == 'https:') 
				wsProtocol = 'wss:/';
			
			const mode = SocketManager.getModeFromPath();
			const socketUrl = `${wsProtocol}/${window.location.host}/ws/${mode}/${gameName}/${roomName}`;
			this.socket = new WebSocket(socketUrl);

			this.socket.onopen = () => {
				console.log('WebSocket connection opened');
				this.connected = true;
				this.startPing();
				if (onSocketOpen) 
					onSocketOpen();
			};

			this.socket.onclose = () => {
				console.log('WebSocket connection closed');
				this.connected = false;
				this.stopPing();
				if (onSocketClose)
					onSocketClose();
			};

			this.socket.onerror = (error) => {
				alert("WebSocket error : " + error);
				router.navigateTo('/');
				if (onSocketError)
					onSocketError(error);
			};

			this.socket.onmessage = (event) => {
				let data;
				try {
					data = JSON.parse(event.data);
				} catch (e) {
					console.error("Error parsing message:", e);
					console.log("Raw received data:", event.data);
					return;
				}
			
				if (this.processPingMessage(data)) 
					return;
			
				handleSocketMessage(data);
			};
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
				var wsProtocol = 'ws:/';
			
				if (window.location.protocol == 'https:') 
					wsProtocol = 'wss:/';

				const socketUrl = `${wsProtocol}/${window.location.host}/ws/${finalSocketUrl}`;
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

	/**
	 * Processes ping/pong messages.
	 * @param {Object} data - The parsed message data.
	 * @returns {boolean} - Returns true if the message was a ping/pong message.
	 */
	processPingMessage(data) 
	{
		if (this.activePing === false)
			return;
		
		if (data.type && data.type === 'pong' && data.time) 
		{
			const currentPing = Date.now() - data.time;
			console.log('Ping:', currentPing, 'ms');

			if (currentPing > this.pingThreshold) 
			{
				if (!this.isSlowConnection) 
				{
					this.isSlowConnection = true;
					console.warn("High ping detected. Disabling actions.");
					if (this.onSlowConnection)
						this.onSlowConnection(currentPing);
				}
			} 
			else 
			{
				if (this.isSlowConnection) 
				{
					this.isSlowConnection = false;
					console.log("Ping back to normal.");
					if (this.onNormalConnection)
						this.onNormalConnection(currentPing);
				}
			}
			return true;
		}
		return false;
	}

	/**
	 * Starts the ping mechanism.
	 */
	startPing() 
	{
		if (this.activePing === false)
			return;
		
		this.sendPing();
		this.pingInterval = setInterval(() => {
			this.sendPing();
		}, 5000);
	}

	/**
	 * Stops the ping mechanism.
	 */
	stopPing() 
	{
		if (this.activePing === false)
			return;

		if (this.pingInterval) 
		{
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	/**
	 * Sends a ping message over the WebSocket.
	 */
	sendPing() {
		if (!this.connected || this.activePing === false) return;
		this.lastPingTime = Date.now();
		const pingMessage = JSON.stringify({ type: 'ping', time: this.lastPingTime });
		this.send(pingMessage);
	}

	/**
	 * Sends data over the WebSocket connection.
	 * @param {string} data - The data to send.
	 */
	send(data) {
		if (!this.connected) {
			return;
		}
		this.socket.send(data);
	}

	/**
	 * Closes the WebSocket connection.
	 */
	close() {
		if (this.socket) {
			this.socket.close();
			this.connected = false;
			this.socket = undefined;
			delete this.socket;
		}
	}
}
