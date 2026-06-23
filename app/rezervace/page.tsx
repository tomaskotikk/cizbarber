import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import BookingFlow from "@/app/rezervace/booking-flow";

const fallbackServices = [
  {
    id: "haircut",
    name: "Pánský střih",
    description: "Konzultace, přesný střih nůžkami i strojkem, mytí a finální styling.",
    price_czk: 600,
    duration_minutes: 45,
  },
  {
    id: "beard",
    name: "Vousy rituál",
    description: "Tvarování vousů, kontury břitvou, teplý ručník a ošetření pokožky.",
    price_czk: 450,
    duration_minutes: 35,
  },
  {
    id: "combo",
    name: "Střih + vousy",
    description: "Kompletní servis pro vlasy i vousy s čistým finišem a stylingem.",
    price_czk: 820,
    duration_minutes: 75,
  },
];

export default async function ReservationPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [servicesResult, slotsResult] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).order("price_czk"),
    supabase
      .from("availability_slots")
      .select("*")
      .eq("is_available", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(120),
  ]);

  return (
    <BookingFlow
      initialServices={servicesResult.data?.length ? servicesResult.data : fallbackServices}
      initialSlots={slotsResult.data ?? []}
    />
  );
}
