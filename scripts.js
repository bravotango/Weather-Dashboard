$(document).ready(function () {
  let city;
  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5";

  let searchedCities = getLocalStorage();
  if (!searchedCities) {
    searchedCities = [];
  }

  let humidity;
  let windSpeed;
  let weatherDescription;
  let weatherMain;
  let weatherImg;

  let weatherIconEl = $("#weatherIcon");
  let cityEl = $("#city");
  let fahrenheitEl = $("#fahrenheit");
  let windSpeedEl = $("#windSpeed");
  let humidityEl = $("#humidity");
  let weatherMainEl = $("#weatherMain");
  let weatherDescriptionEl = $("#weatherDescription");
  let cityNavEl = $("nav ul");

  //   setInterval(function () {
  //     city ?? fetchData();
  //   }, 3600000); // refresh current data each hour

  function fetchData() {
    fetchAPI("weather");
    fetchAPI("forecast");
  }

  function getLocalStorage() {
    let localStorageCities = JSON.parse(localStorage.getItem("searchedCities"));
    return localStorageCities;
  }

  function setLocalStorage() {
    searchedCities.find((c) => c === city) ?? searchedCities.push(city);
    localStorage.setItem("searchedCities", JSON.stringify(searchedCities));
    for (let i = 0; i < searchedCities.length; i++) {
      cityNavEl.append(searchedCities[i]);
    }
  }

  function fetchAPI(name) {
    const apiName = name.trim().toLowerCase();
    const URL = `https://api.openweathermap.org/data/2.5/${apiName}?q=${city}&appid=${APIKey}`;

    fetch(URL)
      .then(function (response) {
        if (response.status === 404) {
          handle404();

          return;
        }
        if (!response.ok) {
          throw new Error("HTTP error, status = " + response.status);
        }
        setLocalStorage();
        return response.json();
      })
      .then(function (data) {
        // TODO: make for both
        apiName === "weather" ?? getWeatherStats(data), setWeatherStats(data);
      });
  }
  function handle404() {
    $("#invalidSearch").text("Weather destination not found");
  }

  function setWeatherStats(data) {
    if (!data) {
      return;
    }
    console.log("main", data);
    let dayIndex = 0;
    setWeatherValues(data, dayIndex);
    setViewElValues(data);
  }

  function setWeatherValues(main, i) {
    setTemperatures(main);

    if (!main.list) {
      const weather = main.weather[0];
      weatherDescription = weather.description;
      weatherMain = weather.main;

      weatherImg = getWeatherIcon(weather.icon);
      humidity = main.humidity;
      windSpeed = main.wind.speed;
    }
  }

  function setTemperatures(main) {
    let kelvinTemp = main.temp;
    let kelvinTempMax = main.temp_max;
    let kelvinTempMin = main.temp_min;

    fahrenheit = kelvinToFahrenheit(kelvinTemp);
    fahrenheitMax = kelvinToFahrenheit(kelvinTempMax);
    fahrenheitMin = kelvinToFahrenheit(kelvinTempMin);
  }
  function convertUnixToUnderstandableTime() {
    // TODO: create conversion
    return "5AM";
  }

  function kelvinToFahrenheit(kelvinTemp) {
    const fahrenheit = 1.8 * (kelvinTemp - 273) + 32;
    return fahrenheit.toFixed(0);
  }

  function getWeatherIcon(iconCode) {
    let iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;
    let img = $("<img>").attr("src", iconUrl);
    return img;
  }

  function setViewElValues(d) {
    //weather.icon
    cityEl.text(d.name);

    weatherIconEl.html("").append(weatherImg);

    if (!d.list) {
      fahrenheitEl.text(kelvinToFahrenheit(d.main.temp));
      fahrenheitEl.append(" ° ");
      humidityEl.html("").append(humidity);
      windSpeedEl.html("").append(windSpeed);

      weatherMainEl.html("").append(weatherMain);
      weatherDescriptionEl.html("").append(weatherDescription);
    } else {
      console.log("list length", d.list.length);
      for (let i = 0; i < 5; i++) {
        // TODO: make a card with this info 'd.list[i]'
        let li = $("<li>").text(d.list[i].wind.gust);
        $("ol").append(li);
      }
    }
  }

  $("form").on("submit", function (e) {
    e.preventDefault();
    console.log($("#citySearch").val());

    // set city
    city = e.target[0].value;
    fetchData();
  });

  //   $("#accordion").accordion({
  //     collapsible: true,
  //   });
});
