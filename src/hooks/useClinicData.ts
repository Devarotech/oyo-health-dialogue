import { useState, useEffect } from "react";
import { QueueItem, Patient, Clinic } from "../lib/types";
import { initialPatients, initialClinics } from "../lib/initialData";

const STORAGE_KEYS = {
  QUEUE: "oyoclinic_queue",
  PATIENTS: "oyoclinic_patients",
  CLINICS: "oyoclinic_clinics",
};

export function useClinicData() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    const storedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
    const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    const storedClinics = localStorage.getItem(STORAGE_KEYS.CLINICS);

    if (storedQueue) setQueue(JSON.parse(storedQueue));
    
    if (storedPatients) {
      setPatients(JSON.parse(storedPatients));
    } else {
      setPatients(initialPatients);
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(initialPatients));
    }

    if (storedClinics) {
      setClinics(JSON.parse(storedClinics));
    } else {
      setClinics(initialClinics);
      localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(initialClinics));
    }
  }, []);

  const saveQueue = (newQueue: QueueItem[]) => {
    setQueue(newQueue);
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(newQueue));
  };

  const savePatients = (newPatients: Patient[]) => {
    setPatients(newPatients);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
  };

  const addToQueue = (name: string) => {
    const nextTicket = queue.length > 0 ? Math.max(...queue.map(q => q.ticket_number)) + 1 : 1;
    const newItem: QueueItem = {
      ticket_number: nextTicket,
      patient_name: name,
      status: "Waiting",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const newQueue = [...queue, newItem];
    saveQueue(newQueue);
    return newItem;
  };

  const callNext = () => {
    const waitingItems = queue.filter(q => q.status === "Waiting").sort((a, b) => a.ticket_number - b.ticket_number);
    if (waitingItems.length === 0) return null;

    const nextItem = waitingItems[0];
    const newQueue = queue.map(q => {
      if (q.status === "With Doctor") return { ...q, status: "Done" as const };
      if (q.ticket_number === nextItem.ticket_number) return { ...q, status: "With Doctor" as const };
      return q;
    });
    saveQueue(newQueue);
    return nextItem;
  };

  const updatePatientNotes = (name: string, newNote: string) => {
    const newPatients = patients.map(p => {
      if (p.name.toLowerCase() === name.toLowerCase()) {
        return { ...p, notes: p.notes + " " + newNote };
      }
      return p;
    });
    savePatients(newPatients);
  };

  return {
    queue,
    patients,
    clinics,
    addToQueue,
    callNext,
    updatePatientNotes,
  };
}
