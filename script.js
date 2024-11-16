const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');

const apiKey = 'r42R2BO1iovDNkxvse7wq6kCVYGGbyvw';

// Nav Bar

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
} else {
    document.getElementById("current-location").textContent = "Geolocation not supported";
}

function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;


    fetch(`https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${latitude},${longitude}`)
        .then(response => response.json())
        .then(locationData => {
            const locationKey = locationData.Key;
            const cityName = locationData.LocalizedName;

            document.getElementById("current-location").textContent = cityName;

            
            return fetch(`https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}`);
        })
        .then(response => response.json())
        .then(weatherData => {
            const temperature = weatherData[0].Temperature.Metric.Value;
            const condition = weatherData[0].WeatherText;

            
            document.getElementById("current-weather").textContent = `${temperature}°C, ${condition}`;
        })
        .catch(() => {
            document.getElementById("current-location").textContent = "Location unavailable";
        });
}

function error() {
    document.getElementById("current-location").textContent = "Location permission denied";
}


searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

async function getLocationKey(city) {
    const apiUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${city}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.length > 0 ? data[0].Key : null;
}

async function getWeatherData(locationKey) {
    const apiUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${apiKey}&details=true`;
    const response = await fetch(apiUrl);
    return response.json();
}

async function getForecastData(locationKey) {
    const apiUrl = `http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${apiKey}&metric=true`;
    const response = await fetch(apiUrl);
    return response.json();
}

function getWeaatherIcon(id) {
    if (id <= 2) return 'thunderstorm.svg';
    if (id <= 5) return 'drizzle.svg';
    if (id <= 10) return 'rain.svg';
    if (id <= 16) return 'snow.svg';
    if (id <= 22) return 'atmosphere.svg';
    if (id === 23) return 'clear.svg';
    else return 'clouds.svg';
}

function getCurrentDate() {
    const currentDate = new Date();
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    };
    return currentDate.toLocaleDateString('en-GB', options);
}

async function updateWeatherInfo(city) {
    const locationKey = await getLocationKey(city);

    if (!locationKey) {
        showDisplaySection(notFoundSection);
        return;
    }

    const weatherData = await getWeatherData(locationKey);

    if (!weatherData || weatherData.length === 0) {
        showDisplaySection(notFoundSection);
        return;
    }
    console.log(weatherData)

    const {
        WeatherText: mainCondition,
        Temperature: { Metric: { Value: temp } },
        RelativeHumidity: humidity,
        Wind: { Speed: { Metric: { Value: windSpeed } = {} } = {} } = {} // Use optional chaining here
    } = weatherData[0];

    countryTxt.textContent = city;
    tempTxt.textContent = Math.round(temp) + ' °C';
    conditionTxt.textContent = mainCondition;
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = (windSpeed || 'N/A') + ' km/h'; // Fallback to 'N/A' if wind speed is missing

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `assets/weather/${getWeaatherIcon(weatherData[0].WeatherIcon)}`;

    await updateForecastsInfo(locationKey);
    showDisplaySection(weatherInfoSection);
}

async function updateForecastsInfo(locationKey) {
    const forecastsData = await getForecastData(locationKey);

    forecastItemsContainer.innerHTML = '';
    forecastsData.DailyForecasts.forEach(forecast => {
        updateForecastItems(forecast);
    });
}

function updateForecastItems(forecast) {
    const {
        Date: date,
        Day: { Icon },
        Temperature: { Maximum: { Value: maxTemp } }
    } = forecast;

    const dateTaken = new Date(date);
    const dateOption = {
        day: '2-digit',
        month: 'short'
    };
    const dateResult = dateTaken.toLocaleDateString('en-GB', dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeaatherIcon(Icon)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(maxTemp)} °C</h5>
        </div>
    `;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(section => section.style.display = 'none');

    section.style.display = 'flex';
}
