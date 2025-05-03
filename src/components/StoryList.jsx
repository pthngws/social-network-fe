import React, { useState, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storyService } from '../services/storyService';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import { PlusIcon } from '@heroicons/react/24/solid';
import Card from './ui/Card';

const StoryList = () => {
  const [stories, setStories] = useState([]);
  const [sortedStories, setSortedStories] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = localStorage.getItem('userId');

  const checkStoriesViewed = (userStories) => {
    // Kiểm tra nếu tất cả stories của user đó đã được xem
    return userStories.every(story => {
      const viewedStories = JSON.parse(localStorage.getItem('viewedStories') || '[]');
      return viewedStories.includes(story.id);
    });
  };

  const loadStories = async () => {
    try {
      setIsLoading(true);
      const response = await storyService.getAllStories();
      if (response.data.status === 200) {
        setStories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  useEffect(() => {
    if (!stories?.length) return;

    // Group stories by user
    const storyGroups = stories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      acc[story.userId].push(story);
      return acc;
    }, {});

    // Convert to array and mark current user's group
    const groupedArray = Object.entries(storyGroups).map(([userId, userStories]) => ({
      userId,
      isCurrentUser: userId === currentUserId,
      stories: userStories,
      user: userStories[0], // Get user info from first story
      allStoriesViewed: checkStoriesViewed(userStories)
    }));

    // Sort groups:
    // 1. Current user first
    // 2. Unviewed stories
    // 3. Fully viewed stories
    // Within each category, sort by latest story
    groupedArray.sort((a, b) => {
      // Current user's stories always first
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;

      // Then sort by viewed status
      if (a.allStoriesViewed && !b.allStoriesViewed) return 1;
      if (!a.allStoriesViewed && b.allStoriesViewed) return -1;

      // Within same view status, sort by latest story
      return new Date(b.stories[0].postedAt) - new Date(a.stories[0].postedAt);
    });

    setSortedStories(groupedArray);
  }, [stories, currentUserId]);

  const formatTimeAgo = (date) => {
    return formatDistanceToNowStrict(new Date(date), { 
      addSuffix: true, 
      locale: vi 
    })
    .replace('khoảng ', '');
  };

  const handleStoryClick = (clickedStoryId) => {
    // Tìm group chứa story được click
    const groupIndex = sortedStories.findIndex(group => 
      group.stories.some(story => story.id === clickedStoryId)
    );

    if (groupIndex !== -1) {
      // Tạo mảng stories mới, giữ nguyên thứ tự từ group được click
      const allStoriesInOrder = sortedStories.flatMap(group => group.stories);
      const storyIndex = allStoriesInOrder.findIndex(story => story.id === clickedStoryId);
      
      setStories(allStoriesInOrder);
      setSelectedIndex(storyIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < stories.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setSelectedIndex(null);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleCreateStory = async (formData) => {
    try {
      setIsLoading(true);
      const response = await storyService.createStory(formData);
      if (response.data.status === 201) {
        await loadStories();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await storyService.deleteStory(storyId);
      await loadStories(); // Reload stories after deletion
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  if (isLoading && !stories.length) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card className="mb-4 p-4">
      <div className="flex gap-2 overflow-x-auto custom-scroll">
        {/* Create Story Button - Always First */}
        <div className="flex-shrink-0 w-32">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Tạo story</span>
          </button>
        </div>

        {/* Story Groups */}
        {sortedStories.map(({ userId, stories: userStories, user, isCurrentUser }) => {
          const allStoriesViewed = checkStoriesViewed(userStories);
          
          return (
            <div key={userId} className="flex-shrink-0 w-32">
              <button
                onClick={() => handleStoryClick(userStories[0].id)}
                className="w-full h-48 relative rounded-lg overflow-hidden group transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                {/* Story Preview Image */}
                {userStories[0].content.toLowerCase().includes('.mp4') ? (
                  <video
                    src={userStories[0].content}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                    muted
                  />
                ) : (
                  <img
                    src={userStories[0].content}
                    alt="Story preview"
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                
                {/* Multiple Stories Indicator */}
                {userStories.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full transform transition-all duration-300 group-hover:scale-110">
                    {userStories.length}
                  </div>
                )}

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent transform transition-all duration-300">
                  <div className="flex flex-col items-center">
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className={`w-8 h-8 rounded-full border-2 ${
                        allStoriesViewed ? 'border-gray-400' : 'border-blue-500'
                      } transform transition-transform duration-300 group-hover:scale-110`}
                    />
                    <p className="text-white text-xs mt-1 font-medium truncate w-full text-center">
                      {isCurrentUser ? 'Story của bạn' : user.fullName}
                    </p>
                    <p className="text-gray-300 text-xs">
                      {formatTimeAgo(userStories[0].postedAt)}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Story Viewer */}
      {selectedIndex !== null && (
        <StoryViewer
          stories={stories}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onDelete={handleDeleteStory}
        />
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateStory}
      />
    </Card>
  );
};

export default StoryList; 