import { useEffect, useState, useCallback, useRef, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as messageApi from '@/api/messageApi';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import {
  Send,
  ArrowLeft,
  CheckCheck,
  Clock,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import type { ChatMessage, Conversation, NewMessageSocketPayload } from '@/types';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
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

  // Refresh conversation list preview on socket new_message
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

  if (isLoadingConvos && conversations.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-xs font-medium text-gray-500">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Direct Messages</h1>
          <p className="text-xs text-gray-500">
            Real-time chat with lenders and borrowers across your neighborhood.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs shadow-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-gray-600">
            {isConnected ? 'Real-time Connected' : 'Connecting to Chat...'}
          </span>
        </div>
      </div>

      <div className="grid h-[calc(100vh-14rem)] min-h-[500px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm md:grid-cols-12">
        {/* --- LEFT COLUMN: Conversation list --- */}
        <div
          className={`border-gray-200 md:col-span-4 lg:col-span-4 md:border-r overflow-y-auto ${
            activeConversationId ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Conversations ({conversations.length})
            </p>
          </div>

          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold text-gray-900">No conversations yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Start a chat by clicking "Message Owner" on any item page.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {conversations.map((convo) => {
                const otherUser = convo.participants.find((p) => p._id !== user?._id);
                const isActive = convo._id === activeConversationId;

                return (
                  <button
                    key={convo._id}
                    onClick={() => selectConversation(convo._id)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50/80 ${
                      isActive ? 'bg-brand-50/70 border-l-4 border-brand-600 pl-3' : ''
                    }`}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                      {convo.asset?.images?.[0] ? (
                        <img
                          src={convo.asset.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-brand-100 font-bold text-brand-700 text-sm">
                          {otherUser?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {otherUser?.name || 'Community Member'}
                        </p>
                        {!!convo.unreadCount && (
                          <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>

                      {convo.asset && (
                        <p className="truncate text-[11px] font-medium text-brand-700">
                          Re: {convo.asset.name}
                        </p>
                      )}

                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {convo.lastMessageText || 'Conversation started'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Active thread --- */}
        <div
          className={`md:col-span-8 lg:col-span-8 ${
            activeConversationId ? 'block' : 'hidden md:block'
          }`}
        >
          {activeConversationId ? (
            <ConversationThread
              conversationId={activeConversationId}
              conversation={conversations.find((c) => c._id === activeConversationId)}
              onBack={() => setSearchParams({})}
              onMessageSent={fetchConversations}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-700">No conversation selected</p>
              <p className="mt-1 text-xs text-gray-400 max-w-xs">
                Pick a conversation from the left to read messages or send an instant message.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Real-Time Active Conversation Thread
 * Features:
 *  - Optimistic UI updates (<16ms message feedback)
 *  - Typing indicators over Socket.io
 *  - Deduplication
 *  - Delivery status icons
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
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUser = conversation?.participants.find((p) => p._id !== user?._id);

  // 1. Fetch message history
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

  // 2. Scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping]);

  // 3. Join conversation room and listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // Join room for this conversation
    socket.emit('join_conversation', conversationId);

    // Listen for live messages
    const handleNewMessage = (payload: NewMessageSocketPayload) => {
      if (payload.conversationId === conversationId) {
        setMessages((prev) => {
          // Prevent duplicates if already present
          if (prev.some((m) => m._id === payload.message._id)) {
            return prev;
          }
          // If there is an optimistic message from this sender with matching text, replace it
          const matchingOptimisticIndex = prev.findIndex(
            (m) =>
              m._id.startsWith('temp-') &&
              m.sender._id === payload.message.sender._id &&
              m.text === payload.message.text
          );
          if (matchingOptimisticIndex !== -1) {
            const next = [...prev];
            next[matchingOptimisticIndex] = payload.message;
            return next;
          }
          return [...prev, payload.message];
        });
      }
    };

    // Listen for typing events
    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setIsOtherUserTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, conversationId, user?._id]);

  // 4. Handle input changes and typing broadcasts
  const handleInputChange = (text: string) => {
    setMessageText(text);

    if (socket) {
      socket.emit('typing', { conversationId, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 1500);
    }
  };

  // 5. Instant Optimistic Message Submission
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;

    // Stop typing state immediately
    if (socket) {
      socket.emit('typing', { conversationId, isTyping: false });
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: user!,
      text: trimmed,
      readBy: [user!._id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Clear input IMMEDIATELY (<1ms response)
    setMessageText('');

    // 2. Add to chat UI IMMEDIATELY
    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      const { data } = await messageApi.sendMessage(conversationId, trimmed);

      // 3. Swap temp id with server message
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data : m))
      );
      onMessageSent();
    } catch (error) {
      // Rollback on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setMessageText(trimmed);
      toast.error('Failed to deliver message. Check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white text-xs shadow-xs">
            {otherUser?.name?.charAt(0) || 'U'}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-900">{otherUser?.name || 'Neighbor'}</p>
            {isOtherUserTyping ? (
              <p className="text-[11px] font-semibold text-brand-600 animate-pulse">
                typing a message...
              </p>
            ) : (
              <p className="text-[11px] text-gray-400">Direct conversation</p>
            )}
          </div>
        </div>

        {conversation?.asset && (
          <Link
            to={`/assets/${conversation.asset._id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 shadow-xs"
          >
            <span className="truncate max-w-[120px] sm:max-w-xs">{conversation.asset.name}</span>
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/40">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <p className="text-xs">No messages yet. Send a greeting to start chatting!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender._id === user?._id;
            const isOptimistic = msg._id.startsWith('temp-');
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-gray-400">
                  <span>{timeStr}</span>
                  {isMe && (
                    <span>
                      {isOptimistic ? (
                        <Clock className="h-2.5 w-2.5 text-brand-300 animate-spin" />
                      ) : (
                        <CheckCheck className="h-3 w-3 text-emerald-500" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator bubble */}
        {isOtherUserTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex gap-1 rounded-full bg-white border border-gray-200 px-3 py-1.5 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] text-gray-400">{otherUser?.name} is typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer Input Bar */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 bg-white p-3 sm:p-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={`Message ${otherUser?.name || 'owner'}...`}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <button
          type="submit"
          disabled={!messageText.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
