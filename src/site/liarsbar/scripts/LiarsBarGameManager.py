
import random
import asyncio

from .card import Card
from .LiarsBarPlayer import LiarsBarPlayer
from utilities.GameManager import GameManager

class LiarsBarGameManager(GameManager):

	def __init__(self):
		super().__init__(max_players=4)
		self.update_lock = asyncio.Lock()
		self.deck = self.init_cards()

	def add_player(self, players_id: int):
		if len(self.players) > 2:
			raise ValueError("Two unique player IDs are required to initialize players.")

		self.players[players_id] = LiarsBarPlayer(player_id=players_id)

	def init_players(self, players: list[LiarsBarPlayer]):
		for player in players:
			self.players[player.id] = LiarsBarPlayer(player.id)
	
	def init_cards(self) -> list[Card]:
		"""
		Initializes a shuffled deck of cards for the game.
		"""
		deck = []

		for seed in [Card.CardSeed.ACE, Card.CardSeed.KING, Card.CardSeed.QUEEN]:
			deck.extend([Card(seed)] * 6)

		deck.extend([Card(Card.CardSeed.JOLLY)] * 2)
		random.shuffle(deck)
		return deck

	def player_disconnected(self, player_id: str):
		"""
		Handle logic when a player disconnects.
		"""
		if player_id in self.players:
			del self.players[player_id]
		else:
			raise ValueError(f"Player {player_id} not found in the game.")
		
	async def game_loop(self):
		...

	def to_dict(self) -> dict[str, any]:
		base_dict = super().to_dict()
		base_dict.update({"deck": [card.to_dict() for card in self.deck]})
		return base_dict