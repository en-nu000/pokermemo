import { Stack } from 'expo-router';

const Layout = (): JSX.Element => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#467FD3',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: 'bold',
        },
        headerTitle: '', // ヘッダータイトルを空にする
      }}
    />
  );
};

export default Layout;
