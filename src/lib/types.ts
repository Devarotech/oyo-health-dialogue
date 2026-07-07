export type QueueStatus = "Waiting" | "With Doctor" | "Done";

export interface QueueItem {
  ticket_number: number;
  patient_name: string;
  status: QueueStatus;
  timestamp: string;
}

export interface Patient {
  name: string;
  phone: string;
  last_visit: string;
  next_appointment: string;
  notes: string;
}

export interface Clinic {
  name: string;
  area: string;
  address: string;
  phone: string;
  emergency_phone: string;
  services: string;
}

export type Language = "en" | "yo";

export interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "card" | "clinic-list" | "status";
  data?: any;
}
