import React, {useState} from 'react';
import {View, Text, Image, StyleSheet, Pressable, Dimensions} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

const {width: SCREEN_W} = Dimensions.get('window');
const BANNER_H = 320;

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPlay?: () => void;
  loading?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  imageUrl,
  onPlay,
  loading = false,
}) => {
  const [playFocused, setPlayFocused] = useState(false);
  const {accentColor, textOnAccent} = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width={SCREEN_W} height={BANNER_H} borderRadius={0} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image
          source={{uri: imageUrl}}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.gradientFallback} />
      )}

      {/* Gradient overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {onPlay && (
          <Pressable
            onPress={onPlay}
            onFocus={() => setPlayFocused(true)}
            onBlur={() => setPlayFocused(false)}
            hasTVPreferredFocus
            style={[styles.playBtn, {backgroundColor: accentColor}, playFocused && styles.playBtnFocused]}>
            <Text style={[styles.playLabel, {color: textOnAccent}]}>Play</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: BANNER_H,
    marginBottom: theme.spacing.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  content: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.xxl,
    right: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  playBtn: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
    alignSelf: 'flex-start',
  },
  playBtnFocused: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
    transform: [{scale: 1.05}],
  },
  playLabel: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});

export default HeroBanner;
