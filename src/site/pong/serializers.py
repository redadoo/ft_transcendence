from rest_framework import serializers
from .models import PongMatch

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
