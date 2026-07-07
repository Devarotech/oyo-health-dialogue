import { Patient, Clinic } from "./types";

export const initialPatients: Patient[] = [
  {
    name: "Mama Bose",
    phone: "08012345678",
    last_visit: "1 July 2026",
    next_appointment: "15 July 2026",
    notes: "Child immunisation, second dose. No allergies.",
  },
  {
    name: "Alhaji Rasak",
    phone: "08098765432",
    last_visit: "2 July 2026",
    next_appointment: "10 July 2026",
    notes: "Hypertensive, prescribed Amlodipine 5mg.",
  },
];

export const initialClinics: Clinic[] = [
  {
    name: "Adeoyo Maternity Hospital",
    area: "Ring Road",
    address: "Ring Road, Ibadan",
    phone: "02-1234567",
    emergency_phone: "07030000001",
    services: "General Outpatient, Maternity, Emergency",
  },
  {
    name: "University College Hospital (UCH)",
    area: "Bodija",
    address: "Queen Elizabeth Road, Ibadan",
    phone: "02-2345678",
    emergency_phone: "07030000002",
    services: "General Outpatient, Maternity, Emergency, Paediatrics, Surgery",
  },
  {
    name: "Jericho Specialist Hospital",
    area: "Jericho",
    address: "Jericho, Ibadan",
    phone: "02-3456789",
    emergency_phone: "07030000003",
    services: "General Outpatient, Emergency",
  },
  {
    name: "Oyo State General Hospital",
    area: "Ogbomoso",
    address: "Ogbomoso, Oyo State",
    phone: "02-4567890",
    emergency_phone: "07030000004",
    services: "General Outpatient, Maternity, Emergency",
  },
  {
    name: "Ring Road State Hospital",
    area: "Ring Road",
    address: "Ring Road, Ibadan",
    phone: "02-5678901",
    emergency_phone: "07030000005",
    services: "General Outpatient, Emergency, Paediatrics",
  },
];
