import { Prisma } from "../../generated/prisma/client";
import { Request, Response } from "express";
import { createDoctorCredentials, createDoctorDetails, deleteDoctorById, findDoctor, listDoctors } from "./doctors.service";
import { doctorCredentialsSchema, doctorDetailsSchema } from "./doctors.validation";

export const getDoctors = async (_request: Request, response: Response): Promise<void> => {
  try { response.status(200).json({ success: true, data: await listDoctors() }); }
  catch (error) { console.error("Unable to list doctors", error); response.status(500).json({ success: false, message: "Unable to load doctors." }); }
};

export const getDoctor = async (request: Request, response: Response): Promise<void> => {
  try {
    const doctorId = String(request.params.doctorId ?? "");
    const doctor = await findDoctor(doctorId);
    if (!doctor) { response.status(404).json({ success: false, message: "Doctor was not found." }); return; }
    response.status(200).json({ success: true, data: doctor });
  } catch (error) { console.error("Unable to load doctor", error); response.status(500).json({ success: false, message: "Unable to load doctor details." }); }
};

export const postDoctorDetails = async (request: Request, response: Response): Promise<void> => {
  const validation = doctorDetailsSchema.safeParse(request.body);
  if (!validation.success) { response.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: validation.error.flatten().fieldErrors }); return; }
  try {
    const doctor = await createDoctorDetails(validation.data);
    response.status(201).json({ success: true, message: "Doctor details saved. Please review and confirm creation of login credentials.", data: doctor });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { response.status(409).json({ success: false, message: "A doctor with this phone number, email, or generated Login ID already exists." }); return; }
    console.error("Unable to create doctor details", error); response.status(500).json({ success: false, message: "Unable to save doctor details." });
  }
};

export const postDoctorCredentials = async (request: Request, response: Response): Promise<void> => {
  const validation = doctorCredentialsSchema.safeParse(request.body);
  if (!validation.success) { response.status(400).json({ success: false, message: "Please correct the highlighted fields.", errors: validation.error.flatten().fieldErrors }); return; }
  try {
    const doctorId = String(request.params.doctorId ?? "");
    const result = await createDoctorCredentials(doctorId, validation.data, response.locals.admin.loginId);
    if (result.outcome === "NOT_FOUND") { response.status(404).json({ success: false, message: "Doctor was not found." }); return; }
    if (result.outcome === "ALREADY_CREATED") { response.status(409).json({ success: false, message: "Login credentials already exist for this doctor." }); return; }
    response.status(201).json({ success: true, message: "Doctor Login ID and password were created successfully.", data: result.doctor });
  } catch (error) { console.error("Unable to create doctor credentials", error); response.status(500).json({ success: false, message: "Unable to create doctor credentials." }); }
};

export const deleteDoctor = async (request: Request, response: Response): Promise<void> => {
  const doctorId = String(request.params.doctorId ?? "");
  try {
    const deleted = await deleteDoctorById(doctorId);
    if (!deleted) { response.status(404).json({ success: false, message: "Doctor was not found." }); return; }
    if (deleted.blocked) { response.status(409).json({ success: false, message: "Doctors with appointment or case history cannot be deleted. Mark the Doctor inactive instead." }); return; }
    response.status(200).json({ success: true, message: `Doctor ${doctorId} was deleted successfully.`, data: deleted });
  } catch (error) {
    console.error("Unable to delete doctor", error);
    response.status(500).json({ success: false, message: "Unable to delete Doctor details." });
  }
};
