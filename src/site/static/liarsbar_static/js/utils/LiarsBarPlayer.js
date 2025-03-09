import BaseInput from '../../../common_static/js/BaseInput.js';

export default class LiarsBarPlayer
{
	constructor(socket, playerId)
	{
		this.socket = socket;
		this.playerId = playerId;
		this.hand = []; // Mano del giocatore
		this.status = ''; // Stato del giocatore (es. "ALIVE", "DIED")
		this.playerTurn = false; // Indica se è il turno del giocatore
		this.selectedCards = []; // Carte selezionate
		this.selectedIndex = []; // Indici delle carte selezionate
		this.doubting = false; // Indica se il giocatore sta dubitando
		this.cardSent = false; // Indica se una carta è stata inviata

		this.setUpKeys();
	}

	setUpKeys()
	{
		this.controlKeys = {
			leftSwitch: 'KeyA',
			rightSwitch: 'KeyD',
			selectAction: 'KeyE',
			doubtAction: 'Space',
			confirmAction:'Enter'
		};

		this.input = new BaseInput();
		this.input.addEvent('keydown', this.handleKey.bind(this, 'key_down'));
		this.input.addEvent('keyup', this.handleKey.bind(this, 'key_up'));
	}

	handleKey(actionType, event) 
	{
		if (this.socket) 
		{
			const key = Object.keys(this.controlKeys).find(
				(k) => this.controlKeys[k] === event.code
			);
			if (key) 
			{
				this.socket.send
				(
					JSON.stringify
					(
						{
							type: 'update_player',
							action_type: actionType,
							key: this.controlKeys[key],
							playerId: this.playerId,
						}
					)
				);
			}
		}
	}

	updateState(lobbyInfo) 
	{
		// Verifica che lobbyInfo.players sia un oggetto
		if (!lobbyInfo.players || typeof lobbyInfo.players !== 'object') 
		{
			console.error('lobbyInfo.players non è un oggetto valido.', lobbyInfo.players);
			return;
		}
	
		// Converti l'oggetto players in un array
		const playersArray = Object.values(lobbyInfo.players);
	
		// Trova il giocatore corrente nei dati ricevuti
		const currentPlayerData = playersArray.find(
			(player) => player.player_id === this.playerId
		);
	
		if (currentPlayerData)
		{
			// Aggiorna la mano del giocatore
			this.hand = currentPlayerData.hand.map(cardObj => cardObj.card); // Estrae solo il valore della carta
	
			// Aggiorna altre proprietà
			this.status = currentPlayerData.status;
			this.playerTurn = currentPlayerData.player_turn;
			this.selectedCards = currentPlayerData.selected_cards;
			this.selectedIndex = currentPlayerData.selected_index;
			this.doubting = currentPlayerData.doubting;
			this.cardSent = currentPlayerData.card_sent;
			this.playerConnectionState = currentPlayerData.player_connection_state;
			this.selectionIndex = currentPlayerData.selection_index;
		}
		else
		{
			console.error('Dati del giocatore non trovati nel lobbyInfo.');
		}
	}
}