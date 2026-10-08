// Inspector (dashboard, shift and QR validation are live; inspections/violations are temporary mocks)
export {
    getDashboard,
    startShift,
    endShift,
    validateQR,
    createInspection,
    recordViolation,
} from "./inspectorApi";
export type {
    Inspection,
    InspectionResult,
    InspectionLocation,
    InspectorDashboard,
    InspectorProfile,
    InspectorShift,
    QRValidationResult,
    RecordViolationPayload,
    TodayStats,
    Violation,
    ViolationType,
} from "./inspectorApi";
