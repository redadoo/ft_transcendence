from rest_framework import serializers
from .models import Friendships, UserStats, UserImage, MatchHistory, User
from rest_framework import serializers
from pong.serializers import PongMatchSerializer
from liarsbar.serializers import LiarsBarMatchSerializer
from pong.models import *

class UserStatsSerializer(serializers.ModelSerializer):
	level = serializers.SerializerMethodField()
	cap_exp = serializers.SerializerMethodField()
	percentage_next_level = serializers.SerializerMethodField()

	class Meta:
		model = UserStats
		fields = [
			'exp', 'mmr', 'win', 'lose', 'longest_winstreak',
			'total_points_scored', 'longest_game', 'time_on_site',
			'level', 'cap_exp', 'percentage_next_level', 'date_updated'
		]
		read_only_fields = ['date_updated']

	def get_level(self, obj):
		return obj.get_level()

	def get_cap_exp(self, obj):
		return obj.get_cap_exp()

	def get_percentage_next_level(self, obj):
		return obj.get_percentage_next_level()

class UserImageSerializer(serializers.ModelSerializer):
	avatar_url = serializers.ImageField(source='user_avatar', read_only=True)
	class Meta:
		model = UserImage
		fields = ['avatar_url']

class FriendshipsSerializer(serializers.ModelSerializer):
	status_display = serializers.CharField(source='get_status_display', read_only=True)
	first_user_username = serializers.CharField(source='first_user.username', read_only=True)
	second_user_username = serializers.CharField(source='second_user.username', read_only=True)

	class Meta:
		model = Friendships
		fields = [
			'id',
			'status',
			'status_display',
			'first_user',
			'first_user_username',
			'second_user',
			'second_user_username',
			'date_created',
			'date_updated'
		]
		read_only_fields = ['date_created', 'date_updated']

class MatchHistorySerializer(serializers.ModelSerializer):
    pong_matches = PongMatchSerializer(many=True, read_only=True)
    liarsbar_matches = LiarsBarMatchSerializer(many=True, read_only=True)
    all_matches = serializers.SerializerMethodField()

    class Meta:
        model = MatchHistory
        fields = ['user', 'pong_matches', 'liarsbar_matches', 'all_matches']
        read_only_fields = ['all_matches']

    def get_all_matches(self, obj):
        matches = obj.get_all_matches()
        return [
            {
                'type': 'Pong Match' if isinstance(match, PongMatch) else 'Liars Bar Match',
                'details': (
                    PongMatchSerializer(match).data
                    if isinstance(match, PongMatch) else LiarsBarMatchSerializer(match).data
                ),
            }
            for match in matches
        ]

class UserProfileSerializer(serializers.ModelSerializer):
	image_url = UserImageSerializer(source='user_image', read_only=True)
	stat = UserStatsSerializer(source='user_stat', read_only=True)
	friendships = serializers.SerializerMethodField()
	history = MatchHistorySerializer(source='match_history', many=True, read_only=True)

	class Meta:
		model = User
		fields = ['id', 'username', 'email', 'created_at', 'status','image_url', 'stat', 'friendships', 'history']
		read_only_fields = ['id', 'username', 'email', 'created_at', 'status','image_url', 'stat', 'friendships', 'history']

	def __init__(self, *args, **kwargs):
		fields = kwargs.pop('fields', None)
		super().__init__(*args, **kwargs)
		
		if fields:
			allowed = set(fields)
			existing = set(self.fields)
			for field_name in existing - allowed:
				self.fields.pop(field_name)

	def get_friendships(self, obj):
		friendships = Friendships.objects.filter(
			models.Q(first_user=obj) | models.Q(second_user=obj)
		)
		return FriendshipsSerializer(friendships, many=True).data
	
class SimpleUserProfileSerializer(serializers.ModelSerializer):
    image_url = UserImageSerializer(source='user_image', read_only=True)
    status = serializers.CharField(source='get_status_display', read_only=True)
	
    class Meta:
        model = User
        fields = ['username', 'image_url', 'status']
        read_only_fields = ['username', 'image_url', 'status']

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)
        
        if fields:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)