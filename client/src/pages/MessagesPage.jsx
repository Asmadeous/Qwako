import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PenSquare } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConversationList from '@/components/ui/ConversationList';
import ConversationThread from '@/components/ui/ConversationThread';
import StartConversationDialog from '@/components/ui/StartConversationDialog';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import useFetch from '@/utils/useFetch';

// The guest's messages with the owner.
const MessagesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [writing, setWriting] = useState(false);
  const { data, error, loading, reload } = useFetch(id ? null : '/conversations');

  if (id) {
    return (
      <div>
        <AccountNav />
        <ConversationThread id={id} base="/conversations" backTo="/account/messages" backLabel="All messages" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <AccountNav
        description="Questions about a home or a booking, and the owner's replies."
        actions={
          <Button onClick={() => setWriting(true)}>
            <PenSquare aria-hidden className="size-4" />
            New message
          </Button>
        }
      />
      {loading && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.conversations.length ? (
          <ConversationList conversations={data.conversations} linkBase="/account/messages" />
        ) : (
          <EmptyState title="No messages yet.">
            Ask the owner about a home with "Message the owner" on its page, or press New message.
          </EmptyState>
        ))}
      <StartConversationDialog
        open={writing}
        onOpenChange={setWriting}
        params={{}}
        title="Message the owner"
        onSent={(conversationId) => navigate(`/account/messages/${conversationId}`)}
      />
    </div>
  );
};

export default MessagesPage;
