import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
  OnBufferData,
  VideoRef,
} from 'react-native-video';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import {useProfileStore, useWatchHistoryStore, useFavoritesStore} from '@/store';
import type {RootStackParamList} from '@/navigation/AppNavigator';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type PlayerRoute = RouteProp<RootStackParamList, 'Player'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const OVERLAY_TIMEOUT = 4000;
const MAX_RETRIES = 3;
const SEEK_STEP = 10;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* ------------------------------------------------------------------ */
/*  PlayerScreen                                                      */
/* ------------------------------------------------------------------ */

const PlayerScreen: React.FC = () => {
  const {params} = useRoute<PlayerRoute>();
  const navigation = useNavigation<Nav>();
  const profile = useProfileStore(s => s.getActiveProfile());
  const upsertEntry = useWatchHistoryStore(s => s.upsertEntry);
  const getEntry = useWatchHistoryStore(s => s.getEntry);

  const {streamUrl, title, type, episodeInfo, contentId} = params;
  const isLive = type === 'live';
  const {accentColor, dimColor, textOnAccent} = useTheme();

  const videoRef = useRef<VideoRef>(null);

  // Favorites
  const favId = contentId ?? streamUrl;
  const isFav = useFavoritesStore(s =>
    profile ? s.isFavorite(profile.id, favId) : false,
  );
  const addFav = useFavoritesStore(s => s.addFavorite);
  const removeFav = useFavoritesStore(s => s.removeFavorite);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2000);
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!profile) return;
    if (isFav) {
      removeFav(profile.id, favId);
      showToast('Removed from Favorites');
    } else {
      addFav(profile.id, {
        id: favId,
        title,
        type: isLive ? 'channel' : type,
        addedAt: Date.now(),
      });
      showToast('Added to Favorites');
    }
  }, [profile, isFav, favId, title, type, isLive, addFav, removeFav, showToast]);

  // Playback state
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Overlay state
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume position
  const resumePos = useRef(0);
  useEffect(() => {
    if (!isLive && profile && contentId) {
      const entry = getEntry(profile.id, contentId);
      if (entry && entry.progressSeconds > 0) {
        resumePos.current = entry.progressSeconds;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Overlay auto-hide                                               */
  /* ---------------------------------------------------------------- */

  const resetOverlayTimer = useCallback(() => {
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    overlayTimer.current = setTimeout(() => setOverlayVisible(false), OVERLAY_TIMEOUT);
  }, []);

  const toggleOverlay = useCallback(() => {
    setOverlayVisible(prev => {
      const next = !prev;
      if (next) resetOverlayTimer();
      return next;
    });
  }, [resetOverlayTimer]);

  // Start timer on mount
  useEffect(() => {
    resetOverlayTimer();
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    };
  }, [resetOverlayTimer]);

  /* ---------------------------------------------------------------- */
  /*  Video callbacks                                                 */
  /* ---------------------------------------------------------------- */

  const onLoad = useCallback(
    (data: OnLoadData) => {
      console.log(`[Luma Player] Stream loaded: ${streamUrl}`);
      setDuration(data.duration);
      setBuffering(false);
      setError(null);
      setRetryCount(0);

      // Seek to saved position for VOD
      if (resumePos.current > 0 && !isLive) {
        videoRef.current?.seek(resumePos.current);
      }
    },
    [streamUrl, isLive],
  );

  const onProgress = useCallback(
    (data: OnProgressData) => {
      setCurrentTime(data.currentTime);

      // Persist watch position every 5 seconds (VOD only)
      if (!isLive && profile && contentId && Math.floor(data.currentTime) % 5 === 0) {
        upsertEntry(profile.id, {
          id: contentId,
          title,
          type,
          progressSeconds: data.currentTime,
          durationSeconds: duration,
          lastWatchedAt: Date.now(),
        });
      }
    },
    [isLive, profile, contentId, title, type, duration, upsertEntry],
  );

  const onBuffer = useCallback((data: OnBufferData) => {
    setBuffering(data.isBuffering);
  }, []);

  const onError = useCallback(
    (e: any) => {
      console.warn('[Luma Player] Stream error:', e);
      if (retryCount < MAX_RETRIES - 1) {
        setRetryCount(prev => prev + 1);
        // Force re-mount by toggling a key — handled via retryCount in source
      } else {
        setError('Stream failed after multiple attempts.');
      }
    },
    [retryCount],
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setBuffering(true);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  D-pad controls                                                  */
  /* ---------------------------------------------------------------- */

  const seekForward = useCallback(() => {
    if (isLive) return;
    const target = Math.min(currentTime + SEEK_STEP, duration);
    videoRef.current?.seek(target);
    setCurrentTime(target);
  }, [isLive, currentTime, duration]);

  const seekBackward = useCallback(() => {
    if (isLive) return;
    const target = Math.max(currentTime - SEEK_STEP, 0);
    videoRef.current?.seek(target);
    setCurrentTime(target);
  }, [isLive, currentTime]);

  const handleBack = useCallback(() => {
    // Save final position before leaving
    if (!isLive && profile && contentId) {
      upsertEntry(profile.id, {
        id: contentId,
        title,
        type,
        progressSeconds: currentTime,
        durationSeconds: duration,
        lastWatchedAt: Date.now(),
      });
    }

    Alert.alert('Exit Player', 'Are you sure you want to exit?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Exit', style: 'destructive', onPress: () => navigation.goBack()},
    ]);
  }, [isLive, profile, contentId, title, type, currentTime, duration, upsertEntry, navigation]);

  /* ---------------------------------------------------------------- */
  /*  Progress bar fraction                                           */
  /* ---------------------------------------------------------------- */

  const progress = duration > 0 ? currentTime / duration : 0;

  /* ---------------------------------------------------------------- */
  /*  Error state                                                     */
  /* ---------------------------------------------------------------- */

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>⚠</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={({focused}) => [styles.retryBtn, {backgroundColor: accentColor}, focused && styles.retryBtnFocused]}
          onPress={handleRetry}
          hasTVPreferredFocus>
          <Text style={styles.retryLabel}>Try Again</Text>
        </Pressable>
        <Pressable
          style={({focused}) => [styles.retryBtn, styles.retryBtnSecondary, focused && styles.retryBtnFocused]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <View style={styles.root}>
      {/* Video */}
      <Video
        ref={videoRef}
        source={{uri: streamUrl}}
        key={`stream-${retryCount}`}
        style={styles.video}
        resizeMode="contain"
        paused={paused}
        onLoad={onLoad}
        onProgress={onProgress}
        onBuffer={onBuffer}
        onError={onError}
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 30000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
      />

      {/* Buffer spinner */}
      {buffering && (
        <View style={styles.bufferOverlay}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      )}

      {/* Tap area to toggle overlay — long press toggles favorite */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={toggleOverlay}
        hasTVPreferredFocus
        onLongPress={toggleFavorite}
      />

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, {borderColor: accentColor}]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Control overlay */}
      {overlayVisible && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Text style={[styles.wordmark, {color: accentColor}]}>LUMA</Text>
            <View style={styles.topCenter}>
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
                {episodeInfo ? ` — ${episodeInfo}` : ''}
              </Text>
            </View>
            <View style={styles.topRight}>
              {isLive && (
                <View style={[styles.liveBadge, {backgroundColor: accentColor}]}>
                  <Text style={[styles.liveText, {color: textOnAccent}]}>LIVE</Text>
                </View>
              )}
              <Text style={styles.timeText}>
                {isLive ? '' : formatTime(currentTime)}
              </Text>
            </View>
          </View>

          {/* CENTER CONTROLS */}
          <View style={styles.centerControls}>
            {!isLive && (
              <Pressable
                onPress={seekBackward}
                style={({focused}) => [styles.controlBtn, focused && [styles.controlBtnFocused, {borderColor: accentColor, backgroundColor: dimColor}]]}>
                <Text style={styles.controlIcon}>⏪</Text>
                <Text style={styles.controlLabel}>-10s</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setPaused(p => !p);
                resetOverlayTimer();
              }}
              style={({focused}) => [styles.controlBtn, styles.playPauseBtn, focused && [styles.controlBtnFocused, {borderColor: accentColor, backgroundColor: dimColor}]]}>
              <Text style={styles.playPauseIcon}>{paused ? '▶' : '⏸'}</Text>
            </Pressable>

            {!isLive && (
              <Pressable
                onPress={seekForward}
                style={({focused}) => [styles.controlBtn, focused && [styles.controlBtnFocused, {borderColor: accentColor, backgroundColor: dimColor}]]}>
                <Text style={styles.controlIcon}>⏩</Text>
                <Text style={styles.controlLabel}>+10s</Text>
              </Pressable>
            )}
          </View>

          {/* BOTTOM BAR */}
          <View style={styles.bottomBar}>
            {/* Progress bar — VOD only */}
            {!isLive && (
              <View style={styles.progressRow}>
                <Text style={styles.progressTime}>{formatTime(currentTime)}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {width: `${progress * 100}%`, backgroundColor: accentColor}]} />
                </View>
                <Text style={styles.progressTime}>{formatTime(duration)}</Text>
              </View>
            )}

            {/* Channel up/down — Live only */}
            {isLive && (
              <View style={styles.channelNav}>
                <Pressable
                  style={({focused}) => [styles.channelBtn, focused && [styles.channelBtnFocused, {borderColor: accentColor, backgroundColor: dimColor}]]}
                  onPress={() => {
                    // TODO: channel up — caller should provide channel list or callbacks
                  }}>
                  <Text style={styles.channelArrow}>▲</Text>
                  <Text style={styles.channelLabel}>CH+</Text>
                </Pressable>
                <Pressable
                  style={({focused}) => [styles.channelBtn, focused && [styles.channelBtnFocused, {borderColor: accentColor, backgroundColor: dimColor}]]}
                  onPress={() => {
                    // TODO: channel down
                  }}>
                  <Text style={styles.channelArrow}>▼</Text>
                  <Text style={styles.channelLabel}>CH-</Text>
                </Pressable>
              </View>
            )}

            {/* Back button */}
            <Pressable
              onPress={handleBack}
              style={({focused}) => [styles.backBtn, focused && [styles.backBtnFocused, {borderColor: accentColor}]]}>
              <Text style={styles.backLabel}>← Back</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    marginRight: theme.spacing.lg,
  },
  topCenter: {
    flex: 1,
  },
  titleText: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  liveBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  timeText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },

  /* Center controls */
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxl,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.round,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  controlBtnFocused: {
    borderWidth: 3,
    transform: [{scale: 1.1}],
  },
  controlIcon: {
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  controlLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  playPauseIcon: {
    fontSize: 36,
    color: theme.colors.textPrimary,
  },

  /* Bottom bar */
  bottomBar: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },

  /* Progress bar */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    width: 60,
    textAlign: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Channel nav */
  channelNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  channelBtn: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  channelBtnFocused: {
    borderWidth: 2,
  },
  channelArrow: {
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  channelLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },

  /* Back button */
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  backBtnFocused: {
    borderWidth: 2,
  },
  backLabel: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },

  /* Error state */
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  retryBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
  },
  retryBtnSecondary: {
    backgroundColor: theme.colors.surfaceLight,
  },
  retryBtnFocused: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
    transform: [{scale: 1.05}],
  },
  retryLabel: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },

  /* Toast */
  toast: {
    position: 'absolute',
    top: theme.spacing.xxl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.80)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.round,
    borderWidth: 1,
    zIndex: 100,
  },
  toastText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});

export default PlayerScreen;
