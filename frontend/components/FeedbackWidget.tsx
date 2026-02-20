'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send } from 'lucide-react';

interface FeedbackWidgetProps {
  sessionId: string;
  questionId?: string;
  feedbackType: 'question_helpful' | 'rating_accurate' | 'suggestion_useful';
  label: string;
}

export default function FeedbackWidget({ sessionId, questionId, feedbackType, label }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = async (value: number) => {
    setRating(value);
    
    // Auto-submit for simple thumbs up/down
    if (value === 5 || value === 1) {
      await submitFeedback(value, '');
    } else {
      setShowComment(true);
    }
  };

  const submitFeedback = async (ratingValue: number, commentValue: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          feedbackType,
          rating: ratingValue,
          comment: commentValue || undefined
        })
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(null);
        setComment('');
        setShowComment(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleSubmitComment = () => {
    if (rating) {
      submitFeedback(rating, comment);
    }
  };

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
        <ThumbsUp size={14} />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      {!showComment ? (
        <>
          <span className="text-xs text-gray-500">{label}</span>
          <button
            onClick={() => handleRating(5)}
            className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
            title="Helpful"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            onClick={() => handleRating(1)}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Not helpful"
          >
            <ThumbsDown size={16} />
          </button>
          <button
            onClick={() => setShowComment(true)}
            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Add comment"
          >
            <MessageSquare size={16} />
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
            placeholder="Add your feedback..."
            className="px-2 py-1 bg-gray-800 border border-gray-700 text-white text-sm rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleSubmitComment}
            disabled={!rating}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
          <button
            onClick={() => {
              setShowComment(false);
              setRating(null);
              setComment('');
            }}
            className="p-1.5 text-gray-500 hover:text-white rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
