import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import BookingFlow from "@/app/rezervace/booking-flow";

const fallbackServices = [
  {
    id: "haircut",
    name: "Střih",
    description: "Klasický pánský střih s konzultací, precizním zpracováním a finálním stylingem.",
    price_czk: 550,
    duration_minutes: 45,
  },
  {
    id: "beard",
    name: "Vousy",
    description: "Úprava a tvarování vousů, čisté kontury a závěrečná péče o pokožku.",
    price_czk: 450,
    duration_minutes: 35,
  },
  {
    id: "kids",
    name: "Dětský střih",
    description: "Střih pro mladší klienty v klidném tempu a s jednoduchým stylingem.",
    price_czk: 400,
    duration_minutes: 35,
  },
  {
    id: "combo",
    name: "Střih + vousy Hot Towel",
    description: "Kompletní servis vlasů a vousů včetně hot towel péče s napařkou.",
    price_czk: 850,
    duration_minutes: 75,
  },
];

const serviceOrder = ["Střih", "Vousy", "Dětský střih", "Střih + vousy Hot Towel"];

function normalizeServices<T extends { name: string; description: string; price_czk: number; duration_minutes: number }>(services: T[]) {
  return services.flatMap((service) => {
    if (service.name === "Skin fade") return [];

    if (service.name === "Pánský střih") {
      return [{
        ...service,
        name: "Střih",
        description: "Klasický pánský střih s konzultací, precizním zpracováním a finálním stylingem.",
        price_czk: 550,
        duration_minutes: 45,
      }];
    }

    if (service.name === "Vousy rituál") {
      return [{
        ...service,
        name: "Vousy",
        description: "Úprava a tvarování vousů, čisté kontury a závěrečná péče o pokožku.",
        price_czk: 450,
        duration_minutes: 35,
      }];
    }

    if (service.name === "Střih + vousy") {
      return [{
        ...service,
        name: "Střih + vousy Hot Towel",
        description: "Kompletní servis vlasů a vousů včetně hot towel péče s napařkou.",
        price_czk: 850,
        duration_minutes: 75,
      }];
    }

    return [service];
  });
}

function sortServices<T extends { name: string }>(services: T[]) {
  return [...services].sort((a, b) => {
    const aIndex = serviceOrder.indexOf(a.name);
    const bIndex = serviceOrder.indexOf(b.name);
    return (aIndex === -1 ? serviceOrder.length : aIndex) - (bIndex === -1 ? serviceOrder.length : bIndex);
  });
}

export default async function ReservationPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [servicesResult, slotsResult, barbersResult] = await Promise.all([
    supabase.from("services").select("*").eq("is_active", true).order("price_czk"),
    supabase
      .from("availability_slots")
      .select("*, users:barber_user_id(id,full_name,email,phone,profile_image_url)")
      .eq("is_available", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(120),
    supabase
      .from("users")
      .select("id,full_name,email,phone,profile_image_url")
      .eq("is_active", true)
      .order("created_at"),
  ]);

  return (
    <BookingFlow
      initialServices={sortServices(normalizeServices(servicesResult.data?.length ? servicesResult.data : fallbackServices))}
      initialSlots={slotsResult.data ?? []}
      initialBarbers={barbersResult.data ?? []}
    />
  );
}
