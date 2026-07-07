import { Language, QueueItem, Patient, Clinic } from "./types";
import { translations } from "./translations";

export function detectLanguage(input: string): Language | null {
  const yorubaWords = ["ekaabo", "bawo", "nibo", "ipo", "iwe", "dokita", "oogun", "mu", "pajawiri", "ile iwosan", "kini", "se", "mama", "baba"];
  const lowerInput = input.toLowerCase();
  if (yorubaWords.some(word => lowerInput.includes(word))) {
    return "yo";
  }
  return null;
}

export function processInput(
  input: string,
  lang: Language,
  context: {
    queue: QueueItem[];
    patients: Patient[];
    clinics: Clinic[];
    addToQueue: (name: string) => QueueItem;
    callNext: () => QueueItem | null;
    updatePatientNotes: (name: string, note: string) => void;
  }
): { response: string; newLang?: Language; type?: string; data?: any } {
  const lowerInput = input.toLowerCase();
  const t = translations[lang];

  // 1. Language Switch Check (Direct requests)
  if (lowerInput === "yoruba" || lowerInput === "in yoruba") {
    return { response: translations.yo.welcome, newLang: "yo" };
  }
  if (lowerInput === "english" || lowerInput === "in english") {
    return { response: translations.en.welcome, newLang: "en" };
  }

  // Language Detection (Contextual)
  const detected = detectLanguage(input);
  if (detected && detected !== lang) {
    // If user speaks Yoruba, switch but answer the query if possible or just welcome
    return { response: translations[detected].welcome, newLang: detected };
  }

  // 2. New Patient Check-in
  if (["new patient", "get ticket", "register patient", "i want to see doctor", "forukosile", "gba ticket", "fe ri dokita"].some(p => lowerInput.includes(p))) {
    return { response: t.ask_name, type: "waiting_for_name" };
  }

  // 3. Call Next Patient
  if (["next patient", "call next", "doctor ready", "dokita ti setan", "alaisan miiran"].some(p => lowerInput.includes(p))) {
    const next = context.callNext();
    if (!next) return { response: t.no_waiting };
    return { 
      response: t.now_serving
        .replace("{ticket}", next.ticket_number.toString())
        .replace("{name}", next.patient_name)
    };
  }

  // 4. Queue Status Query
  if (["where am i", "queue", "how many people", "nibo ni ipo mi wa", "number lo wa lowo dokita", "ipo mi"].some(p => lowerInput.includes(p))) {
    return { response: t.ask_ticket, type: "waiting_for_ticket_query" };
  }

  // 5. Health Record Lookup / Clinic Card
  if (["show my record", "next appointment", "check my health", "iwe ilera mi", "kaadi ilera mi", "health card", "summary", "akopo"].some(p => lowerInput.includes(p))) {
    return { response: t.ask_name, type: "waiting_for_record_name" };
  }

  // 6. Nearby Hospital Finder / Emergency
  if (["find clinic", "hospital in", "close", "emergency", "pajawiri", "ile iwosan", "nibo", "ibi ti o sunmo"].some(p => lowerInput.includes(p))) {
    if (["emergency", "pajawiri", "ambulance", "help fast", "sos", "pajawiri"].some(p => lowerInput.includes(p))) {
       // Check if area is mentioned
       const areas = ["bodija", "dugbe", "ring road", "ogbomoso", "jericho"];
       const areaFound = areas.find(a => lowerInput.includes(a));
       if (areaFound) {
         const clinic = context.clinics.find(c => c.area.toLowerCase().includes(areaFound));
         if (clinic) {
           return { 
             response: t.emergency_info.replace("{phone}", clinic.emergency_phone)
           };
         }
       }
       return { 
         response: t.emergency_info.replace("{phone}", t.emergency_line)
       };
    }
    return { response: t.ask_area, type: "waiting_for_area" };
  }

  // 7. Drug Reminder
  if (["medicine", "drugs", "oogun", "mu", "did i take"].some(p => lowerInput.includes(p))) {
    return { response: t.ask_name, type: "waiting_for_drug_name" };
  }

  return { response: t.fallback };
}
