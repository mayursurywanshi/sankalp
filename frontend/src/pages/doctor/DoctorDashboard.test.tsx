import { describe, expect, it } from "vitest";
import { patientIdForHistoryRefresh } from "./DoctorDashboard";
import { DoctorAppointmentDetail } from "./doctor-appointments.types";

describe("patientIdForHistoryRefresh", () => {
  it("uses the patient identifier returned inside appointment details", () => {
    const detail = {
      patient: { patientId: "PAT000004" },
    } as DoctorAppointmentDetail;

    expect(patientIdForHistoryRefresh(detail)).toBe("PAT000004");
  });

  it("does not allow a history request without a patient identifier", () => {
    const detail = { patient: {} } as DoctorAppointmentDetail;

    expect(() => patientIdForHistoryRefresh(detail)).toThrow(
      "Patient information is unavailable.",
    );
  });
});
