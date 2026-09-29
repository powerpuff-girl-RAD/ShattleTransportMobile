import { Stack } from 'expo-router';

/** Passenger area layout — header-less stack (tabs to be added in next sprint). */
export default function PassengerLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
