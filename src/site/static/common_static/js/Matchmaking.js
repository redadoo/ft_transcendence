import GameSocketManager from '../../common_static/js/GameSocketManager.js';

class Matchking {

    constructor()
    {
        this.socketManager = GameSocketManager();

        const button = document.getElementById('startMatchmaking');
        button.addEventListener('click', () => {
            startMatchmaking();
        });
    }

    startMatchmaking(){
        socketManager.initWebSocket(
            'matchmaking',
            this.handleSocketMessage.bind(this));
    }
    
    handleSocketMessage(event)
    {
        try 
		{
			const data = JSON.parse(event.data);
			switch (data.type) 
            {
				case 'init_lobby':
					this.initLobby();
				  	break;
				default:
				  console.log(`This type of event is not managed.`);
			}
		} 
		catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
    }
}
