// Use a UUID for the unique ID for the user's data
const app_id = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// Function to handle the API call and display results
async function fetchSeriesInfo() {
  const seriesName = document.getElementById("seriesInput").value.trim();
  const resultsDiv = document.getElementById("results");
  const placeholder = document.getElementById("placeholder");
  const loading = document.getElementById("loading");
  const contentDiv = document.getElementById("content");
  const errorDiv = document.getElementById("error");

  // Hide previous content and show loading state
  placeholder.classList.add("hidden");
  contentDiv.classList.add("hidden");
  errorDiv.classList.add("hidden");
  loading.classList.remove("hidden");

  if (!seriesName) {
    loading.classList.add("hidden");
    errorDiv.classList.remove("hidden");
    errorDiv.innerText = "Please enter a TV show name.";
    return;
  }

  // Define the prompt to get a structured response
  const prompt = `Provide the return date and UK streaming service for the TV show "${seriesName}". Format the response as a JSON object with properties 'seriesTitle', 'returnDate', and 'ukStreamingService'. The 'returnDate' should be "Not yet announced" if it is unknown. The 'ukStreamingService' should be a single string containing the primary platform(s) (e.g., "Netflix", "BBC iPlayer", or "Disney+ and Hulu"). Do not include any other text or formatting.`;

  // API URL and key
  const GEMINI_API_KEY = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

  // Define the JSON schema for the response
  const responseSchema = {
    type: "OBJECT",
    properties: {
      seriesTitle: { type: "STRING" },
      returnDate: { type: "STRING" },
      ukStreamingService: { type: "STRING" },
    },
  };

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
  };

  let response;
  try {
    // Use exponential backoff for retries
    for (let i = 0; i < 3; i++) {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 429) {
        // 429 is Too Many Requests
        break;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const result = await response.json();

    // Extract the JSON string from the nested response
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      throw new Error(
        "Failed to retrieve data. The API response was empty or malformed."
      );
    }

    // Parse the JSON string
    const seriesData = JSON.parse(jsonText);

    // Check if the parsed data has the expected structure
    if (
      !seriesData ||
      !seriesData.seriesTitle ||
      !seriesData.returnDate ||
      !seriesData.ukStreamingService
    ) {
      throw new Error("Unexpected data format from the API.");
    }

    // Call the function to display the results
    showResults(
      seriesData.seriesTitle,
      seriesData.returnDate,
      seriesData.ukStreamingService
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    loading.classList.add("hidden");
    errorDiv.classList.remove("hidden");
    errorDiv.innerHTML = `Sorry, I couldn't find information for that TV show. Please try a different title.<br><br>Error: ${error.message}`;
  }
}

// Function to display the results in the UI
function showResults(title, returnDate, streamingService) {
  const loading = document.getElementById("loading");
  const contentDiv = document.getElementById("content");

  // Set content visibility and opacity
  loading.classList.add("hidden");
  contentDiv.classList.remove("hidden");

  // Create the HTML content
  contentDiv.innerHTML = `
        <div class="w-full text-center">
            <h2 class="text-2xl font-semibold mb-2 text-gray-700">${title}</h2>
            <p class="text-lg text-gray-600 mb-2">
                <span class="font-medium text-gray-800">Return Date:</span> ${returnDate}
            </p>
            <p class="text-lg text-gray-600">
                <span class="font-medium text-gray-800">Available in the UK on:</span> ${streamingService}
            </p>
        </div>
    `;

  // Fade in the content
  setTimeout(() => {
    contentDiv.classList.remove("opacity-0");
  }, 50);
}

// Event listeners for user interaction
document
  .getElementById("searchButton")
  .addEventListener("click", fetchSeriesInfo);
document
  .getElementById("seriesInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      fetchSeriesInfo();
    }
  });
