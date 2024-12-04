
import random
from enum import Enum

class LiarsBarPlayer:

	class PlayerStatus(Enum):
		LIVE = 0
		DIED = 1

	def __init__(self):

		self.hand = []
		self.status = LiarsBarPlayer.PlayerStatus.LIVE
	
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

		return {
			"status": self.status.name,
			"cards": [card.to_dict() for card in self.cards]  
		}