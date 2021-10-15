$(document).ready(function () {
  let city;
  let longitude;
  let latitude;
  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5";
  let invalidSearchEl = $("#invalidSearch");
  let currentEl = $("#current");
  let forecastEl = $("#forecast");

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
  let cityNavEl = $("nav ul#searchedCities");

  //   setInterval(function () {
  //     city ?? fetchData();
  //   }, 3600000); // refresh current data each hour

  function resetPage() {
    invalidSearchEl.html("");
    currentEl.html("");
    forecastEl.html("");
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

  function getLongLat(city) {
    resetPage();
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}`;
    fetch(URL)
      .then(function (response) {
        if (response.status !== 200) {
          throw new Error(
            `Bad Request. Request responded with: ${response.status}`
          );
        }
        setLocalStorage();
        return response.json();
      })
      .then(function (data) {
        console.log(data.coord.lat);
        latitude = data.coord.lat;
        longitude = data.coord.lon;
        fetchOneCallAPI(latitude, longitude);
      })
      .catch(function (err) {
        handleError(err);
      });
  }

  function fetchOneCallAPI(lat, lon) {
    const URL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&appid=${APIKey}&units=imperial`;
    fetch(URL)
      .then(function (response) {
        if (response.status === 404) {
          handle404();
          return;
        }
        return response.json();
      })
      .then(function (data) {
        console.log("fetchOneCallAPI", data);
        // TODO create function to populate DOM
        setCurrentWeather(data.current);
        setForecastWeather(data.daily);
      });
  }

  function setCurrentWeather(current) {
    let spanSunriseEl = $("<span>");
    let spanSunsetEl = $("<span>");
    let spanTimeEl = $("<span>");
    let spanHumidityEl = $("<span>");
    let spanWindSpeedEl = $("<span>");
    let spanTempEl = $("<span>");
    let spanIconEl = $("<span>");
    let spanUviEl = $("<span>");
    let spanWindEl = $("<span>");

    let sunrise = moment.unix(current.sunrise).format("h:mm a");
    let sunset = moment.unix(current.sunset).format("h:mm a");
    let time = moment.unix(current.dt).format("MMMM Do YYYY, h:mm:ss a");
    let humidity = `${current.humidity}%`;
    let temp = `${current.temp.toFixed(0)}&#176;`;
    let windSpeed = `${current.wind_speed} MPH`;
    let icon = getWeatherIcon(current.weather[0].icon);
    let uvi = current.uvi;
    let wind = {
      deg: current.wind_deg,
      speed: current.wind_speed,
      gust: current.wind_gust,
    };
    let w = current.weather[0];
    let weather = {
      description: w.description,
      icon: getWeatherIcon(w.icon),
      main: w.main,
    };

    spanTimeEl.text(time);
    spanTempEl.html(temp);
    spanIconEl.html(icon);
    spanHumidityEl.text(humidity);
    spanWindSpeedEl.text(windSpeed);

    currentEl
      .append(spanTimeEl)
      .append(spanTempEl)
      .append(spanIconEl)
      .append(spanHumidityEl)
      .append(spanWindSpeedEl);
  }

  function setForecastWeather(daily) {
    daily = daily.slice(1, 6); // just need 5 day forecast

    daily.forEach((day) => {
      let divEl = $("<div>");
      let spanDateEl = $("<span class='date'>");
      let spanHiEl = $("<span class='hi'>");
      let spanLoEl = $("<span class='lo'>");
      let spanIconEl = $("<span class='icon'>");
      let spanHumidityEl = $("<span class='humidity'>");
      let spanWindSpeedEl = $("<span class='windSpeed'>");

      let date = unixToDate(day.dt, "ddd D");
      let hi = `${day.temp.max.toFixed(0)}&#176;`;
      let lo = `${day.temp.min.toFixed(0)}&#176;`;
      let icon = getWeatherIcon(day.weather[0].icon);
      let humidity = `Humidity ${day.humidity} %`;
      let windSpeed = `Wind: ${day.wind_speed} MPH`;

      spanDateEl.text(date);
      spanHiEl.html(hi);
      spanLoEl.html(lo);
      spanIconEl.html(icon);
      spanHumidityEl.text(humidity);
      spanWindSpeedEl.text(windSpeed);

      divEl
        .append(spanDateEl)
        .append(spanHiEl)
        .append(spanLoEl)
        .append(spanIconEl)
        .append(spanHumidityEl)
        .append(spanWindSpeedEl);

      forecastEl.append(divEl);
    });
  }

  function unixToDate(unix, format) {
    return moment().format(format) === moment.unix(unix).format(format)
      ? "Today"
      : moment.unix(unix).format(format);
  }

  function handleError(e) {
    invalidSearchEl.html(`<div class="alert alert-danger">${e}</div>`);
  }

  function getWeatherIcon(iconCode) {
    let iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;
    let img = $("<img>").attr("src", iconUrl);
    return img;
  }

  function getWindDirection(wind) {
    let d = wind.deg;

    if (d <= 90) {
      return "NW";
    } else if (d <= 180) {
      return "SW";
    } else if (d <= 270) {
      return "SE";
    } else if (d <= 360) {
      return "NE";
    }

    return undefined;
  }

  $("form").on("submit", function (e) {
    e.preventDefault();
    console.log($("#citySearch").val());

    // set city
    city = e.target[0].value;

    getLongLat(city);
    //fetchData();
  });

  function makeAccordion() {
    $("#forecast").accordion({
      collapsible: true,
      heightStyle: "content",
    });
  }

  $("#test").accordion({
    collapsible: true,
  });
});
