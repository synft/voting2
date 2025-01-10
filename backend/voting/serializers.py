from rest_framework import serializers
from .models import Session, User, Card, Vote

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'access_code', 'active', 'created_at', 'closed_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'is_admin', 'session', 'created_at']

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ['id', 'title', 'description', 'session', 'created_at']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'card', 'user', 'vote', 'session', 'created_at']