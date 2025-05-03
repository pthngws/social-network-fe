import React from 'react';

const StoryProgressBar = ({ stories, currentStoryIndex, progress }) => {
  return (
    <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-30">
      {stories.map((story, index) => (
        <div 
          key={story.id}
          className="h-1 flex-1 bg-gray-700/50 overflow-hidden rounded-full"
        >
          <div
            className={`h-full bg-white transition-all duration-100 ease-linear rounded-full ${
              index < currentStoryIndex ? 'w-full' : 
              index === currentStoryIndex ? `w-[${progress}%]` : 
              'w-0'
            }`}
            style={{
              width: index < currentStoryIndex ? '100%' : 
                     index === currentStoryIndex ? `${progress}%` : 
                     '0%',
              transition: index === currentStoryIndex ? 'width 0.1s linear' : 'none'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default StoryProgressBar; 