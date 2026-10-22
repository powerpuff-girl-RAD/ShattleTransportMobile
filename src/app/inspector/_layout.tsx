import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
import { Colors, FontSize, Layout } from '@/constants/theme';
import { useSessionGuard } from '@/hooks/use-session-guard';
import { InspectorProvider } from '@/store/inspectorStore';

/**
 * Inspector area layout.
 * Wraps all inspector screens in InspectorProvider (shift, inspections,
 * violations) and shows the dark Home / Scan / History / Profile tab bar.
 */
export default function InspectorLayout() {
    useSessionGuard();

    return (
        <InspectorProvider>
            <Tabs
                // Back button returns to the previous screen, not always to Home
                backBehavior="history"
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

                {/* Screens opened from other screens — not shown as tabs */}
                <Tabs.Screen name="result" options={HIDDEN} />
                <Tabs.Screen name="violation" options={HIDDEN} />
                <Tabs.Screen name="inspection/[id]" options={HIDDEN} />
                <Tabs.Screen name="violations" options={HIDDEN} />
                <Tabs.Screen name="stats" options={HIDDEN} />
                <Tabs.Screen name="schedule" options={HIDDEN} />
                <Tabs.Screen name="change-password" options={HIDDEN} />
            </Tabs>
        </InspectorProvider>
    );
}

const HIDDEN = { href: null } as const;

function tabIcon(name: IconName) {
    return function TabIcon({ color }: { color: ColorValue }) {
        return <Icon name={name} color={color} size={24} />;
    };
}
