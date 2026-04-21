import React, {useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import theme from '@/theme';
import {useTheme} from '@/hooks/useTheme';
import SkeletonLoader from './SkeletonLoader';

interface Category {
  id: string;
  title: string;
}

interface CategoryBarProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedId,
  onSelect,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.bar}>
        {Array.from({length: 5}).map((_, i) => (
          <SkeletonLoader
            key={i}
            width={90}
            height={36}
            borderRadius={theme.radii.round}
            style={{marginRight: theme.spacing.xs}}
          />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={categories}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
      renderItem={({item, index}) => {
        const isActive = item.id === selectedId;
        return <CategoryChip item={item} isActive={isActive} onPress={() => onSelect(item.id)} isFirst={index === 0} />;
      }}
    />
  );
};

const CategoryChip: React.FC<{
  item: Category;
  isActive: boolean;
  onPress: () => void;
  isFirst: boolean;
}> = ({item, isActive, onPress, isFirst}) => {
  const [focused, setFocused] = useState(false);
  const {accentColor} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={isFirst}
      style={[
        styles.chip,
        isActive && {backgroundColor: accentColor},
        focused && styles.chipFocused,
      ]}>
      <Text
        style={[
          styles.chipLabel,
          isActive && styles.chipLabelActive,
          focused && styles.chipLabelFocused,
        ]}
        numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surfaceLight,
    marginRight: theme.spacing.xs,
  },
  chipFocused: {
    borderWidth: 2,
    borderColor: theme.colors.textPrimary,
    transform: [{scale: 1.06}],
  },
  chipLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  chipLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  chipLabelFocused: {
    color: theme.colors.textPrimary,
  },
});

export default CategoryBar;
