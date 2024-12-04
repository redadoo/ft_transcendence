
import random
from .card import Card
from .LiarsBarPlayer import LiarsBarPlayer

class LiarsBarGameManager():

	def __init__(self):
		self.deck = self.init_cards()
		self.players = {}
		self.max_player = 4

	def add_player(self, players):
		for player in players:
			self.players.update({f"{player.id}" : LiarsBarPlayer()})

	def add_player(self, player):
		self.players.update({f"{player.id}" : LiarsBarPlayer()})


	def init_cards(self):
		"""
		Initializes self.cards with Card instances for each CardSeed.
		"""

		deck = []

		for seed in [Card.CardSeed.ACE, Card.CardSeed.KING, Card.CardSeed.QUEEN]:
			deck.extend([Card(seed)] * 6)

		deck.extend([Card(Card.CardSeed.JOLLY)] * 2)
		random.shuffle(deck)
		return deck

	def to_dict(self):
		"""
		Converts the game manager to a dictionary with current gamestatus and cards.
		"""

		return {
			"deck": [card.to_dict() for card in self.deck],
			"players": [player.to_dict() for player in self.players]
		}