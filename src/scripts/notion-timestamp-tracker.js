/**
 * Utility functions for tracking Notion item sync timestamps
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the timestamp storage file
const TIMESTAMP_FILE = path.join(__dirname, '..', 'data', 'notion-sync-timestamps.json');

/**
 * Load the stored timestamps from the file
 * @returns {Object} Object containing timestamps for each item
 */
export function loadTimestamps() {
  try {
    if (fs.existsSync(TIMESTAMP_FILE)) {
      const data = fs.readFileSync(TIMESTAMP_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Error loading timestamps file:', error.message);
  }
  
  // Return empty object if file doesn't exist or there's an error
  return {};
}

/**
 * Save timestamps to the file
 * @param {Object} timestamps Object containing timestamps for each item
 */
export function saveTimestamps(timestamps) {
  try {
    const dirPath = path.dirname(TIMESTAMP_FILE);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify(timestamps, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving timestamps file:', error.message);
  }
}

/**
 * Check if an item needs to be synced based on its lastUpdated property
 * @param {string} type The type of item (e.g., 'services', 'projects')
 * @param {string} id The unique ID of the item
 * @param {string} lastUpdated The lastUpdated timestamp from Notion
 * @param {boolean} forceSync Force sync regardless of timestamp
 * @returns {boolean} True if the item needs to be synced, false otherwise
 */
export function needsSync(type, id, lastUpdated, forceSync = false) {
  if (forceSync || !lastUpdated) {
    return true; // If forceSync is true or no lastUpdated provided, always sync
  }
  
  const timestamps = loadTimestamps();
  
  // Check if we have any items of this type synced
  const hasAnyItemsOfType = Object.keys(timestamps).some(key => key.startsWith(`${type}:`));
  if (!hasAnyItemsOfType) {
    return true; // If no items of this type exist, always sync
  }
  
  // Check if we have any timestamps at all - if not, this is first run
  if (Object.keys(timestamps).length === 0) {
    return true; // First run, always sync
  }
  
  const key = `${type}:${id}`;
  
  // If no timestamp stored or the stored timestamp is older, sync is needed
  if (!timestamps[key] || timestamps[key] < lastUpdated) {
    return true;
  }
  
  return false;
}

/**
 * Update the timestamp for an item after successful sync
 * @param {string} type The type of item (e.g., 'services', 'projects')
 * @param {string} id The unique ID of the item
 * @param {string} lastUpdated The lastUpdated timestamp from Notion
 */
export function updateTimestamp(type, id, lastUpdated) {
  if (!lastUpdated) {
    return; // Don't update if no timestamp provided
  }
  
  const timestamps = loadTimestamps();
  const key = `${type}:${id}`;
  
  timestamps[key] = lastUpdated;
  saveTimestamps(timestamps);
}

/**
 * Update the timestamp for a collection after successful sync
 * @param {string} type The type of collection (e.g., 'services', 'projects')
 * @param {string} lastSyncTime The current timestamp
 */
export function updateCollectionTimestamp(type, lastSyncTime = new Date().toISOString()) {
  const timestamps = loadTimestamps();
  const key = `collection:${type}`;
  
  timestamps[key] = lastSyncTime;
  saveTimestamps(timestamps);
}

/**
 * Get the last sync time for a collection
 * @param {string} type The type of collection (e.g., 'services', 'projects')
 * @returns {string|null} The last sync timestamp or null if never synced
 */
export function getCollectionLastSync(type) {
  const timestamps = loadTimestamps();
  const key = `collection:${type}`;
  
  return timestamps[key] || null;
}
