import React from 'react';
import { Mail, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface EmailCardProps {
  email: {
    id: string;
    subject: string;
    content: string;
    sender: string;
    stake: number;
    status: 'pending' | 'valuable' | 'spam';
    timestamp: number;
    engagement?: number;
    earned?: number;
  };
  onClick: () => void;
}

const EmailCard: React.FC<EmailCardProps> = ({ email, onClick }) => {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return new Date(timestamp).toLocaleDateString();
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getStatusBadge = () => {
    if (email.status === 'valuable') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-900 text-green-300">
          <CheckCircle2 className="w-3 h-3" /> +{email.earned} ATT
        </span>
      );
    } else if (email.status === 'spam') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-900 text-red-300">
          <XCircle className="w-3 h-3" /> {email.earned} ATT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-900 text-yellow-300">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className="group border border-gray-800 hover:border-purple-600/50 bg-gray-900/50 hover:bg-gray-900 p-5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-bold text-purple-400 text-sm">{email.sender}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-300 truncate">{email.subject}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2 flex-wrap">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {email.stake} ATT staked
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {email.engagement}% engaged
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(email.timestamp)}
            </span>
          </div>
          <div className="text-sm text-gray-400 line-clamp-2 mt-2">
            {email.content}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default EmailCard;
