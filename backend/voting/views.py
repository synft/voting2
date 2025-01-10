from rest_framework import generics, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Session, User, Card, Vote
from .serializers import SessionSerializer, UserSerializer, CardSerializer, VoteSerializer

class SessionListView(generics.ListCreateAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer

class SessionDetailView(generics.RetrieveAPIView):
    serializer_class = SessionSerializer
    lookup_field = 'access_code'
    queryset = Session.objects.all()

class UserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        return User.objects.filter(session=session)

    def perform_create(self, serializer):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        serializer.save(session=session)

class CardListView(generics.ListCreateAPIView):
    serializer_class = CardSerializer

    def get_queryset(self):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        return Card.objects.filter(session=session)

    def perform_create(self, serializer):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        serializer.save(session=session)

class VoteListView(generics.ListCreateAPIView):
    serializer_class = VoteSerializer

    def get_queryset(self):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        return Vote.objects.filter(session=session)

    def perform_create(self, serializer):
        access_code = self.kwargs['access_code']
        session = get_object_or_404(Session, access_code=access_code)
        serializer.save(session=session)