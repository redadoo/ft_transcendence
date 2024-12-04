from enum import Enum

class Card:
	class CardSeed(Enum):
		ACE = 1
		KING = 2
		QUEEN = 3
		JOLLY = 4


	def __init__(self, seed: CardSeed):
		"""
		Initializes a card with a specific seed (CardSeed).
		"""

		if not isinstance(seed, Card.CardSeed):
			raise ValueError("Invalid card seed")
		
		self.seed = seed

	def to_dict(self):

		return {
			"card" : self.seed.name
		}
