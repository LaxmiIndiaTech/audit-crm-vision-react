import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Filter, CalendarDays, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, ApiError, FeedbackThread, FeedbackReply, FeedbackStats } from '@/lib/api';

export interface ScorePointComment {
  code: string;
  section: string;
  visitorComment?: string;
  immediateAction?: string;
}

// Re-export types for backwards compatibility
export type { FeedbackThread as CommentThread, FeedbackReply as Reply };

interface CommentsSectionProps {
  branchId: string;
  isEmployee: boolean;
  scorePoints?: ScorePointComment[];
  selectedDate?: string; // Current selected date from parent
}

// Generate months for filtering
const generateMonthOptions = () => {
  const year = new Date().getFullYear();
  return [
    { value: 'all', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => {
      const date = new Date(year, i, 1);
      const value = `${year}-${String(i + 1).padStart(2, '0')}`;
      const label = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      return { value, label };
    }),
  ];
};

const monthOptions = generateMonthOptions();

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  branchId,
  isEmployee,
  scorePoints = [],
  selectedDate,
}) => {
  const { toast } = useToast();
  
  // Month filter state - default to current month derived from selectedDate or current date
  const getCurrentMonth = () => {
    if (selectedDate) {
      return selectedDate.substring(0, 7); // "YYYY-MM" from "YYYY-MM-DD"
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [feedbackThreads, setFeedbackThreads] = useState<FeedbackThread[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({ total: 0, with_replies: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch feedback threads from API
  const fetchFeedbackThreads = useCallback(async () => {
    if (!branchId) return;
    
    try {
      setLoading(true);
      const params = selectedMonth !== 'all' ? { month: selectedMonth } : undefined;
      const response = await adminApi.getFeedbackThreads(branchId, params);
      
      setFeedbackThreads(response.data.feedback_threads);
      setStats(response.data.stats);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load feedback threads';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedMonth, toast]);

  // Fetch data when branchId or month changes
  useEffect(() => {
    fetchFeedbackThreads();
  }, [fetchFeedbackThreads]);

  // Handle adding a reply
  const handleAddReply = async (threadId: number) => {
    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const response = await adminApi.addFeedbackReply(threadId, {
        text: replyText.trim()
      });

      // Update local state with new reply
      setFeedbackThreads(threads =>
        threads.map(thread => {
          if (thread.id === threadId) {
            return {
              ...thread,
              replies: [...thread.replies, response.data],
            };
          }
          return thread;
        })
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        with_replies: prev.with_replies + (feedbackThreads.find(t => t.id === threadId)?.replies.length === 0 ? 1 : 0),
        pending: prev.pending - (feedbackThreads.find(t => t.id === threadId)?.replies.length === 0 ? 1 : 0),
      }));

      toast({ title: 'Success', description: 'Reply added successfully' });
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add reply';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const getAuthorBadgeColor = (authorType: string) => {
    switch (authorType) {
      case 'admin':
        return 'bg-blue-100 text-blue-700';
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'branch':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAuthorLabel = (authorType: string) => {
    switch (authorType) {
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super Admin';
      case 'branch':
        return 'Branch';
      default:
        return authorType;
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="crm-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Comments & Feedback Thread</CardTitle>
              <CardDescription>
                {isEmployee
                  ? 'Respond to admin comments and provide updates on action items'
                  : 'View and discuss comments on score points with the branch team'}
              </CardDescription>
            </div>
          </div>
          
          {/* Month Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Threads</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{feedbackThreads.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth === 'all' ? 'All Time' : 'This Month'}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.with_replies}</div>
            <p className="text-xs text-muted-foreground">With Replies</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending Response</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading feedback threads...</p>
          </div>
        ) : feedbackThreads.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No comments found for the selected month</p>
            <p className="text-sm mt-1">
              {selectedMonth === 'all' 
                ? 'Comments will appear here once added to score points.'
                : 'Try selecting "All Months" to see all comments.'}
            </p>
            {selectedMonth !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setSelectedMonth('all')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Show All Months
              </Button>
            )}
          </div>
        ) : (
          feedbackThreads.map((thread, threadIndex) => (
            <div key={thread.id} className="space-y-4">
              {/* Score Point Header */}
              <div className="flex items-center justify-between gap-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {thread.score_point_code}
                  </Badge>
                  <span className="font-medium text-sm">{thread.section}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {thread.inspection_month}
                </span>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                {/* Visitor Comment */}
                {thread.visitor_comment && (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
                        <span className="text-xs text-muted-foreground">Visitor Comment</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground mb-3">
                        {thread.visitor_comment}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setReplyingTo(replyingTo === `${thread.id}-visitor` ? null : `${thread.id}-visitor`)}
                      >
                        {replyingTo === `${thread.id}-visitor` ? 'Cancel' : 'Reply'}
                      </Button>
                    </div>

                    {/* Reply Input for Visitor Comment */}
                    {replyingTo === `${thread.id}-visitor` && (
                      <div className="space-y-2 p-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded">
                        <Textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={isEmployee ? 'Provide your response...' : 'Add feedback...'}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            disabled={submittingReply}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddReply(thread.id)}
                            disabled={!replyText.trim() || submittingReply}
                            className="gap-1"
                          >
                            {submittingReply ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Send
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Separator between comments */}
                {thread.visitor_comment && thread.immediate_action && (
                  <Separator className="my-2" />
                )}

                {/* Immediate Action */}
                {thread.immediate_action && (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700">Admin</Badge>
                        <span className="text-xs text-muted-foreground">Immediate Action</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground mb-3">
                        {thread.immediate_action}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setReplyingTo(replyingTo === `${thread.id}-action` ? null : `${thread.id}-action`)}
                      >
                        {replyingTo === `${thread.id}-action` ? 'Cancel' : 'Reply'}
                      </Button>
                    </div>

                    {/* Reply Input for Immediate Action */}
                    {replyingTo === `${thread.id}-action` && (
                      <div className="space-y-2 p-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded">
                        <Textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder={isEmployee ? 'Provide your response...' : 'Add feedback...'}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            disabled={submittingReply}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddReply(thread.id)}
                            disabled={!replyText.trim() || submittingReply}
                            className="gap-1"
                          >
                            {submittingReply ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Send
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* All Replies */}
                {thread.replies.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Replies ({thread.replies.length})
                    </p>
                    {thread.replies.map(reply => (
                      <div key={reply.id} className="border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getAuthorBadgeColor(reply.author_type)}`}
                            >
                              {getAuthorLabel(reply.author_type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{reply.author_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider between score points */}
              {threadIndex < feedbackThreads.length - 1 && <Separator className="mt-6" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
