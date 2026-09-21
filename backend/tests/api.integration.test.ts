import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import app from "../src/app";
import { matchesImpactMediaSignature } from "../src/module/admin-success-stories/admin-success-stories.upload";
import {
  buildFeedbackEligibleAppointmentWhere,
  createFeedbackExpiry,
  FEEDBACK_LINK_VALIDITY_HOURS,
} from "../src/module/admin-feedback/admin-feedback.service";
import { feedbackInvitationAvailability } from "../src/module/feedback/feedback.service";
import { appointmentRequestSchema } from "../src/module/appointments/appointments.validation";
import {
  contactAppointmentSchema,
  contactAssignmentSchema,
  contactRequestListSchema,
} from "../src/module/admin-contact-requests/admin-contact-requests.validation";
import { performanceQuerySchema } from "../src/module/admin-performance/admin-performance.validation";

let server: Server;
let baseUrl: string;

before(() => {
  server = app.listen(0);
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

test("health and public content endpoints return JSON", async () => {
  for (const path of [
    "/api/health",
    "/api/home",
    "/api/about",
    "/api/services",
    "/api/child-development",
    "/api/our-impact",
    "/api/contact",
    "/api/appointments-request",
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(
      response.headers.get("content-type") ?? "",
      /application\/json/,
    );
    assert.equal(
      ((await response.json()) as { success: boolean }).success,
      true,
    );
  }
});

test("protected Admin and Doctor endpoints reject missing Bearer tokens", async () => {
  for (const path of [
    "/api/admin/dashboard",
    "/api/admin/doctors",
    "/api/admin/appointments",
    "/api/admin/patients",
    "/api/admin/contact-requests",
    "/api/admin/performance/overview",
    "/api/doctor/overview",
    "/api/doctor/appointments",
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 401, path);
    assert.equal(
      ((await response.json()) as { success: boolean }).success,
      false,
    );
  }
});

test("authentication and protected responses cannot be stored by browser or proxy caches", async () => {
  for (const path of [
    "/api/auth/session",
    "/api/admin/dashboard",
    "/api/doctor/overview",
  ]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  }
});

test("public form validation rejects malformed submissions", async () => {
  const headers = { "content-type": "application/json" };
  const contact = await fetch(`${baseUrl}/api/contact/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "x" }),
  });
  assert.equal(contact.status, 400);
  const appointment = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers,
    body: JSON.stringify({ parentName: "x" }),
  });
  assert.equal(appointment.status, 400);
});

test("contact submissions are rate limited", async () => {
  const headers = { "content-type": "application/json" };
  let response: Response | undefined;
  for (let index = 0; index < 10; index += 1) {
    response = await fetch(`${baseUrl}/api/contact/messages`, {
      method: "POST",
      headers,
      body: "{}",
    });
  }
  assert.equal(response?.status, 429);
});

test("uploaded media is accepted by binary signature instead of declared MIME type alone", () => {
  assert.equal(
    matchesImpactMediaSignature(
      "image/png",
      Buffer.from("this is not a png file"),
    ),
    false,
  );
  assert.equal(
    matchesImpactMediaSignature(
      "image/png",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
    ),
    true,
  );
  assert.equal(
    matchesImpactMediaSignature(
      "image/jpeg",
      Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    ),
    true,
  );
  assert.equal(
    matchesImpactMediaSignature(
      "video/mp4",
      Buffer.from([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0, 0, 0, 0]),
    ),
    true,
  );
});

test("feedback eligibility includes every assigned or completed appointment", () => {
  const where = buildFeedbackEligibleAppointmentWhere("APT-12345678");

  assert.equal(where.referenceId, "APT-12345678");
  assert.deepEqual(where.status, { in: ["ASSIGNED", "COMPLETED"] });
});

test("feedback links expire exactly 24 hours after generation or resend", () => {
  const createdAt = new Date("2026-09-18T06:15:00.000Z");
  const expiresAt = createFeedbackExpiry(createdAt);

  assert.equal(FEEDBACK_LINK_VALIDITY_HOURS, 24);
  assert.equal(expiresAt.toISOString(), "2026-09-19T06:15:00.000Z");
  assert.equal(expiresAt.getTime() - createdAt.getTime(), 86_400_000);
});

test("submitted feedback links remain single-use", () => {
  const submitted = feedbackInvitationAvailability({
    status: "SUBMITTED",
    response: { id: "response-id" },
    expiresAt: new Date(Date.now() + 60_000),
  } as never);
  const responseRecorded = feedbackInvitationAvailability({
    status: "OPENED",
    response: { id: "response-id" },
    expiresAt: new Date(Date.now() + 60_000),
  } as never);

  assert.equal(submitted, "SUBMITTED");
  assert.equal(responseRecorded, "SUBMITTED");
});

test("public appointment requests no longer require a preferred time", () => {
  const result = appointmentRequestSchema.safeParse({
    parentName: "Mayur Patil",
    childName: "Aarav Patil",
    childAge: "4 years",
    childDateOfBirth: "2022-09-17",
    phone: "7620149613",
    email: "mayur@example.com",
    preferredDate: "2026-09-18",
    consent: true,
  });
  assert.equal(result.success, true);
});

test("contact request Admin inputs validate filters, assignments and appointment conversion", () => {
  assert.equal(
    contactRequestListSchema.safeParse({
      status: "IN_PROGRESS",
      search: "Mayur",
      page: "1",
      limit: "10",
    }).success,
    true,
  );
  assert.equal(
    contactAssignmentSchema.safeParse({
      doctorId: "DOC000001",
      note: "Please call the parent.",
    }).success,
    true,
  );
  assert.equal(
    contactAppointmentSchema.safeParse({
      childName: "Aarav Patil",
      childAge: "4 years",
      childDateOfBirth: "2022-09-20",
      preferredDate: "2026-09-25",
      consent: true,
    }).success,
    true,
  );
});

test("performance filters accept supported periods and reject unknown periods", () => {
  assert.equal(
    performanceQuerySchema.safeParse({ period: "MONTH" }).success,
    true,
  );
  assert.equal(
    performanceQuerySchema.safeParse({ period: "WEEK" }).success,
    true,
  );
  assert.equal(
    performanceQuerySchema.safeParse({ period: "CUSTOM" }).success,
    false,
  );
});
