import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Semantic icon names → SF Symbol (iOS) + Material Symbol (Android / web).
 * Add new icons here instead of passing raw platform names around screens.
 */
const ICONS = {
    shield: { ios: 'checkmark.shield', android: 'verified_user' },
    scan: { ios: 'qrcode.viewfinder', android: 'qr_code_scanner' },
    history: { ios: 'clock.arrow.circlepath', android: 'history' },
    home: { ios: 'house', android: 'home' },
    person: { ios: 'person', android: 'person' },
    bell: { ios: 'bell', android: 'notifications' },
    check: { ios: 'checkmark.circle', android: 'check_circle' },
    cross: { ios: 'xmark.circle', android: 'cancel' },
    chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
    back: { ios: 'arrow.left', android: 'arrow_back' },
    filter: { ios: 'slider.horizontal.3', android: 'tune' },
    logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
    lock: { ios: 'lock', android: 'lock' },
    calendar: { ios: 'calendar', android: 'calendar_month' },
    warning: { ios: 'exclamationmark.triangle', android: 'warning' },
    flash: { ios: 'bolt.fill', android: 'flash_on' },
    search: { ios: 'magnifyingglass', android: 'search' },
    location: { ios: 'mappin.and.ellipse', android: 'location_on' },
    report: { ios: 'doc.text', android: 'description' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

interface IconProps {
    name: IconName;
    size?: number;
    color?: ColorValue;
    style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 22, color = Colors.textDark, style }: IconProps) {
    const { ios, android } = ICONS[name];
    return (
        <SymbolView
            name={{ ios, android, web: android }}
            size={size}
            tintColor={color}
            style={style}
        />
    );
}
