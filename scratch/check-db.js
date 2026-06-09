async function main() {
  const url = "https://gdodwetdaxitgnctelrq.supabase.co/rest/v1/tours?select=id,name,price,price_hemat";
  const apiKey = "";

  try {
    const response = await fetch(url, {
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`
      }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
main();
