import React, {useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import theme from '@/theme';
import CategoryBar from '@/components/CategoryBar';
import ContentCard from '@/components/ContentCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import {useGenres, useVodList} from '@/hooks/usePortalData';
import type {RootStackParamList} from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MoviesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const genres = useGenres('vod');
  const genreList: any[] = Array.isArray(genres.data) ? genres.data : [];

  const categories = [
    {id: '*', title: 'All'},
    ...genreList.map((g: any) => ({id: String(g.id), title: g.title ?? g.name ?? ''})),
  ];

  const [selectedCat, setSelectedCat] = useState('*');
  const vod = useVodList(selectedCat, 1);
  const vodData: any[] = (vod.data as any)?.data ?? [];

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Movies</Text>

      <CategoryBar
        categories={categories}
        selectedId={selectedCat}
        onSelect={setSelectedCat}
        loading={genres.isLoading}
      />

      {vod.isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({length: 12}).map((_, i) => (
            <SkeletonLoader
              key={i}
              width={140}
              height={200}
              style={{marginRight: 12, marginBottom: 16}}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={vodData}
          numColumns={6}
          keyExtractor={(item: any) => String(item.id ?? item.name)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          renderItem={({item}: {item: any}) => (
            <ContentCard
              id={String(item.id ?? item.name)}
              title={item.name ?? ''}
              posterUrl={item.screenshot_uri ?? item.logo}
              variant="poster"
              onPress={() =>
                navigation.navigate('MovieDetail', {movieId: String(item.id)})
              }
              style={{marginBottom: theme.spacing.md}}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.lg,
  },
  heading: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
  },
});

export default MoviesScreen;
