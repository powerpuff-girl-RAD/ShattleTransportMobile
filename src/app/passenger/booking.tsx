import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { Button, Text } from '@/components/ui';
import {
    Colors,
    FontSize,
    FontWeight,
    Radius,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { usePassenger } from '@/store/passengerStore';
import {
    getBookingRoutes,
    calculateBookingFare,
    type BookingRoute,
    type RouteSchedule,
    type RouteStop,
} from '@/api/bookingApi';

interface DateItem {
    iso: string;
    dayLabel: string;
    dateLabel: string;
}

export default function BookingScreen() {
    const {
        profile,
        createJourneyBooking,
        bookingsLoading,
        clearError,
    } = usePassenger();

    // ── Generate next 7 dates starting today ──────────────────────────────────
    const availableDates = useMemo<DateItem[]>(() => {
        const list: DateItem[] = [];
        const base = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            const isToday = i === 0;
            const isTomorrow = i === 1;

            list.push({
                iso,
                dayLabel: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : days[d.getDay()],
                dateLabel: `${d.getDate()} ${months[d.getMonth()]}`,
            });
        }
        return list;
    }, []);

    // ── State ─────────────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]?.iso || '2026-10-10');
    const [searchQuery, setSearchQuery] = useState('');
    const [routes, setRoutes] = useState<BookingRoute[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Selected booking selections
    const [selectedRoute, setSelectedRoute] = useState<BookingRoute | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<RouteSchedule | null>(null);
    const [selectedBoardingStop, setSelectedBoardingStop] = useState<RouteStop | null>(null);
    const [selectedAlightingStop, setSelectedAlightingStop] = useState<RouteStop | null>(null);

    // Passenger details (Adult & Minor Counts)
    const [adultCount, setAdultCount] = useState<number>(1);
    const [minorCount, setMinorCount] = useState<number>(0);
    const [showMinorSection, setShowMinorSection] = useState<boolean>(false);

    // Fare calculation
    const [fareAmount, setFareAmount] = useState<number | null>(null);
    const [adultFareUnit, setAdultFareUnit] = useState<number | null>(null);
    const [minorFareUnit, setMinorFareUnit] = useState<number | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [isCalculatingFare, setIsCalculatingFare] = useState(false);

    const currentBalance = profile?.account?.balance ?? 0;

    // ── Fetch routes whenever selectedDate changes ─────────────────────────────
    const fetchRoutes = useCallback(async (date: string) => {
        setLoadingRoutes(true);
        try {
            const res = await getBookingRoutes(date);
            setRoutes(res.routes);
            if (selectedRoute) {
                const updated = res.routes.find((r) => r.Id === selectedRoute.Id);
                if (updated) {
                    setSelectedRoute(updated);
                    const exists = updated.schedules.find((s) => s.Id === selectedSchedule?.Id);
                    setSelectedSchedule(exists || (updated.schedules[0] ?? null));
                }
            }
        } catch (err: any) {
            console.error('Failed to load routes:', err);
        } finally {
            setLoadingRoutes(false);
        }
    }, [selectedRoute, selectedSchedule]);

    useEffect(() => {
        fetchRoutes(selectedDate);
    }, [selectedDate]);

    // ── Filter routes by search query ─────────────────────────────────────────
    const filteredRoutes = useMemo(() => {
        if (!searchQuery.trim()) return routes;
        const q = searchQuery.toLowerCase();
        return routes.filter(
            (r) =>
                r.RouteNumber.toLowerCase().includes(q) ||
                r.RouteName.toLowerCase().includes(q) ||
                r.StartLocation.toLowerCase().includes(q) ||
                r.EndLocation.toLowerCase().includes(q)
        );
    }, [routes, searchQuery]);

    // ── When route is selected, initialize stops & default schedule ───────────
    const handleSelectRoute = (route: BookingRoute) => {
        setSelectedRoute(route);
        setSelectedSchedule(route.schedules[0] || null);

        const stops = route.stops || [];
        if (stops.length >= 2) {
            setSelectedBoardingStop(stops[0]);
            setSelectedAlightingStop(stops[stops.length - 1]);
        } else {
            setSelectedBoardingStop(stops[0] || null);
            setSelectedAlightingStop(null);
        }
    };

    // ── Calculate fare when stops, route, adultCount or minorCount change ─────
    useEffect(() => {
        let isMounted = true;
        if (!selectedRoute || !selectedBoardingStop || !selectedAlightingStop) {
            setFareAmount(null);
            setAdultFareUnit(null);
            setMinorFareUnit(null);
            setDistanceKm(null);
            return;
        }

        if (selectedBoardingStop.Id === selectedAlightingStop.Id) {
            setFareAmount(null);
            setAdultFareUnit(null);
            setMinorFareUnit(null);
            setDistanceKm(null);
            return;
        }

        const effectiveMinorCount = showMinorSection ? minorCount : 0;

        const calculate = async () => {
            setIsCalculatingFare(true);
            try {
                const res = await calculateBookingFare({
                    routeId: selectedRoute.Id,
                    boardingStopId: selectedBoardingStop.Id,
                    alightingStopId: selectedAlightingStop.Id,
                    isPeak: true,
                    adultCount,
                    minorCount: effectiveMinorCount,
                });
                if (isMounted) {
                    setFareAmount(res.fareAmount);
                    setAdultFareUnit(res.adultFareUnit ?? null);
                    setMinorFareUnit(res.minorFareUnit ?? null);
                    setDistanceKm(res.distanceKm);
                }
            } catch {
                if (isMounted) {
                    const bKm = Number(selectedBoardingStop.DistanceFromStartKm || 0);
                    const aKm = Number(selectedAlightingStop.DistanceFromStartKm || 0);
                    const dist = Math.max(1, Math.abs(aKm - bKm));
                    const base = dist >= 30 ? 170 : dist >= 10 ? 90 : 50;
                    const aFare = base;
                    const mFare = Math.round(base * 0.5 * 100) / 100;
                    setDistanceKm(dist);
                    setAdultFareUnit(aFare);
                    setMinorFareUnit(mFare);
                    setFareAmount((adultCount * aFare) + (effectiveMinorCount * mFare));
                }
            } finally {
                if (isMounted) setIsCalculatingFare(false);
            }
        };

        calculate();
        return () => {
            isMounted = false;
        };
    }, [selectedRoute, selectedBoardingStop, selectedAlightingStop, adultCount, minorCount, showMinorSection]);

    // ── Confirm & Book ────────────────────────────────────────────────────────
    const handleBookJourney = async () => {
        if (!selectedRoute || !selectedSchedule || !selectedBoardingStop || !selectedAlightingStop) {
            Alert.alert('Incomplete Details', 'Please complete all route, schedule, and stop selections.');
            return;
        }

        if (fareAmount === null) {
            Alert.alert('Fare Notice', 'Calculating fare for selected stops...');
            return;
        }

        if (currentBalance < fareAmount) {
            Alert.alert(
                'Insufficient Wallet Credit',
                `Total fare is LKR ${fareAmount.toFixed(2)}, but your current balance is LKR ${currentBalance.toFixed(2)}. Please top up your wallet.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Top Up Wallet', onPress: () => router.push('/passenger/topup') },
                ]
            );
            return;
        }

        const effectiveMinorCount = showMinorSection ? minorCount : 0;
        const totalPassengers = adultCount + effectiveMinorCount;
        const passengerTypeLabel: 'Adult' | 'Minor' | 'Mixed' =
            effectiveMinorCount > 0 ? (adultCount > 0 ? 'Mixed' : 'Minor') : 'Adult';

        clearError();
        try {
            const res = await createJourneyBooking({
                routeId: selectedRoute.Id,
                scheduleId: selectedSchedule.Id,
                boardingStopId: selectedBoardingStop.Id,
                alightingStopId: selectedAlightingStop.Id,
                isPeak: true,
                adultCount,
                minorCount: effectiveMinorCount,
                passengerCount: totalPassengers,
                passengerType: passengerTypeLabel,
            });

            router.push({
                pathname: '/passenger/booking-token',
                params: {
                    bookingId: res.booking.Id.toString(),
                    bookingRef: res.booking.BookingRef,
                    tokenSerial: res.booking.TokenSerial,
                    routeNumber: res.booking.RouteNumber,
                    routeName: res.booking.RouteName,
                    boardingStop: res.booking.BoardingStop.StopName,
                    alightingStop: res.booking.AlightingStop.StopName,
                    scheduleDate: res.booking.ScheduleDate,
                    timeSlot: res.booking.TimeSlot,
                    fareAmount: res.booking.FareAmount.toString(),
                    passengerCount: (res.booking.PassengerCount || totalPassengers).toString(),
                    passengerType: res.booking.PassengerType || passengerTypeLabel,
                    adultCount: (res.booking.AdultCount ?? adultCount).toString(),
                    minorCount: (res.booking.MinorCount ?? effectiveMinorCount).toString(),
                },
            });
        } catch (err: any) {
            Alert.alert('Booking Error', err?.response?.data?.message || err?.message || 'Failed to complete booking');
        }
    };

    const isBalanceSufficient = fareAmount !== null && currentBalance >= fareAmount;

    return (
        <View style={styles.root}>
            {/* ── Top Header ──────────────────────────────────────────── */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backBtn}
                    onPress={() => router.replace('/passenger')}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Text style={styles.backBtnText}>←</Text>
                </Pressable>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Book a Journey</Text>
                    <Text style={styles.headerSubtitle}>Select route, schedule & bus stops</Text>
                </View>
                <Pressable
                    style={styles.balancePill}
                    onPress={() => router.push('/passenger/topup')}
                >
                    <Text style={styles.balancePillLabel}>Wallet</Text>
                    <Text style={styles.balancePillValue}>LKR {currentBalance.toFixed(0)}</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── Schedule Date Selection Carousel ──────────────────── */}
                <Text style={styles.sectionTitle}>SELECT TRAVEL DATE</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.datesRow}
                >
                    {availableDates.map((item) => {
                        const isSelected = selectedDate === item.iso;
                        return (
                            <Pressable
                                key={item.iso}
                                style={[styles.dateCard, isSelected ? styles.dateCardActive : undefined]}
                                onPress={() => setSelectedDate(item.iso)}
                            >
                                <Text style={[styles.dateDayText, isSelected ? styles.dateDayTextActive : undefined]}>
                                    {item.dayLabel}
                                </Text>
                                <Text style={[styles.dateNumText, isSelected ? styles.dateNumTextActive : undefined]}>
                                    {item.dateLabel}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {/* ── Route Search Input ────────────────────────────────── */}
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Filter routes by number or city..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearSearch}>✕</Text>
                        </Pressable>
                    )}
                </View>

                {/* ── Routes List ───────────────────────────────────────── */}
                <Text style={styles.sectionTitle}>
                    AVAILABLE ROUTES ON {selectedDate} ({filteredRoutes.length})
                </Text>

                {loadingRoutes ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="small" color="#0F6B56" />
                        <Text style={styles.loadingText}>Fetching available routes & schedules...</Text>
                    </View>
                ) : filteredRoutes.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>🚌</Text>
                        <Text style={styles.emptyTitle}>No routes available</Text>
                        <Text style={styles.emptySub}>
                            No scheduled buses found for this date. Please select another date.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.routesList}>
                        {filteredRoutes.map((route) => {
                            const isSelected = selectedRoute?.Id === route.Id;
                            return (
                                <Pressable
                                    key={route.Id}
                                    style={[styles.routeCard, isSelected ? styles.routeCardActive : undefined]}
                                    onPress={() => handleSelectRoute(route)}
                                >
                                    <View style={styles.routeTopRow}>
                                        <View style={styles.routeBadge}>
                                            <Text style={styles.routeBadgeText}>{route.RouteNumber}</Text>
                                        </View>
                                        <View style={styles.routeMainInfo}>
                                            <Text style={styles.routeNameText}>{route.RouteName}</Text>
                                            <Text style={styles.routeEndpoints}>
                                                {route.StartLocation} → {route.EndLocation}
                                            </Text>
                                        </View>
                                        <View style={styles.scheduleBadge}>
                                            <Text style={styles.scheduleBadgeText}>
                                                {route.schedulesCount} {route.schedulesCount === 1 ? 'Slot' : 'Slots'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.routeMetaRow}>
                                        <Text style={styles.metaItem}>
                                            📍 {route.stops?.length || 0} Bus Stops
                                        </Text>
                                        <Text style={styles.metaItem}>
                                            🛣️ {route.DistanceKm || 38} km
                                        </Text>
                                        <Text style={[styles.selectIndicator, isSelected ? styles.selectIndicatorActive : undefined]}>
                                            {isSelected ? '✓ Selected' : 'Tap to select'}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* ── Step 2: Time Slot & Stops ─────────────────────────── */}
                {selectedRoute && (
                    <View style={styles.bookingStepCard}>
                        <Text style={styles.stepHeader}>SELECT SCHEDULE TIME SLOT</Text>
                        {selectedRoute.schedules.length === 0 ? (
                            <Text style={styles.noScheduleText}>
                                No scheduled departures available on this date for Route {selectedRoute.RouteNumber}.
                            </Text>
                        ) : (
                            <View style={styles.slotsGrid}>
                                {selectedRoute.schedules.map((slot) => {
                                    const isSlotSelected = selectedSchedule?.Id === slot.Id;
                                    return (
                                        <Pressable
                                            key={slot.Id}
                                            style={[styles.slotTile, isSlotSelected ? styles.slotTileActive : undefined]}
                                            onPress={() => setSelectedSchedule(slot)}
                                        >
                                            <Text style={[styles.slotTimeText, isSlotSelected ? styles.slotTimeTextActive : undefined]}>
                                                ⏰ {slot.StartTime} - {slot.EndTime}
                                            </Text>
                                            {slot.SlotLabel && (
                                                <Text style={[styles.slotLabelText, isSlotSelected ? styles.slotLabelTextActive : undefined]}>
                                                    {slot.SlotLabel}
                                                </Text>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}

                        <View style={styles.stepDivider} />

                        {/* Boarding Bus Stop Selection */}
                        <Text style={styles.stepHeader}>BOARDING BUS STOP</Text>
                        <View style={styles.stopsScroll}>
                            {(selectedRoute.stops || []).map((stop) => {
                                const isBoarding = selectedBoardingStop?.Id === stop.Id;
                                return (
                                    <Pressable
                                        key={stop.Id}
                                        style={[styles.stopChip, isBoarding ? styles.stopChipActive : undefined]}
                                        onPress={() => setSelectedBoardingStop(stop)}
                                    >
                                        <Text style={[styles.stopChipText, isBoarding ? styles.stopChipTextActive : undefined]}>
                                            {isBoarding ? '● ' : '○ '}
                                            {stop.StopName} ({stop.DistanceFromStartKm} km)
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={styles.stepDivider} />

                        {/* Alighting Bus Stop Selection */}
                        <Text style={styles.stepHeader}>ALIGHTING BUS STOP</Text>
                        <View style={styles.stopsScroll}>
                            {(selectedRoute.stops || []).map((stop) => {
                                const isAlighting = selectedAlightingStop?.Id === stop.Id;
                                const isInvalid = selectedBoardingStop && stop.Id === selectedBoardingStop.Id;
                                return (
                                    <Pressable
                                        key={stop.Id}
                                        disabled={isInvalid}
                                        style={[
                                            styles.stopChip,
                                            isAlighting ? styles.stopChipActive : undefined,
                                            isInvalid ? styles.stopChipDisabled : undefined,
                                        ]}
                                        onPress={() => setSelectedAlightingStop(stop)}
                                    >
                                        <Text
                                            style={[
                                                styles.stopChipText,
                                                isAlighting ? styles.stopChipTextActive : undefined,
                                                isInvalid ? styles.stopChipTextDisabled : undefined,
                                            ]}
                                        >
                                            {isAlighting ? '● ' : '○ '}
                                            {stop.StopName} ({stop.DistanceFromStartKm} km)
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={styles.stepDivider} />

                        {/* ── Passenger Details (Separately Adult & Minor) ──────────────── */}
                        <Text style={styles.stepHeader}>PASSENGER DETAILS</Text>

                        {/* Adult Passengers Counter (Default always displayed) */}
                        <View style={styles.passengerRowCard}>
                            <View style={styles.passengerInfoCol}>
                                <View style={styles.passengerTitleRow}>
                                    <Text style={styles.countTitle}>🧑 Adults</Text>
                                    <View style={styles.adultBadge}>
                                        <Text style={styles.adultBadgeText}>STANDARD</Text>
                                    </View>
                                </View>
                                <Text style={styles.countSubtitle}>
                                    Full fare {adultFareUnit ? `(LKR ${adultFareUnit.toFixed(2)}/seat)` : ''}
                                </Text>
                            </View>
                            <View style={styles.stepperWrap}>
                                <Pressable
                                    style={[
                                        styles.stepperBtn,
                                        adultCount <= 1 ? styles.stepperBtnDisabled : undefined,
                                    ]}
                                    disabled={adultCount <= 1}
                                    onPress={() => setAdultCount((c) => Math.max(1, c - 1))}
                                >
                                    <Text style={styles.stepperBtnText}>−</Text>
                                </Pressable>
                                <View style={styles.stepperValueBox}>
                                    <Text style={styles.stepperValueText}>{adultCount}</Text>
                                </View>
                                <Pressable
                                    style={[
                                        styles.stepperBtn,
                                        adultCount >= 10 ? styles.stepperBtnDisabled : undefined,
                                    ]}
                                    disabled={adultCount >= 10}
                                    onPress={() => setAdultCount((c) => Math.min(10, c + 1))}
                                >
                                    <Text style={styles.stepperBtnText}>+</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Minor Passenger Section: Hidden by default, displayed if user adds minors */}
                        {!showMinorSection ? (
                            <Pressable
                                style={styles.addMinorButton}
                                onPress={() => {
                                    setShowMinorSection(true);
                                    setMinorCount(1);
                                }}
                            >
                                <View style={styles.addMinorIconWrap}>
                                    <Text style={styles.addMinorPlusIcon}>＋</Text>
                                </View>
                                <View style={styles.addMinorTextCol}>
                                    <Text style={styles.addMinorTitle}>Add Minor Passengers</Text>
                                    <Text style={styles.addMinorDesc}>Children under 12 · 50% concession discount</Text>
                                </View>
                                <View style={styles.concessionTag}>
                                    <Text style={styles.concessionTagText}>50% OFF</Text>
                                </View>
                            </Pressable>
                        ) : (
                            <View style={styles.minorPassengerCard}>
                                <View style={styles.minorCardTopRow}>
                                    <View style={styles.passengerInfoCol}>
                                        <View style={styles.passengerTitleRow}>
                                            <Text style={styles.countTitle}>🧒 Minors</Text>
                                            <View style={styles.concessionTag}>
                                                <Text style={styles.concessionTagText}>50% OFF</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.countSubtitle}>
                                            Children under 12 {minorFareUnit ? `(LKR ${minorFareUnit.toFixed(2)}/seat)` : ''}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.removeMinorBtn}
                                        onPress={() => {
                                            setShowMinorSection(false);
                                            setMinorCount(0);
                                        }}
                                    >
                                        <Text style={styles.removeMinorText}>✕ Remove</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.minorStepperRow}>
                                    <Text style={styles.minorSeatsLabel}>Minor Seats:</Text>
                                    <View style={styles.stepperWrap}>
                                        <Pressable
                                            style={[
                                                styles.stepperBtn,
                                                minorCount <= 1 ? styles.stepperBtnDisabled : undefined,
                                            ]}
                                            disabled={minorCount <= 1}
                                            onPress={() => setMinorCount((c) => Math.max(1, c - 1))}
                                        >
                                            <Text style={styles.stepperBtnText}>−</Text>
                                        </Pressable>
                                        <View style={styles.stepperValueBox}>
                                            <Text style={styles.stepperValueText}>{minorCount}</Text>
                                        </View>
                                        <Pressable
                                            style={[
                                                styles.stepperBtn,
                                                minorCount >= 10 ? styles.stepperBtnDisabled : undefined,
                                            ]}
                                            disabled={minorCount >= 10}
                                            onPress={() => setMinorCount((c) => Math.min(10, c + 1))}
                                        >
                                            <Text style={styles.stepperBtnText}>+</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Fare Calculation & Wallet Summary ──────────────────── */}
                {selectedRoute && selectedBoardingStop && selectedAlightingStop && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>JOURNEY SUMMARY & FARE</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Route & Time</Text>
                            <Text style={styles.summaryValue}>
                                Route {selectedRoute.RouteNumber} · {selectedSchedule?.StartTime || '09:00'}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>From</Text>
                            <Text style={styles.summaryValueGreen}>{selectedBoardingStop.StopName}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>To</Text>
                            <Text style={styles.summaryValueGreen}>{selectedAlightingStop.StopName}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Passengers</Text>
                            <Text style={styles.summaryValue}>
                                {adultCount} Adult{adultCount > 1 ? 's' : ''}
                                {showMinorSection && minorCount > 0 ? ` + ${minorCount} Minor${minorCount > 1 ? 's' : ''}` : ''}
                            </Text>
                        </View>

                        {showMinorSection && minorCount > 0 && adultFareUnit && minorFareUnit && (
                            <View style={styles.fareBreakdownRow}>
                                <Text style={styles.breakdownText}>
                                    • Adults: {adultCount} × LKR {adultFareUnit.toFixed(2)} = LKR {(adultCount * adultFareUnit).toFixed(2)}
                                </Text>
                                <Text style={styles.breakdownText}>
                                    • Minors (50%): {minorCount} × LKR {minorFareUnit.toFixed(2)} = LKR {(minorCount * minorFareUnit).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Est. Distance</Text>
                            <Text style={styles.summaryValue}>{distanceKm ? `${distanceKm} km` : 'Calculating...'}</Text>
                        </View>

                        <View style={styles.calcDivider} />

                        {/* Total Fare */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.fareTotalLabel}>Total Journey Fare</Text>
                            {isCalculatingFare ? (
                                <ActivityIndicator size="small" color="#0A9A5F" />
                            ) : (
                                <Text style={styles.fareTotalValue}>
                                    LKR {fareAmount !== null ? fareAmount.toFixed(2) : '--'}
                                </Text>
                            )}
                        </View>

                        {/* Wallet Balance Comparison */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Wallet Balance</Text>
                            <Text style={[styles.summaryValue, !isBalanceSufficient ? styles.balanceLowText : styles.balanceGoodText]}>
                                LKR {currentBalance.toFixed(2)}
                            </Text>
                        </View>

                        {/* Warning if insufficient */}
                        {!isBalanceSufficient && fareAmount !== null && (
                            <View style={styles.insufficientBanner}>
                                <Text style={styles.insufficientIcon}>⚠️</Text>
                                <View style={styles.insufficientTextWrap}>
                                    <Text style={styles.insufficientTitle}>Insufficient Balance</Text>
                                    <Text style={styles.insufficientDesc}>
                                        You need LKR {(fareAmount - currentBalance).toFixed(2)} more to book this journey.
                                    </Text>
                                </View>
                                <Pressable
                                    style={styles.topUpNowBtn}
                                    onPress={() => router.push('/passenger/topup')}
                                >
                                    <Text style={styles.topUpNowText}>Top-up</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

                {/* ── Booking Action Button ──────────────────────────────── */}
                {selectedRoute && (
                    <View style={styles.bookActionWrap}>
                        {isBalanceSufficient ? (
                            <Button
                                label={`Book Journey · LKR ${fareAmount?.toFixed(2)}`}
                                onPress={handleBookJourney}
                                loading={bookingsLoading}
                                style={styles.bookBtn}
                            />
                        ) : (
                            <Button
                                label="Top Up Wallet to Book"
                                onPress={() => router.push('/passenger/topup')}
                                style={styles.topUpActionBtn}
                            />
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F3F6F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F6B56',
        paddingHorizontal: Spacing.md,
        paddingTop: Platform.OS === 'ios' ? 54 : 36,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    backBtnText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginTop: -2,
    },
    headerTitleWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.78)',
        marginTop: 2,
    },
    balancePill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.md,
        alignItems: 'center',
    },
    balancePillLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: FontWeight.medium,
    },
    balancePillValue: {
        color: '#FFFFFF',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    scroll: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#475569',
        letterSpacing: 0.6,
        marginBottom: Spacing.xs,
    },
    datesRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    dateCard: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: Radius.md,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        minWidth: 80,
    },
    dateCardActive: {
        backgroundColor: '#E67E22',
        borderColor: '#E67E22',
    },
    dateDayText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#64748B',
        marginBottom: 2,
    },
    dateDayTextActive: {
        color: Colors.white,
    },
    dateNumText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: '#334155',
    },
    dateNumTextActive: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.text,
        padding: 0,
    },
    clearSearch: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: FontWeight.bold,
        paddingHorizontal: 4,
    },
    loaderWrap: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: FontSize.xs,
        color: '#64748B',
        marginTop: Spacing.xs,
    },
    emptyCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    emptyIcon: {
        fontSize: 36,
        marginBottom: Spacing.xs,
    },
    emptyTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    emptySub: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        textAlign: 'center',
        marginTop: 4,
    },
    routesList: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    routeCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        ...Shadow.sm,
    },
    routeCardActive: {
        borderColor: '#0F6B56',
        backgroundColor: '#F0FDF4',
    },
    routeTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    routeBadge: {
        backgroundColor: '#E67E22',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.sm,
        marginRight: Spacing.sm,
    },
    routeBadgeText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    routeMainInfo: {
        flex: 1,
    },
    routeNameText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    routeEndpoints: {
        fontSize: FontSize.xs,
        color: Colors.gray600,
        marginTop: 2,
    },
    scheduleBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.sm,
    },
    scheduleBadgeText: {
        color: '#2563EB',
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    routeMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    metaItem: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
    },
    selectIndicator: {
        fontSize: FontSize.xs,
        color: '#64748B',
        fontWeight: FontWeight.semibold,
    },
    selectIndicatorActive: {
        color: '#0F6B56',
        fontWeight: FontWeight.bold,
    },
    bookingStepCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    stepHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
        letterSpacing: 0.5,
        marginBottom: Spacing.xs,
    },
    noScheduleText: {
        fontSize: FontSize.xs,
        color: '#EF4444',
        marginBottom: Spacing.xs,
    },
    slotsGrid: {
        gap: Spacing.xs,
        marginTop: 4,
    },
    slotTile: {
        paddingVertical: 10,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    slotTileActive: {
        backgroundColor: '#0F6B56',
        borderColor: '#0F6B56',
    },
    slotTimeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
    },
    slotTimeTextActive: {
        color: Colors.white,
    },
    slotLabelText: {
        fontSize: 10,
        color: Colors.gray500,
        marginTop: 2,
    },
    slotLabelTextActive: {
        color: 'rgba(255,255,255,0.85)',
    },
    stepDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: Spacing.md,
    },
    stopsScroll: {
        gap: Spacing.xs,
        marginTop: 4,
    },
    stopChip: {
        paddingVertical: 9,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stopChipActive: {
        backgroundColor: '#0A9A5F',
        borderColor: '#0A9A5F',
    },
    stopChipDisabled: {
        opacity: 0.4,
    },
    stopChipText: {
        fontSize: FontSize.xs,
        color: Colors.text,
        fontWeight: FontWeight.medium,
    },
    stopChipTextActive: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
    stopChipTextDisabled: {
        color: '#94A3B8',
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadow.sm,
    },
    passengerRowCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    passengerInfoCol: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    passengerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    adultBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    adultBadgeText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        color: '#475569',
    },
    addMinorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        borderRadius: Radius.lg,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    addMinorIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E6FAF2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    addMinorPlusIcon: {
        color: '#0F6B56',
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    addMinorTextCol: {
        flex: 1,
    },
    addMinorTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#0F6B56',
    },
    addMinorDesc: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
    },
    concessionTag: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    concessionTagText: {
        fontSize: 9,
        fontWeight: FontWeight.bold,
        color: '#B45309',
    },
    minorPassengerCard: {
        backgroundColor: '#FFFDF9',
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: '#FED7AA',
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    minorCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    removeMinorBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    removeMinorText: {
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: '#B91C1C',
    },
    minorStepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#FFEDD5',
    },
    minorSeatsLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: '#9A3412',
    },
    fareBreakdownRow: {
        backgroundColor: '#F8FAFC',
        padding: 8,
        borderRadius: Radius.sm,
        marginVertical: 4,
        gap: 3,
    },
    breakdownText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: FontWeight.medium,
    },
    countRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    countTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    countSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.gray500,
        marginTop: 2,
    },
    stepperWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        overflow: 'hidden',
    },
    stepperBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    stepperBtnDisabled: {
        opacity: 0.4,
    },
    stepperBtnText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#334155',
    },
    stepperValueBox: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperValueText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    summaryTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#334155',
        letterSpacing: 0.6,
        marginBottom: Spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    summaryLabel: {
        fontSize: FontSize.sm,
        color: Colors.gray500,
    },
    summaryValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
    },
    summaryValueGreen: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: '#0F6B56',
    },
    calcDivider: {
        height: 1,
        backgroundColor: '#EDF2F7',
        marginVertical: Spacing.xs,
    },
    fareTotalLabel: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    fareTotalValue: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: '#0A9A5F',
    },
    balanceGoodText: {
        color: '#0A9A5F',
        fontWeight: FontWeight.bold,
    },
    balanceLowText: {
        color: '#EF4444',
        fontWeight: FontWeight.bold,
    },
    insufficientBanner: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: Spacing.sm,
        marginTop: Spacing.sm,
        alignItems: 'center',
    },
    insufficientIcon: {
        fontSize: 20,
        marginRight: Spacing.xs,
    },
    insufficientTextWrap: {
        flex: 1,
    },
    insufficientTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
        color: '#B91C1C',
    },
    insufficientDesc: {
        fontSize: 10,
        color: '#991B1B',
        marginTop: 1,
    },
    topUpNowBtn: {
        backgroundColor: '#B91C1C',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: Radius.sm,
    },
    topUpNowText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    bookActionWrap: {
        marginBottom: Spacing.xl,
    },
    bookBtn: {
        backgroundColor: '#0F6B56',
    },
    topUpActionBtn: {
        backgroundColor: '#E67E22',
    },
});

