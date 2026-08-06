import { useEffect, useState, useCallback, useRef, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as messageApi from '@/api/messageApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Send, ImageOff } from 'lucide-react';
import type { ChatMessage, Conversation, NewMessageSocketPayload } from '@/types';

/**
 * MessagesPage.tsx
 * ------------------------------------------------------------------
 * Private route: /messages (guarded by ProtectedRoute)
 *
 * Two-pane layout: conversation list + active thread. Message history
 * loads via REST; new incoming messages arrive live via the socket
 * ('new_message' event) without needing to re-fetch. Outgoing
 * messages are sent via REST (which also triggers the server-side
 * socket emit to the recipient) — this app deliberately does NOT
 * send messages directly over the socket, keeping persistence and
 * delivery as a single, reliable REST call rather than two separate
 * code paths that could get out of sync.
 */
export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const activeConversationId = searchParams.get('conversation');

  const fetchConversations = useCallback(async () => {
    setIsLoadingConvos(true);
    try {
      const { data } = await messageApi.getMyConversations();
      setConversations(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Refresh the conversation list whenever ANY new message arrives
  // (even for a conversation not currently open) — keeps unread
  // counts and "last message" previews accurate across the whole list.
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, fetchConversations]);

  const selectConversation = (id: string) => {
    setSearchParams({ conversation: id });
  };

  if (isLoadingConvos) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-12rem)] grid-cols-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:grid-cols-3">
      {/* --- Conversation list --- */}
      <div
        className={`overflow-y-auto border-gray-200 md:col-span-1 md:border-r ${
          activeConversationId ? 'hidden md:block' : 'block'
        }`}
      >
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No conversations yet. Start one from an item's detail page.
          </div>
        ) : (
          conversations.map((convo) => {
            const otherUser = convo.participants.find((p) => p._id !== user?._id);
            const isActive = convo._id === activeConversationId;

            return (
              <button
                key={convo._id}
                onClick={() => selectConversation(convo._id)}
                className={`flex w-full items-start gap-3 border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
                  isActive ? 'bg-brand-50' : ''
                }`}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {convo.asset?.images?.[0] ? (
                    <img src={convo.asset.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-gray-900">
                      {otherUser?.name || 'Unknown'}
                    </p>
                    {!!convo.unreadCount && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  {convo.asset && (
                    <p className="truncate text-xs text-gray-400">Re: {convo.asset.name}</p>
                  )}
                  <p className="truncate text-sm text-gray-500">
                    {convo.lastMessageText || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* --- Active thread --- */}
      <div className={`md:col-span-2 ${activeConversationId ? 'block' : 'hidden md:block'}`}>
        {activeConversationId ? (
          <ConversationThread
            conversationId={activeConversationId}
            conversation={conversations.find((c) => c._id === activeConversationId)}
            onBack={() => setSearchParams({})}
            onMessageSent={fetchConversations}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Select a conversation to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ConversationThread
 * ------------------------------------------------------------------
 * The message history + composer for a single active conversation.
 * Subscribes to the socket for live incoming messages scoped to THIS
 * conversation specifically (filters out events for other threads).
 */
function ConversationThread({
  conversationId,
  conversation,
  onBack,
  onMessageSent,
}: {
  conversationId: string;
  conversation?: Conversation;
  onBack: () => void;
  onMessageSent: () => void;
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await messageApi.getMessages(conversationId, { limit: 100 });
      setMessages(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live incoming messages for THIS conversation specifically.
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload: NewMessageSocketPayload) => {
      if (payload.conversationId === conversationId) {
        setMessages((prev) => [...prev, payload.message]);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setIsSending(true);
    try {
      const { data } = await messageApi.sendMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, data]);
      setMessageText('');
      onMessageSent();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const otherUser = conversation?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="flex h-full flex-col">
      {/* --- Thread header --- */}
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <button onClick={onBack} className="text-sm text-gray-500 md:hidden">
          ←
        </button>
        <div>
          <p className="font-medium text-gray-900">{otherUser?.name || 'Conversation'}</p>
          {conversation?.asset && (
            <Link
              to={`/assets/${conversation.asset._id}`}
              className="text-xs text-brand-600 hover:underline"
            >
              Re: {conversation.asset.name}
            </Link>
          )}
        </div>
      </div>

      {/* --- Messages --- */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender._id === user?._id;
              return (
                <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isOwn ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`mt-1 text-[10px] ${isOwn ? 'text-brand-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* --- Composer --- */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-4">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
        />
        <button
          type="submit"
          disabled={isSending || !messageText.trim()}
          className="rounded-md bg-brand-600 p-2 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}