import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { TicketBooking } from '@/api/inspectorApi';
import { Card } from '@/components/inspector/Card';
import { InfoRow } from '@/components/inspector/InfoRow';
import { InspectorHeader } from '@/components/inspector/InspectorHeader';
import { ResultBadge } from '@/components/inspector/ResultBadge';
import { StatusPill } from '@/components/inspector/StatusPill';
import { Button, Icon, Text } from '@/components/ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useScanFeedback } from '@/hooks/use-scan-feedback';
import { useInspector, type TicketOutcome } from '@/store/inspectorStore';
import { formatClock, formatDate } from '@/utils/formatTime';

/** Short label for each reason code the backend sends back. */
const REASONS: Record<string, string> = {
    WRONG_ROUTE: 'Wrong Route',
    EXPIRED: 'Expired',
    ALREADY_USED: 'Already Used',
    UNKNOWN_QR: 'Unknown QR',
    NOT_ACTIVE: 'Not Active',
    NOT_A_BOOKING: 'Not a Booking',
    OUTSTANDING_DEBT: 'Outstanding Debt',
    ALREADY_TRAVELLING: 'Already Travelling',
    ALREADY_TAPPED_IN: 'Already Tapped In',
};

const JOURNEY_LABELS: Record<string, { label: string; tone: 'success' | 'error' | 'neutral' }> = {
    NotTappedIn: { label: 'Not tapped in', tone: 'neutral' },
    InProgress: { label: 'In progress', tone: 'success' },
    Completed: { label: 'Completed', tone: 'neutral' },
    AutoClosedPenalty: { label: 'Missed tap-out', tone: 'error' },
};

const money = (n: number) => `LKR ${n.toFixed(2)}`;

/**
 * Ticket Result — shown after a booking QR is scanned in "Tap In / Out" or
 * "Validate" mode. Tap-in, tap-out (with the fare charged), VALID / INVALID,
 * or the reason the backend refused the scan.
 */
export default function TicketResultScreen() {
    const { lastTicket } = useInspector();
    useScanFeedback(lastTicket?.id, isPositive(lastTicket) ? 'Valid' : 'Invalid');

    const scanNext = () => router.navigate('/inspector/scan');

    if (!lastTicket) {
        return (
            <View style={styles.root}>
                <InspectorHeader title="Ticket Result" onBack={scanNext} />
                <Text style={styles.empty}>Nothing scanned yet.</Text>
            </View>
        );
    }

    const title = lastTicket.kind === 'validate' || (lastTicket.kind === 'rejected' && lastTicket.mode === 'validate')
        ? 'Validate Ticket'
        : 'Tap In / Out';

    return (
        <View style={styles.root}>
            <InspectorHeader title={title} subtitle={subtitleFor(lastTicket)} onBack={scanNext} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Outcome ticket={lastTicket} />
                <Button label="Scan Next" onPress={scanNext} />
            </ScrollView>
        </View>
    );
}

function Outcome({ ticket }: { ticket: TicketOutcome }) {

    if (ticket.kind === 'rejected') {
        return (
            <Card style={styles.hero}>
                <ResultBadge result="Invalid" label="Rejected" caption={REASONS[ticket.code] ?? ticket.code} />
                <Text style={styles.message}>{ticket.message}</Text>
                <Text style={styles.note}>
                    {ticket.mode === 'scan' ? 'Nothing was changed or charged.' : 'Validation never changes anything.'}
                </Text>
            </Card>
        );
    }

    if (ticket.kind === 'validate') {
        const { result } = ticket;
        const journey = JOURNEY_LABELS[result.journeyStatus] ?? JOURNEY_LABELS.NotTappedIn;
        return (
            <>
                <Card style={styles.hero}>
                    <ResultBadge
                        result={result.valid ? 'Valid' : 'Invalid'}
                        caption={result.valid ? `Route ${result.route.routeNumber}` : result.reason}
                    />
                    <Text style={styles.message}>{result.message}</Text>
                    <Text style={styles.note}>Read-only check — nothing was saved or charged.</Text>
                </Card>
                {result.booking ? (
                    <BookingCard booking={result.booking}>
                        <InfoRow label="Journey">
                            <StatusPill label={journey.label} tone={journey.tone} />
                        </InfoRow>
                    </BookingCard>
                ) : null}
            </>
        );
    }

    const { result } = ticket;

    if (result.action === 'TAP_IN') {
        return (
            <>
                <Card style={styles.hero}>
                    <ResultBadge result="Valid" label="Tapped In" caption="Journey started" />
                    <Text style={styles.message}>Scan the same QR again at the passenger's stop to tap them out.</Text>
                </Card>
                <BookingCard booking={result.booking}>
                    <InfoRow label="Entry" value={formatClock(result.journey.entryAt)} />
                </BookingCard>
            </>
        );
    }

    // TAP_OUT
    const inDebt = (result.outstandingAmount ?? 0) > 0;
    return (
        <>
            <Card style={styles.hero}>
                <ResultBadge result="Valid" label="Tapped Out" caption={`${money(result.fare ?? 0)} charged`} />
                <Text style={styles.message}>{result.message}</Text>
            </Card>

            {inDebt ? (
                <View style={styles.debt}>
                    <Icon name="warning" color={Colors.error} size={18} />
                    <Text style={styles.debtText}>
                        Balance is {money(result.balance ?? 0)}. The passenger can't board again until they top up.
                    </Text>
                </View>
            ) : null}

            <Card title="Payment">
                <InfoRow label="Fare (booked trip)" value={money(result.fare ?? 0)} />
                <InfoRow
                    label="New balance"
                    value={money(result.balance ?? 0)}
                    valueColor={inDebt ? Colors.error : Colors.textDark}
                />
                <InfoRow label="Status">
                    <StatusPill label={inDebt ? 'Outstanding' : 'Paid'} tone={inDebt ? 'error' : 'success'} />
                </InfoRow>
            </Card>

            <BookingCard booking={result.booking}>
                <InfoRow label="Entry" value={formatClock(result.journey.entryAt)} />
                {result.journey.exitAt ? <InfoRow label="Exit" value={formatClock(result.journey.exitAt)} /> : null}
            </BookingCard>
        </>
    );
}

function BookingCard({ booking, children }: { booking: TicketBooking; children?: React.ReactNode }) {
    const passengers = [
        booking.adultCount ? `${booking.adultCount} adult${booking.adultCount > 1 ? 's' : ''}` : null,
        booking.minorCount ? `${booking.minorCount} minor${booking.minorCount > 1 ? 's' : ''}` : null,
    ].filter(Boolean).join(' + ');

    return (
        <Card title="Booking">
            <InfoRow label="Reference" value={booking.bookingRef} />
            <InfoRow label="Route" value={`Route ${booking.routeNumber} · ${booking.routeName}`} />
            <InfoRow label="Trip" value={`${booking.boardingStop ?? '—'} → ${booking.alightingStop ?? '—'}`} />
            {booking.travelDate ? <InfoRow label="Travel date" value={formatDate(booking.travelDate)} /> : null}
            <InfoRow label="Passengers" value={passengers || '1 adult'} />
            {children}
        </Card>
    );
}

function isPositive(ticket: TicketOutcome | null): boolean {
    if (!ticket || ticket.kind === 'rejected') return false;
    return ticket.kind === 'scan' || ticket.result.valid;
}

function subtitleFor(ticket: TicketOutcome): string | undefined {
    if (ticket.kind === 'scan') return `Token #${ticket.result.booking.tokenSerial}`;
    if (ticket.kind === 'validate' && ticket.result.tokenSerial) return `Token #${ticket.result.tokenSerial}`;
    return undefined;
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.surfaceLight },
    scroll: { padding: Spacing.five, gap: Spacing.four, paddingBottom: Spacing.twelve },
    empty: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.six },

    hero: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six },
    message: { color: Colors.textDarkSecondary, fontSize: FontSize.sm, textAlign: 'center' },
    note: { color: Colors.textDarkSecondary, fontSize: FontSize.xs, textAlign: 'center', fontStyle: 'italic' },

    debt: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
        backgroundColor: Colors.errorTint, borderRadius: Radius.md, padding: Spacing.three,
    },
    debtText: { flex: 1, color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
