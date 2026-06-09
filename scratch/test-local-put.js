async function main() {
  const url = "http://localhost:9002/api/tours/40ff1f57-5149-4588-871b-ca4675c87fee";
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        price: 50000,
        priceHemat: 45000 
      })
    });
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
main();
