import React from 'react';
import { Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, FontSize, Layout } from '@/constants/theme';
import { PassengerProvider } from '@/store/passengerStore';

/**
 * Passenger area layout.
 * Wraps all passenger screens in PassengerProvider so profile/token state
 * is available everywhere within this section without prop drilling.
 */
export default function PassengerLayout() {
    return (
        <PassengerProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Colors.orange,
                    tabBarInactiveTintColor: Colors.inputLightPlaceholder,
                    tabBarStyle: {
                        backgroundColor: Colors.white,
                        borderTopWidth: 0.5,
                        borderTopColor: Colors.inputLightBorder,
                        height: Layout.bottomTabHeight,
                        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: FontSize.xs,
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <TabIcon glyph="🏠" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="tickets"
                    options={{
                        title: 'Tickets',
                        tabBarIcon: ({ color }) => <TabIcon glyph="🎫" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="buy"
                    options={{
                        title: 'Buy',
                        tabBarIcon: ({ color }) => <TabIcon glyph="🛒" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color }) => <TabIcon glyph="👤" color={color} />,
                    }}
                />

                {/* Hidden tab routes for Top-Up and Payment flows */}
                <Tabs.Screen
                    name="topup"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="payment"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="payment-success"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />

                {/* Hidden tab routes for Gate & Journey Flow */}
                <Tabs.Screen
                    name="gate-scanner"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="boarding-confirmation"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="validation-result"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="alighting-confirmation"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />

                {/* Hidden tab routes for Journey Booking Flow */}
                <Tabs.Screen
                    name="booking"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="booking-token"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="booking-details"
                    options={{
                        href: null,
                        tabBarStyle: { display: 'none' },
                    }}
                />
            </Tabs>
        </PassengerProvider>
    );
}

function TabIcon({ glyph, color }: { glyph: string; color: import('react-native').ColorValue }) {
    return <Text style={{ fontSize: 20, color: color as string }}>{glyph}</Text>;
}