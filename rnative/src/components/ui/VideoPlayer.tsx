/**
 * Video Player Component
 * 
 * Simple YouTube video embed using react-native-webview.
 * Displays videos in a modal with loading indicator.
 * 
 * NOTE: Requires 'react-native-webview' package to be installed:
 * npm install react-native-webview
 * 
 * @module components/ui/VideoPlayer
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { KindlingColors } from '../../styles/theme';
import { Spacing, Typography } from '../../styles/constants';

// Import WebView - will be installed as dependency
// @ts-ignore - WebView may not be installed yet
import { WebView } from 'react-native-webview';

export interface VideoPlayerProps {
  /**
   * YouTube video URL or ID
   */
  videoUrl: string;
  
  /**
   * Video title
   */
  title?: string;
  
  /**
   * Whether the video player is visible
   */
  visible: boolean;
  
  /**
   * Handler for dismissing the video player
   */
  onDismiss: () => void;
}

/**
 * Video Player Component
 * 
 * Displays YouTube videos in a modal using WebView.
 * Includes loading indicator and close button.
 * 
 * @example
 * ```tsx
 * const [showVideo, setShowVideo] = useState(false);
 * 
 * <VideoPlayer
 *   videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   title="Understanding Executors"
 *   visible={showVideo}
 *   onDismiss={() => setShowVideo(false)}
 * />
 * ```
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title = 'Video Player',
  visible,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(true);
  
  // Extract video ID from URL if full URL is provided
  const getEmbedUrl = (url: string): string => {
    // If it's already an embed URL, return as-is
    if (url.includes('/embed/')) return url;
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else {
      // Assume it's just the video ID
      videoId = url;
    }
    
    // Use nocookie domain and add autoplay parameter for better embedding support
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  };
  
  const embedUrl = getEmbedUrl(videoUrl);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <IconButton
            icon="close"
            size={24}
            iconColor={KindlingColors.navy}
            onPress={onDismiss}
          />
        </View>
        
        {/* Video Container */}
        <View style={styles.videoContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={KindlingColors.navy} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KindlingColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: KindlingColors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: KindlingColors.navy,
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: '#fff',
    fontSize: Typography.fontSize.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: KindlingColors.border,
  },
  closeButton: {
    backgroundColor: KindlingColors.navy,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: KindlingColors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});

