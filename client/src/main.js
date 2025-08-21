const responseDiv = document.getElementById("content");

document.querySelector("form").addEventListener("submit", sendChatRequest);

async function sendChatRequest(event) {
  event.preventDefault();
  const userPrompt = event.target.seriesName.value;
  const response = await fetch("http://localhost:8080/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userPrompt }),
  });
  const data = await response.json();
  console.log(data);
  responseDiv.textContent = data;
}
