from enum import Enum

class Card:
    """
    Represents a card in the game with a specific seed (type).

    """
    
    class CardSeed(Enum):
        """
        Enum representing the possible types (seeds) of cards in the game.
        """
        ACE = 1
        KING = 2
        QUEEN = 3
        JOLLY = 4

    def __init__(self, seed: CardSeed):
        """
        Initializes a card with a specific seed.

        Args:
            seed (CardSeed): The type of the card, as defined in the CardSeed Enum.

        Raises:
            ValueError: If the provided seed is not a valid CardSeed.
        """
        if not isinstance(seed, Card.CardSeed):
            raise ValueError("Invalid card seed")
        
        self.seed = seed

    def to_dict(self) -> dict:
        """
        Converts the card to a dictionary representation.

        Returns:
            dict: A dictionary with the card's seed name.
        """
        return {
            "card": self.seed.name
        }
