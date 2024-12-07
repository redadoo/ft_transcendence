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
    
    }
}
