import React from 'react';
import {StatusBar} from 'react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AppNavigator from '@/navigation/AppNavigator';
import theme from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <AppNavigator />
    </QueryClientProvider>
  );
};

export default App;
