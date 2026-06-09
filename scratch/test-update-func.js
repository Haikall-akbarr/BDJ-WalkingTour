import { updateTour, getTourById } from "./src/lib/supabase-store.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  try {
    const id = "40ff1f57-5149-4588-871b-ca4675c87fee";
    console.log("Before:", await getTourById(id));
    const result = await updateTour(id, { priceHemat: 42000 });
    console.log("After update:", result);
  } catch (err) {
    console.error(err);
  }
}
main();
