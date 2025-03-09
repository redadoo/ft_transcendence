import random
from enum import Enum
from utilities.Player import Player
from liarsbar.scripts.card import Card

class LiarsBarPlayer(Player):
	"""
	Represents a player in the Liars Bar game, extending the base Player class.
	"""
	
	class PlayerStatus(Enum):
		"""
		Enum representing the possible statuses of a player.
		"""
		ALIVE = 0
		DIED = 1

	def __init__(self, player_id: int):
		"""
		Initializes a new Liars Bar player.

		Args:
			player_id (int): The unique identifier for the player.
		"""
		super().__init__(player_id)
		self.hand: list[Card] = []
		self.selected_cards:list[Card] = []
		self.selected_index = [] 
		self.status = LiarsBarPlayer.PlayerStatus.ALIVE
		self.card_selection_index = 0
		self.player_turn = False
		self.card_sent = False
		self.doubting = False		
		self.keys_pressed = set()

	def add_cards_to_hand(self, cards: list):
		"""
		Adds multiple cards to the player's hand.

		Args:
			cards (list): A list of Card objects to be added to the player's hand.
		"""
		self.hand.extend(cards)

	def play_card_from_hand(self, cards: list):
		"""
		Removes specified cards from the player's hand if they exist.

		Args:
			cards (list): A list of Card objects to be played.

		Raises:
			ValueError: If a card in the list is not present in the player's hand.
		"""
		for card in cards:
			if card in self.hand:
				self.hand.remove(card)
			else:
				raise(f"Card {card} not in hand.")

	def shoot_yourself(self) -> bool:
		"""
		Simulates the player taking a risky action with a 1 in 6 chance of failure.

		Returns:
			bool: True if the player fails (shoots themselves), False otherwise.
		"""
		return random.randint(1, 3) == 1

	def player_loop(self):
		"""
		Placeholder for the main logic of the player's turn.

		To be implemented with the specifics of the game.
		"""
		

	def update_player_data(self, data: dict):
		"""
		Updates the player's data based on an input dictionary.

		Args:
			data (dict): A dictionary containing updated player information.
		"""
		try:
			if "action_type" not in data or "key" not in data:
				raise ValueError("Missing required keys: 'action_type' and 'key'.")
			
			event_type = data.get("action_type")
			key = data.get("key")

			if event_type not in {"key_down", "key_up"}:
				raise ValueError(f"Invalid action_type: {event_type}. Expected 'key_down' or 'key_up'.")
			
			if key not in {"KeyA", "KeyD", "KeyE", "Enter", "Space"}:
				raise ValueError(f"Invalid key: {key}. Expected 'Enter', 'KeyA', 'KeyD', 'KeyE', or 'Space'.")

			print("key")
			if event_type == "key_down":
				if key in self.keys_pressed:
					# Tasto già premuto, ignorare l'azione.
					return
				self.keys_pressed.add(key)  # Registra il tasto come premuto.

				# Esegui azione solo al primo evento di pressione.
				if key == "KeyD":
					if self.card_selection_index == len(self.hand) - 1:
						self.card_selection_index = 0
					else:
						self.card_selection_index += 1
					print(self.card_selection_index)
				elif key == "KeyA":
					if self.card_selection_index == 0:
						self.card_selection_index = len(self.hand) - 1
					else:
						self.card_selection_index -= 1
					print(self.card_selection_index)
				elif key == "KeyE":
					if self.player_turn:
						
						index = self.card_selection_index
						if index in self.selected_index:
							self.selected_index.remove(index)
							print(f"Index {index} removed. Current indices: {self.selected_index}")
						else:
							self.selected_index.append(index)
							print(f"Index {index} added. Current indices: {self.selected_index}")
				elif key == "Enter":
					if self.player_turn and not self.card_sent and self.selected_index:
						self.card_selection_index = 0
						print("premuto enter e passato controllo")
						self.selected_cards.clear()
						# Ordina gli indici in ordine decrescente per evitare problemi di rimozione
						for index in sorted(self.selected_index, reverse=True):
							if 0 <= index < len(self.hand):  # Controlla che l'indice sia valido
								self.selected_cards.append(self.hand.pop(index))

						# Svuota la lista degli indici selezionati dopo aver rimosso le carte
							self.selected_index.clear()
						self.card_sent = True
				elif key == "Space":
					if self.player_turn and not self.doubting:
						self.doubting = True

			elif event_type == "key_up":
				self.keys_pressed.discard(key)

		except ValueError as e:
			print(f"Error: {e}")
							

		except (TypeError, ValueError) as e:
			print(f"Error in update_player_data: {e}")
	
	def player_disconnection(self):
		"""
		Abstract method for handling player-specific disconnection logic. 
		Must be implemented by subclasses.
		"""
		pass

	def to_dict(self) -> dict:
		"""
		Converts the player's current state to a dictionary representation.

		Returns:
			dict: A dictionary containing the player's ID, status, and hand of cards.
		"""
		base_dict = super().to_dict()
		base_dict.update({
			"status": self.status.name,
			"hand": [card.to_dict() for card in self.hand],
			"selection_index": self.card_selection_index,
			"selected_index": self.selected_index,
			"selected_cards": [card.to_dict() for card in self.selected_cards],
			"player_turn": self.player_turn,
			"card_sent": self.card_sent,
			"doubting": self.doubting
		})
		return base_dict
