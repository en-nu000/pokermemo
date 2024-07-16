import { Stack } from 'expo-router';

const Layout = (): JSX.Element => {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#467FD3',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: 'bold',
        },
        headerTitle: '', // ヘッダータイトルを空にする
        headerBackVisible: route.name === 'screen/EditMemoListScreen' || route.name === 'screen/AddMemoListScreen' // 特定の画面でのみ戻るボタンを表示
      })}
    />
  );
};

export default Layout;
