/**
 * Utility functions for Vietnamese text search without diacritics
 */

/**
 * Remove Vietnamese diacritics from text
 * @param {string} str - Input string with Vietnamese diacritics
 * @returns {string} String without diacritics
 */
export const removeVietnameseTones = (str) => {
  if (!str) return '';
  
  str = str.toLowerCase();
  
  // Remove diacritics
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  
  // Remove extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  
  return str;
};

/**
 * Check if search term matches text (Vietnamese-friendly search)
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Search term
 * @returns {boolean} True if match found
 */
export const vietnameseSearch = (text, searchTerm) => {
  if (!text || !searchTerm) return true;
  
  const normalizedText = removeVietnameseTones(String(text));
  const normalizedSearch = removeVietnameseTones(String(searchTerm));
  
  return normalizedText.includes(normalizedSearch);
};

/**
 * Filter array of objects by search term across multiple fields
 * @param {Array} data - Array of objects to filter
 * @param {string} searchTerm - Search term
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Array} Filtered array
 */
export const filterByVietnameseSearch = (data, searchTerm, searchFields = []) => {
  if (!searchTerm || searchTerm.trim() === '') return data;
  
  return data.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      return vietnameseSearch(value, searchTerm);
    });
  });
};

/**
 * Highlight search term in text (for display purposes)
 * @param {string} text - Text to highlight in
 * @param {string} searchTerm - Term to highlight
 * @returns {string} Text with highlighted term
 */
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const normalizedText = removeVietnameseTones(String(text));
  const normalizedSearch = removeVietnameseTones(String(searchTerm));
  
  if (!normalizedText.includes(normalizedSearch)) return text;
  
  // Find the actual position in original text
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
