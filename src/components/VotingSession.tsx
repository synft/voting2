import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { VotingWebSocket } from '../lib/websocket';
import { User, Session, Card } from '../types';
import toast from 'react-hot-toast';
import AdminPanel from './AdminPanel';

interface Props {
  user: User;
  session: Session;
  onLeaveSession: () => void;
}

export default function VotingSession({ user, session, onLeaveSession }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, { yes: number; no: number }>>({});
  const wsRef = useRef<VotingWebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new VotingWebSocket(session.id);
    const ws = wsRef.current.connect();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'vote') {
        // Update vote counts
        setVoteCounts(prev => {
          const newCounts = { ...prev };
          const cardCounts = newCounts[data.card_id] || { yes: 0, no: 0 };
          
          if (data.vote) {
            cardCounts.yes++;
          } else {
            cardCounts.no++;
          }
          
          newCounts[data.card_id] = cardCounts;
          return newCounts;
        });

        // Update user's own votes if applicable
        if (data.user_id === user.id) {
          setVotes(prev => ({
            ...prev,
            [data.card_id]: data.vote
          }));
        }
      } else if (data.type === 'card_added') {
        setCards(prev => [...prev, data.card]);
      }
    };

    // Initial data fetch
    fetchCards();
    fetchUserVotes();
    fetchVoteCounts();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [session.id, user.id]);

  const fetchCards = async () => {
    console.log('Fetching cards...');
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching cards:', error);
      return;
    }
    
    console.log('Cards fetched:', data);
    setCards(data || []);
  };

  const fetchUserVotes = async () => {
    console.log('Fetching user votes...');
    const { data, error } = await supabase
      .from('votes')
      .select('card_id, vote')
      .eq('session_id', session.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user votes:', error);
      return;
    }

    const userVotes: Record<string, boolean> = {};
    data?.forEach(vote => {
      userVotes[vote.card_id] = vote.vote;
    });
    console.log('User votes fetched:', userVotes);
    setVotes(userVotes);
  };

  const fetchVoteCounts = async () => {
    console.log('Fetching vote counts...');
    const { data: votes, error } = await supabase
      .from('votes')
      .select('card_id, vote')
      .eq('session_id', session.id);

    if (error) {
      console.error('Error fetching votes:', error);
      return;
    }

    const counts: Record<string, { yes: number; no: number }> = {};
    votes?.forEach(vote => {
      if (!counts[vote.card_id]) {
        counts[vote.card_id] = { yes: 0, no: 0 };
      }
      if (vote.vote) {
        counts[vote.card_id].yes++;
      } else {
        counts[vote.card_id].no++;
      }
    });
    console.log('Vote counts updated:', counts);
    setVoteCounts(counts);
  };

  const handleVote = async (cardId: string, vote: boolean) => {
    try {
      // Try to find existing vote
      const { data: existingVotes, error: searchError } = await supabase
        .from('votes')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .eq('session_id', session.id);

      if (searchError) throw searchError;

      if (existingVotes && existingVotes.length > 0) {
        // Update existing vote
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote })
          .eq('id', existingVotes[0].id);

        if (updateError) throw updateError;
      } else {
        // Create new vote
        const { error: insertError } = await supabase
          .from('votes')
          .insert({
            card_id: cardId,
            user_id: user.id,
            vote,
            session_id: session.id
          });

        if (insertError) throw insertError;
      }

      // Send vote through WebSocket
      if (wsRef.current) {
        wsRef.current.sendVote(cardId, vote, user.id);
      }

      // Update local state immediately for better UX
      setVotes(prev => ({ ...prev, [cardId]: vote }));
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error recording vote:', error);
      toast.error('Failed to record vote');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Voting Session</h1>
        <button
          onClick={onLeaveSession}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
        >
          Leave Session
        </button>
      </div>

      {user.is_admin && <AdminPanel user={user} session={session} />}

      <div className="space-y-6">
        {cards.length === 0 ? (
          <p className="text-center text-gray-500 my-8">No cards have been added yet.</p>
        ) : (
          cards.map(card => (
            <div key={card.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
              <p className="text-gray-600 mb-4">{card.description}</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleVote(card.id, true)}
                  className={`flex-1 py-2 rounded ${
                    votes[card.id] === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-green-100'
                  }`}
                >
                  Agree ({voteCounts[card.id]?.yes || 0})
                </button>
                <button
                  onClick={() => handleVote(card.id, false)}
                  className={`flex-1 py-2 rounded ${
                    votes[card.id] === false
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 hover:bg-red-100'
                  }`}
                >
                  Disagree ({voteCounts[card.id]?.no || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}