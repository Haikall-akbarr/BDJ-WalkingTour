async function main() {
  const url = "https://gdodwetdaxitgnctelrq.supabase.co/rest/v1/tours?id=eq.40ff1f57-5149-4588-871b-ca4675c87fee";
  const apiKey = "";

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ price_hemat: 45000 })
    });
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
main();
