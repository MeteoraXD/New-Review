// Local storage utilities for managing user data client-side

// Get favorites from localStorage
export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    return [];
  }
};

// Save favorites to localStorage
export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Error saving favorites:', error);
    return false;
  }
};

// Add a book to favorites
export const addToFavorites = (bookId) => {
  const favorites = getFavorites();
  if (!favorites.includes(bookId)) {
    const newFavorites = [...favorites, bookId];
    return saveFavorites(newFavorites) ? newFavorites : favorites;
  }
  return favorites;
};

// Remove a book from favorites
export const removeFromFavorites = (bookId) => {
  const favorites = getFavorites();
  const newFavorites = favorites.filter(id => id !== bookId);
  return saveFavorites(newFavorites) ? newFavorites : favorites;
};

// Toggle a book's favorite status
export const toggleFavorite = (bookId) => {
  const favorites = getFavorites();
  if (favorites.includes(bookId)) {
    return removeFromFavorites(bookId);
  } else {
    return addToFavorites(bookId);
  }
};

// Check if a book is a favorite
export const isFavorite = (bookId) => {
  const favorites = getFavorites();
  return favorites.includes(bookId);
};

// Get reading history from localStorage
export const getReadingHistory = () => {
  try {
    const history = localStorage.getItem('readingHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving reading history:', error);
    return [];
  }
};

// Save reading history to localStorage
export const saveReadingHistory = (history) => {
  try {
    localStorage.setItem('readingHistory', JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('Error saving reading history:', error);
    return false;
  }
};

// Add a book to reading history
export const addToReadingHistory = (bookId, progress = 0) => {
  const history = getReadingHistory();
  const now = new Date();
  
  // Check if book already exists in history
  const existingIndex = history.findIndex(item => item.id === bookId);
  
  if (existingIndex >= 0) {
    // Update existing entry
    history[existingIndex] = {
      ...history[existingIndex],
      progress,
      date: now
    };
  } else {
    // Add new entry
    history.push({
      id: bookId,
      progress,
      date: now
    });
  }
  
  return saveReadingHistory(history) ? history : getReadingHistory();
}; 