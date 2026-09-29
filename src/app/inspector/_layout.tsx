import { Stack } from 'expo-router';

/** Inspector area layout — header-less stack. */
export default function InspectorLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
