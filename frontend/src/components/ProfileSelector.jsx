import React, { useState, useEffect, useRef } from 'react';
import { getRedditClient } from '../services/redditClient.js';

function ProfileSelector({ onProfileChange, onConfigChange, redditClientReady }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const dropdownRef = useRef(null);

  // Load profiles on component mount
  useEffect(() => {
    if (redditClientReady) {
      loadProfiles();
    }
  }, [redditClientReady]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadProfiles = () => {
    if (!redditClientReady) return;
    
    try {
      const redditClient = getRedditClient();
      const allProfiles = redditClient.getProfiles();
      const current = redditClient.getCurrentProfile();
      setProfiles(allProfiles);
      setCurrentProfile(current);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleProfileSwitch = async (profileId) => {
    if (!redditClientReady) return;
    
    try {
      const redditClient = getRedditClient();
      const result = redditClient.loadProfile(profileId);
      if (result) {
        setCurrentProfile(result.profile);
        setIsDropdownOpen(false);
        
        // Notify parent components of the profile change
        onProfileChange?.(result.profile, result.uiPreferences);
        onConfigChange?.();
        
        console.log(`Switched to profile: ${result.profile.name}`);
      }
    } catch (error) {
      console.error('Error switching profile:', error);
      alert('Error switching profile. Please try again.');
    }
  };

  const handleCreateProfile = () => {
    if (!redditClientReady || !newProfileName.trim()) {
      alert('Please enter a profile name.');
      return;
    }

    try {
      const redditClient = getRedditClient();
      const profileId = redditClient.createProfile(newProfileName.trim(), newProfileDescription.trim());
      
      // Reset form
      setNewProfileName('');
      setNewProfileDescription('');
      setShowCreateForm(false);
      
      // Reload profiles and switch to the new one
      loadProfiles();
      handleProfileSwitch(profileId);
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Error creating profile. Please try again.');
    }
  };

  const handleUpdateCurrentProfile = () => {
    if (!redditClientReady || !currentProfile) return;
    
    try {
      const redditClient = getRedditClient();
      redditClient.updateProfile(currentProfile.id);
      loadProfiles();
      console.log(`Updated profile: ${currentProfile.name}`);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteProfile = (profileId, profileName) => {
    if (!redditClientReady) return;
    
    if (profileId === 'default_profile') {
      alert('Cannot delete the default profile.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        const redditClient = getRedditClient();
        const success = redditClient.deleteProfile(profileId);
        if (success) {
          loadProfiles();
          console.log(`Deleted profile: ${profileName}`);
        }
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Error deleting profile. Please try again.');
      }
    }
  };

  const handleDuplicateProfile = (profileId, profileName) => {
    if (!redditClientReady) return;
    
    const newName = prompt(`Enter a name for the duplicate of "${profileName}":`, `${profileName} Copy`);
    if (newName && newName.trim()) {
      try {
        const redditClient = getRedditClient();
        const duplicateId = redditClient.duplicateProfile(profileId, newName.trim());
        if (duplicateId) {
          loadProfiles();
          console.log(`Duplicated profile: ${profileName} -> ${newName}`);
        }
      } catch (error) {
        console.error('Error duplicating profile:', error);
        alert('Error duplicating profile. Please try again.');
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  // Don't render if Reddit client isn't ready
  if (!redditClientReady) {
    return null;
  }

  return (
    <div className="profile-selector" ref={dropdownRef}>
      <button
        className="profile-selector-button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        title="Switch configuration profile"
      >
        <span className="profile-icon">👤</span>
        <span className="profile-name">
          {currentProfile ? currentProfile.name : 'No Profile'}
        </span>
        <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
      </button>

      {isDropdownOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <h3>Configuration Profiles</h3>
            <button
              className="update-profile-btn"
              onClick={handleUpdateCurrentProfile}
              title="Save current configuration to this profile"
              disabled={!currentProfile}
            >
              💾 Save Current
            </button>
          </div>

          <div className="profile-list">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`profile-item ${currentProfile?.id === profile.id ? 'active' : ''}`}
              >
                <div className="profile-main" onClick={() => handleProfileSwitch(profile.id)}>
                  <div className="profile-info">
                    <div className="profile-title">
                      <span className="profile-name-text">{profile.name}</span>
                      {currentProfile?.id === profile.id && (
                        <span className="current-badge">Current</span>
                      )}
                    </div>
                    <div className="profile-meta">
                      <span className="profile-description">{profile.description}</span>
                      <span className="profile-stats">
                        {profile.configuration.subredditConfigs.length} subreddits • 
                        Last used {formatTimeAgo(profile.lastUsed)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <button
                    className="profile-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateProfile(profile.id, profile.name);
                    }}
                    title="Duplicate profile"
                  >
                    📋
                  </button>
                  {profile.id !== 'default_profile' && (
                    <button
                      className="profile-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id, profile.name);
                      }}
                      title="Delete profile"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="profile-dropdown-footer">
            {!showCreateForm ? (
              <button
                className="create-profile-btn"
                onClick={() => setShowCreateForm(true)}
              >
                ➕ Create New Profile
              </button>
            ) : (
              <div className="create-profile-form">
                <input
                  type="text"
                  placeholder="Profile name"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="profile-name-input"
                  maxLength={50}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  className="profile-description-input"
                  maxLength={100}
                />
                <div className="create-form-actions">
                  <button
                    className="create-confirm-btn"
                    onClick={handleCreateProfile}
                    disabled={!newProfileName.trim()}
                  >
                    Create
                  </button>
                  <button
                    className="create-cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewProfileName('');
                      setNewProfileDescription('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSelector;
