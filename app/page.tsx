import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import HomeClient from "@/app/home-client";

const fallbackServices = [
  { id: "haircut", name: "Pánský střih", description: "Konzultace, přesný střih nůžkami i strojkem, mytí a finální styling.", price_czk: 600, duration_minutes: 45 },
  { id: "fade", name: "Skin fade", description: "Precizní přechod do ztracena, čisté kontury, mytí a styling.", price_czk: 650, duration_minutes: 50 },
  { id: "beard", name: "Vousy rituál", description: "Tvarování vousů, kontury břitvou, teplý ručník a ošetření pokožky.", price_czk: 450, duration_minutes: 35 },
  { id: "combo", name: "Střih + vousy", description: "Kompletní servis pro vlasy i vousy s čistým finišem a stylingem.", price_czk: 820, duration_minutes: 75 },
  { id: "kids", name: "Dětský střih", description: "Střih pro mladší klienty v klidném tempu a s jednoduchým stylingem.", price_czk: 400, duration_minutes: 35 },
];

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const servicesResult = await supabase.from("services").select("*").eq("is_active", true).order("price_czk");
  return <HomeClient initialServices={servicesResult.data?.length ? servicesResult.data : fallbackServices} />;
}
