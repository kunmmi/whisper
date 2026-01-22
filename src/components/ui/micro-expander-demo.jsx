/**
 * MicroExpander Demo Component
 * Shows example usage of the MicroExpander component
 */

import { MicroExpander } from './micro-expander';
import { Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';

export default function MicroExpanderToolbar() {
  return (
    <div className="w-full min-h-[200px] flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
        <MicroExpander 
          text="Like" 
          variant="ghost" 
          icon={<Heart className="w-5 h-5" />} 
          className="hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
        />
        <MicroExpander 
          text="Reply" 
          variant="ghost" 
          icon={<MessageCircle className="w-5 h-5" />} 
          className="hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        />
        <MicroExpander 
          text="Repost" 
          variant="ghost" 
          icon={<Repeat2 className="w-5 h-5" />} 
          className="hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
        />
        <MicroExpander 
          text="Share" 
          variant="ghost" 
          icon={<Share2 className="w-5 h-5" />} 
          className="hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
        />
      </div>
    </div>
  );
}

