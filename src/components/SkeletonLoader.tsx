import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, ViewStyle} from 'react-native';
import theme from '@/theme';

interface SkeletonLoaderProps {
  width: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadius = theme.radii.md,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {width, height, borderRadius, opacity},
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surfaceLight,
  },
});

export default SkeletonLoader;
