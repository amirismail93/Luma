import React, {useState, useCallback} from 'react';
import {Pressable, View, Text, Image, StyleSheet, ViewStyle} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';

export interface ContentCardProps {
  id: string;
  title: string;
  posterUrl?: string;
  channelNumber?: string | number;
  /** 0–1 progress fraction (VOD continue watching) */
  progress?: number;
  variant?: 'landscape' | 'poster';
  onPress?: () => void;
  onLongPress?: () => void;
  hasTVPreferredFocus?: boolean;
  style?: ViewStyle;
}

const LANDSCAPE_W = 220;
const LANDSCAPE_H = 130;
const POSTER_W = 140;
const POSTER_H = 200;

const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  posterUrl,
  channelNumber,
  progress,
  variant = 'landscape',
  onPress,
  onLongPress,
  hasTVPreferredFocus = false,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();
  const isLandscape = variant === 'landscape';
  const w = isLandscape ? LANDSCAPE_W : POSTER_W;
  const h = isLandscape ? LANDSCAPE_H : POSTER_H;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={[styles.card, {width: w}, focused && [styles.cardFocused, {borderColor: accentColor}], style]}>
      <View style={[styles.thumb, {width: w, height: h}]}>
        {posterUrl ? (
          <Image
            source={{uri: posterUrl}}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {title?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        {channelNumber != null && (
          <View style={styles.channelBadge}>
            <Text style={[styles.channelNum, {color: accentColor}]}>{channelNumber}</Text>
          </View>
        )}

        {progress != null && progress > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${Math.min(progress, 1) * 100}%`, backgroundColor: accentColor}]} />
          </View>
        )}
      </View>

      {/* Title shown when focused */}
      {focused && (
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  cardFocused: {
    borderWidth: 3,
    borderColor: theme.colors.border,
    transform: [{scale: 1.08}],
    zIndex: 10,
  },
  thumb: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textDisabled,
  },
  channelBadge: {
    position: 'absolute',
    top: theme.spacing.xxs,
    left: theme.spacing.xxs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  channelNum: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  title: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xxs,
    paddingHorizontal: 2,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    height: '100%',
  },
});

export default ContentCard;
