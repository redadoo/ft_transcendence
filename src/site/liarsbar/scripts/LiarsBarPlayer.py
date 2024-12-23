import random
from enum import Enum
from utilities.Player import Player

class LiarsBarPlayer(Player):

	class PlayerStatus(Enum):
		LIVE = 0
		DIED = 1

	def __init__(self, player_id: int):
		super().__init__(player_id)
		self.hand = []
		self.status = LiarsBarPlayer.PlayerStatus.LIVE
	
	def player_loop(self):
		pass

	def update_player_data(self, data: dict):
		pass
	
	def add_cards_to_hand(self, cards):
		"""Add multiple cards to the player's hand."""

		self.hand.extend(cards)

	def play_card_from_hand(self, cards):
		"""Play multiple cards from the player's hand."""

		for card in cards:
			if card in self.hand:
				self.hand.remove(card)
			else:
				print(f"Card {card} not in hand.")

	def shoot_yourself(self):
		"""
		Simulates the player shooting themselves with a 1 in 6 chance.
		Returns True if the player shoots themselves, False otherwise.
		"""
		return random.randint(1, 6) == 1
	
	def to_dict(self):
		base_dict = super().to_dict()
		base_dict.update({
			"status": self.status.name,
			"cards": [card.to_dict() for card in self.cards]  
		})
		return base_dict