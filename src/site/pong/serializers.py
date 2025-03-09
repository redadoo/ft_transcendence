from rest_framework import serializers
from .models import PongMatch, PongTournament

class PongMatchSerializer(serializers.ModelSerializer):
	first_user_username = serializers.CharField(source='first_user.username', read_only=True)
	second_user_username = serializers.CharField(source='second_user.username', read_only=True)
	winner = serializers.SerializerMethodField()
	duration = serializers.SerializerMethodField()

	class Meta:
		model = PongMatch
		fields = [
			'id', 'first_user_username','second_user_username',
			'first_user_score', 'second_user_score', 'first_user_mmr_gain', 'second_user_mmr_gain',
			'start_date', 'end_date', 'winner', 'duration'
		]
		read_only_fields = ['start_date', 'winner', 'duration']

	def get_winner(self, obj):
		return obj.get_winner()

	def get_duration(self, obj):
		return obj.get_duration()

class PongTournamentSerializer(serializers.ModelSerializer):
    """
    Serializer for PongTournament model.
    Includes the winner's username and players who participated in the tournament.
    """
    players = serializers.SerializerMethodField()
    winner = serializers.SerializerMethodField()

    class Meta:
        model = PongTournament
        fields = ['id', 'players', 'start_date', 'end_date', 'winner']
        read_only_fields = ['id']

    def get_players(self, obj):
        players = set()
        
        for match in obj.matches.all():
            players.add(match.first_user)
            players.add(match.second_user)
        
        return [player.username for player in players]

    def get_winner(self, obj):
        if obj.winner:
            return obj.winner.username
        return None

