const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const message = document.getElementById("message");
const dashboard = document.getElementById("dashboard");

// Weather descriptions and professional icon types
function getWeatherInfo(code) {
    const weatherTypes = {
        0: ["Clear sky", "sun"],
        1: ["Mainly clear", "partly"],
        2: ["Partly cloudy", "partly"],
        3: ["Overcast", "cloud"],
        45: ["Foggy", "fog"],
        48: ["Depositing rime fog", "fog"],
        51: ["Light drizzle", "drizzle"],
        53: ["Moderate drizzle", "drizzle"],
        55: ["Dense drizzle", "rain"],
        56: ["Light freezing drizzle", "drizzle"],
        57: ["Dense freezing drizzle", "rain"],
        61: ["Slight rain", "rain"],
        63: ["Moderate rain", "rain"],
        65: ["Heavy rain", "rain"],
        66: ["Light freezing rain", "rain"],
        67: ["Heavy freezing rain", "rain"],
        71: ["Slight snowfall", "snow"],
        73: ["Moderate snowfall", "snow"],
        75: ["Heavy snowfall", "snow"],
        77: ["Snow grains", "snow"],
        80: ["Slight rain showers", "rain"],
        81: ["Moderate rain showers", "rain"],
        82: ["Violent rain showers", "storm"],
        85: ["Slight snow showers", "snow"],
        86: ["Heavy snow showers", "snow"],
        95: ["Thunderstorm", "storm"],
        96: ["Thunderstorm with hail", "storm"],
        99: ["Heavy thunderstorm with hail", "storm"]
    };

    return weatherTypes[code] || ["Weather unavailable", "cloud"];
}

// Professional SVG weather icons
function getWeatherIconMarkup(type) {
    const icons = {
        sun: `
            <circle cx="24" cy="24" r="8"/>
            <path d="M24 3v5 M24 40v5 M3 24h5 M40 24h5
            M9.2 9.2l3.5 3.5 M35.3 35.3l3.5 3.5
            M38.8 9.2l-3.5 3.5 M12.7 35.3l-3.5 3.5"/>
        `,
        partly: `
            <path d="M15 10V5 M5 15H1 M7 7l-3-3
            M23 15l3-3 M20 4l-2 4"/>
            <path d="M13 28a9 9 0 0 1 17-4
            h1a7 7 0 0 1 0 14H13a5 5 0 0 1 0-10z"/>
        `,
        cloud: `
            <path d="M12 36h23a8 8 0 0 0 0-16
            12 12 0 0 0-23-2 9 9 0 0 0 0 18z"/>
        `,
        fog: `
            <path d="M10 19h25a7 7 0 0 0 0-14
            11 11 0 0 0-21-1"/>
            <path d="M5 27h34 M9 35h26 M14 43h16"/>
        `,
        drizzle: `
            <path d="M12 28h23a7 7 0 0 0 0-14
            11 11 0 0 0-21-2 8 8 0 0 0-2 16z"/>
            <path d="M17 35l-2 4 M26 35l-2 4 M35 35l-2 4"/>
        `,
        rain: `
            <path d="M12 26h23a7 7 0 0 0 0-14
            11 11 0 0 0-21-2 8 8 0 0 0-2 16z"/>
            <path d="M16 33l-3 7 M25 33l-3 7 M34 33l-3 7"/>
        `,
        snow: `
            <path d="M12 24h23a7 7 0 0 0 0-14
            11 11 0 0 0-21-2 8 8 0 0 0-2 16z"/>
            <path d="M17 32v10 M13 34l8 6 M21 34l-8 6
            M33 32v10 M29 34l8 6 M37 34l-8 6"/>
        `,
        storm: `
            <path d="M12 25h23a7 7 0 0 0 0-14
            11 11 0 0 0-21-2 8 8 0 0 0-2 16z"/>
            <path d="M25 28l-7 11h7l-2 9 10-14h-7l3-6"/>
        `
    };

    const drawing = icons[type] || icons.cloud;

    return `
        <svg class="weather-symbol" viewBox="0 0 48 48"
             fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round" aria-hidden="true">
            ${drawing}
        </svg>
    `;
}

function getWindDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(degrees / 45) % 8];
}

function formatHour(time) {
    const hour = Number(time.slice(11, 13));
    const suffix = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12} ${suffix}`;
}

function formatDay(date, index) {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long"
    });
}

function formatTime(dateTime) {
    const time = dateTime.split("T")[1];
    const [hour, minute] = time.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";

    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

// Fetch weather information from Open-Meteo
async function getWeather(city) {
    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    message.textContent = "Retrieving weather information...";
    dashboard.classList.add("hidden");

    try {
        // Find city coordinates
        const geoURL = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoURL.search = new URLSearchParams({
            name: city,
            count: "1",
            language: "en",
            format: "json"
        });

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to connect to the location service.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please enter a valid city name.");
        }

        const location = geoData.results[0];

        // Request current weather, hourly and daily forecasts
        const weatherURL = new URL(
            "https://api.open-meteo.com/v1/forecast"
        );

        weatherURL.search = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,

            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m"
            ].join(","),

            hourly: [
                "temperature_2m",
                "precipitation_probability",
                "weather_code"
            ].join(","),

            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "uv_index_max"
            ].join(","),

            forecast_days: "7",
            timezone: "auto",
            wind_speed_unit: "kmh"
        });

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Unable to retrieve weather data. Please try again.");
        }

        const weatherData = await weatherResponse.json();

        if (!weatherData.current || !weatherData.hourly || !weatherData.daily) {
            throw new Error("Weather data is incomplete. Please try another city.");
        }

        displayCurrentWeather(location, weatherData);
        displayHourlyForecast(weatherData);
        displayDailyForecast(weatherData);

        dashboard.classList.remove("hidden");
        message.textContent =
            `Showing live weather information for ${location.name}.`;

    } catch (error) {
        message.textContent = error.message ||
            "Something went wrong. Please try again.";

        console.error("WeatherWise error:", error);

    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// Display current weather
function displayCurrentWeather(location, data) {
    const current = data.current;
    const weather = getWeatherInfo(current.weather_code);

    document.getElementById("city-name").textContent = location.name;

    document.getElementById("country-name").textContent =
        [location.admin1, location.country].filter(Boolean).join(", ");

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("weather-icon").innerHTML =
        getWeatherIconMarkup(weather[1]);

    document.getElementById("description").textContent = weather[0];

    document.getElementById("local-time").textContent =
        `Local time: ${current.time.replace("T", " ")}`;

    document.getElementById("feels-like").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind-speed").textContent =
        `${current.wind_speed_10m} km/h`;

    document.getElementById("wind-direction").textContent =
        getWindDirection(current.wind_direction_10m);

    document.getElementById("precipitation").textContent =
        `${current.precipitation} mm`;

    document.getElementById("uv-index").textContent =
        data.daily.uv_index_max[0];
}

// Display next six forecast hours
function displayHourlyForecast(data) {
    const container = document.getElementById("hourly-forecast");
    const hourly = data.hourly;

    container.replaceChildren();

    const currentTime = data.current.time;
    let startIndex = hourly.time.findIndex(time => time >= currentTime);

    if (startIndex === -1) startIndex = 0;

    const nextHours = hourly.time.slice(startIndex, startIndex + 6);

    nextHours.forEach((time, index) => {
        const dataIndex = startIndex + index;
        const weather = getWeatherInfo(hourly.weather_code[dataIndex]);

        const card = document.createElement("article");
        card.className = "hourly-card";

        const hourLabel = document.createElement("p");
        hourLabel.textContent = index === 0 ? "Now" : formatHour(time);

        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.innerHTML = getWeatherIconMarkup(weather[1]);

        const temperature = document.createElement("strong");
        temperature.textContent =
            `${Math.round(hourly.temperature_2m[dataIndex])}°C`;

        const rain = document.createElement("small");
        rain.textContent =
            `${hourly.precipitation_probability[dataIndex] ?? 0}% rain`;

        card.append(hourLabel, icon, temperature, rain);
        container.appendChild(card);
    });
}

// Display seven-day forecast
function displayDailyForecast(data) {
    const container = document.getElementById("daily-forecast");
    const daily = data.daily;

    container.replaceChildren();

    daily.time.forEach((date, index) => {
        const weather = getWeatherInfo(daily.weather_code[index]);

        const row = document.createElement("article");
        row.className = "daily-row";

        const day = document.createElement("span");
        day.className = "daily-day";
        day.textContent = formatDay(date, index);

        const condition = document.createElement("span");
        condition.className = "daily-condition";

        const icon = document.createElement("span");
        icon.innerHTML = getWeatherIconMarkup(weather[1]);

        const description = document.createElement("span");
        description.textContent = weather[0];

        condition.append(icon, description);

        const temperatures = document.createElement("span");
        temperatures.className = "daily-temps";

        const high = document.createElement("strong");
        high.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;

        const low = document.createElement("span");
        low.textContent = `${Math.round(daily.temperature_2m_min[index])}°`;

        temperatures.append(high, low);

        const sunTimes = document.createElement("span");
        sunTimes.className = "sun-times";
        sunTimes.textContent =
            `↑ ${formatTime(daily.sunrise[index])}  ↓ ${formatTime(daily.sunset[index])}`;

        row.append(day, condition, temperatures, sunTimes);
        container.appendChild(row);
    });
}

// Handle city search
form.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    getWeather(city);
});

// Load Chennai weather automatically when the page opens
getWeather("Chennai");