'use client';

import { useState, useMemo } from 'react';
import { useInterviewStore } from '@/lib/store';
import { Star, TrendingUp, TrendingDown, Minus, Save, Sparkles } from 'lucide-react';
import { StreamingPanel } from './StreamingPanel';

export function RatingPanel() {
  const { ratingText, isGeneratingRating, addRating } = useInterviewStore();
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Parse AI suggested score from text
  const suggestedScore = useMemo(() => {
    if (!ratingText) return null;
    const match = ratingText.match(/(\d)\s*\/\s*5|score[:\s]+(\d)|rating[:\s]+(\d)|(\d)\s*out\s*of\s*5/i);
    if (match) {
      const score = parseInt(match[1] || match[2] || match[3] || match[4]);
      if (score >= 1 && score <= 5) return score;
    }
    return null;
  }, [ratingText]);

  const handleSaveRating = () => {
    if (selectedRating === 0) return;

    addRating({
      questionId: `q-${Date.now()}`,
      score: selectedRating,
      aiSuggestion: ratingText,
      notes,
      timestamp: Date.now(),
    });

    setSelectedRating(0);
    setNotes('');
  };

  const ratingLabels = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
  const ratingColors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-lime-400', 'text-green-400'];
  const ratingBgColors = ['', 'bg-red-500/20', 'bg-orange-500/20', 'bg-yellow-500/20', 'bg-lime-500/20', 'bg-green-500/20'];

  const displayRating = hoveredRating || selectedRating;

  return (
    <StreamingPanel
      icon={Star}
      title="Rating"
      iconColor="text-yellow-400"
      accentColor="yellow"
      isLoading={isGeneratingRating}
      content={ratingText}
      emptyMessage="AI rating suggestion will appear here"
    >
      <div className="space-y-5">
        {/* AI Suggestion with parsed score highlight */}
        {ratingText && (
          <div className="space-y-3">
            {suggestedScore && (
              <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">AI suggests:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= suggestedScore ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
                <span className={`text-sm font-medium ${ratingColors[suggestedScore]}`}>
                  {ratingLabels[suggestedScore]}
                </span>
              </div>
            )}
            
            <div className="text-sm text-gray-300 leading-relaxed p-3 bg-gray-700/30 rounded-lg border-l-2 border-yellow-500/50">
              {ratingText}
            </div>
          </div>
        )}
        
        {/* Interactive Rating */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Rating</label>
          
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                onMouseEnter={() => setHoveredRating(rating)}
                onMouseLeave={() => setHoveredRating(0)}
                className="group relative p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    rating <= displayRating
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                      : 'text-gray-600 hover:text-gray-500'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Rating Label */}
          <div className="text-center h-8">
            {displayRating > 0 && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${ratingBgColors[displayRating]}`}>
                {displayRating <= 2 && <TrendingDown className={`w-4 h-4 ${ratingColors[displayRating]}`} />}
                {displayRating === 3 && <Minus className={`w-4 h-4 ${ratingColors[displayRating]}`} />}
                {displayRating >= 4 && <TrendingUp className={`w-4 h-4 ${ratingColors[displayRating]}`} />}
                <span className={`text-sm font-medium ${ratingColors[displayRating]}`}>
                  {ratingLabels[displayRating]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 transition-all resize-none"
            placeholder="Add any observations or feedback..."
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveRating}
          disabled={selectedRating === 0}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all shadow-lg shadow-yellow-500/20 disabled:shadow-none"
        >
          <Save className="w-4 h-4" />
          Save Rating
        </button>
      </div>
    </StreamingPanel>
  );
}
