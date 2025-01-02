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
		self.status = LiarsBarPlayer.PlayerStatus.ALIVE

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
		return random.randint(1, 6) == 1

	def player_loop(self):
		"""
		Placeholder for the main logic of the player's turn.

		To be implemented with the specifics of the game.
		"""
		pass

	def update_player_data(self, data: dict):
		"""
		Updates the player's data based on an input dictionary.

		Args:
			data (dict): A dictionary containing updated player information.
		"""
		pass
	
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
			"hand": [card.to_dict() for card in self.hand]
		})
		return base_dict
