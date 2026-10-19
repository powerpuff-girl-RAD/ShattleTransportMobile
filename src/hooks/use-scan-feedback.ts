import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { Vibration } from 'react-native';

import type { InspectionResult } from '@/api/inspectorApi';

const VALID_SOUND = require('@/assets/sounds/scan-valid.wav');
const INVALID_SOUND = require('@/assets/sounds/scan-invalid.wav');

// Pause/vibrate pattern in ms: one short buzz for valid, three long buzzes for invalid
const VALID_PATTERN = [0, 80];
const INVALID_PATTERN = [0, 250, 120, 250, 120, 250];

/**
 * Audio + vibration feedback for a scan result (usability: the inspector
 * knows the answer without reading the screen on a noisy, crowded bus).
 * Plays once for every new inspection id.
 */
export function useScanFeedback(inspectionId: number | undefined, result: InspectionResult | undefined) {
    const validPlayer = useAudioPlayer(VALID_SOUND);
    const invalidPlayer = useAudioPlayer(INVALID_SOUND);

    useEffect(() => {
        if (inspectionId === undefined || !result) return;

        const isValid = result === 'Valid';
        const player = isValid ? validPlayer : invalidPlayer;

        // Rewind first, so the sound also plays for the second, third… scan
        player.seekTo(0).then(() => player.play()).catch(() => { /* sound is optional */ });
        Vibration.vibrate(isValid ? VALID_PATTERN : INVALID_PATTERN);

        return () => Vibration.cancel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inspectionId]);
}
