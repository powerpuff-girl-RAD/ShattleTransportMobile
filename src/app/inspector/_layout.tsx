import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { Colors, FontSize, Layout } from '@/constants/theme';
import { InspectorProvider } from '@/store/inspectorStore';

/**
 * Inspector area layout.
 * Wraps all inspector screens in InspectorProvider (shift, inspections,
 * violations) and shows the dark Home / Scan / History / Profile tab bar.
 */
export default function InspectorLayout() {
    return (
        <InspectorProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Colors.orange,
                    tabBarInactiveTintColor: Colors.inputLightPlaceholder,
                    tabBarStyle: {
                        backgroundColor: Colors.inspectorTabBar,
                        borderTopWidth: 0,
                        height: Layout.bottomTabHeight,
                        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: { fontSize: FontSize.xs },
                }}
            >
                <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
                <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: tabIcon('scan') }} />
                <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: tabIcon('history') }} />
                <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
            </Tabs>
        </InspectorProvider>
    );
}

function tabIcon(name: IconName) {
    return function TabIcon({ color }: { color: ColorValue }) {
        return <Icon name={name} color={color} size={24} />;
    };
}
