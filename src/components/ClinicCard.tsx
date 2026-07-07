import { Patient, Language } from "../lib/types";
import { translations } from "../lib/translations";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { User, Calendar, ClipboardList, Info } from "lucide-react";

interface ClinicCardProps {
  patient: Patient;
  lang: Language;
}

export function ClinicCard({ patient, lang }: ClinicCardProps) {
  const t = translations[lang];
  
  return (
    <Card className="w-full max-w-sm mx-auto border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="text-center bg-primary text-primary-foreground py-4">
        <CardTitle className="text-lg font-bold tracking-tight uppercase">{t.health_card_title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 px-4">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
          <User className="w-5 h-5 text-primary" />
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">{t.name}</span>
            <span className="font-bold text-foreground">{patient.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">{t.last_visit}</span>
            <span className="text-foreground">{patient.last_visit}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-semibold text-muted-foreground">{t.next_appointment}</span>
            <span className="font-semibold text-primary">{patient.next_appointment}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <ClipboardList className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-muted-foreground block mb-1">{t.doctor_notes}</span>
            <p className="text-sm text-foreground leading-relaxed bg-primary/5 p-2 rounded-md">
              {patient.notes}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-3 flex gap-2 items-start">
        <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-tight italic">
          {t.health_card_footer}
        </p>
      </CardFooter>
    </Card>
  );
}
