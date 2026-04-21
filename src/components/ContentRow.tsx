import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import theme from '@/theme';
import ContentCard, {ContentCardProps} from './ContentCard';
import SkeletonLoader from './SkeletonLoader';

interface ContentRowProps {
  title: string;
  items: Omit<ContentCardProps, 'onPress'>[];
  variant?: 'landscape' | 'poster';
  loading?: boolean;
  onPressItem?: (item: Omit<ContentCardProps, 'onPress'>) => void;
}

const SKELETON_COUNT = 6;

const ContentRow: React.FC<ContentRowProps> = ({
  title,
  items,
  variant = 'landscape',
  loading = false,
  onPressItem,
}) => {
  if (loading) {
    const skW = variant === 'landscape' ? 220 : 140;
    const skH = variant === 'landscape' ? 130 : 200;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.skeletonRow}>
          {Array.from({length: SKELETON_COUNT}).map((_, i) => (
            <SkeletonLoader
              key={i}
              width={skW}
              height={skH}
              style={{marginRight: theme.spacing.sm}}
            />
          ))}
        </View>
      </View>
    );
  }

  if (!items.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({item, index}) => (
          <ContentCard
            {...item}
            variant={variant}
            onPress={() => onPressItem?.(item)}
            hasTVPreferredFocus={index === 0}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
  },
});

export default ContentRow;
