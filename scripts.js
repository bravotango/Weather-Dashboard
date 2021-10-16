$(document).ready(function () {
  let city;

  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5";
  let invalidSearchEl = $("#invalidSearch");
  let currentEl = $("#current");
  let forecastEl = $("#forecast");

  let searchedCities = getLocalStorage();

  if (!searchedCities) {
    searchedCities = [];
  } else {
    printSearchedNav();
  }

  //   setInterval(function () {
  //     city ?? fetchData();
  //   }, 3600000); // refresh current data each hour

  function resetPage() {
    invalidSearchEl.html("");
    currentEl.html("").css("display", "none");
    forecastEl.html("").css("display", "none");
  }
  function getLocalStorage() {
    let localStorageCities = JSON.parse(localStorage.getItem("searchedCities"));
    return localStorageCities;
  }

  function setLocalStorage(data) {
    city = data.name;
    if (!searchedCities.find((c) => c === city)) {
      searchedCities.push(city);
    }
    localStorage.setItem("searchedCities", JSON.stringify(searchedCities));
  }

  function printSearchedNav() {
    let searchedCitiesEl = $("#searchedCities");
    searchedCitiesEl.html("");
    searchedCities.forEach((city) => {
      let a = $("<a href='#' class='city btn btn-secondary'>");
      a.text(city);
      searchedCitiesEl.append(a);
    });
  }

  $(document).on("click", ".city", function (e) {
    city = e.currentTarget.innerText;
    getLongLat(city);
  });

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

        return response.json();
      })
      .then(function (data) {
        setLocalStorage(data);
        fetchOneCallAPI(data.coord.lat, data.coord.lon);
      })
      .catch(function (err) {
        handleError(err);
      });
  }

  function fetchOneCallAPI(lat, lon) {
    const URL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&appid=${APIKey}&units=imperial`;
    fetch(URL)
      .then(function (response) {
        if (response.status !== 200) {
          throw new Error(
            `Bad Request. Request responded with: ${response.status}`
          );
        }
        return response.json();
      })
      .then(function (data) {
        setCurrentWeather(data);
        setForecastWeather(data);
      })
      .catch(function (err) {
        handleError(err);
      });
    printSearchedNav();
  }

  function setCurrentWeather(data) {
    let current = data.current;

    // create HTML elements
    let spanCityEl = $("<span class='city'>");
    let spanSunriseEl = $("<span>");
    let spanSunsetEl = $("<span>");
    let spanTimeEl = $("<span>");
    let spanHumidityEl = $("<span>");
    let spanWindSpeedEl = $("<span>");
    let spanTempEl = $("<span class='temp'>");
    let spanDescriptionEl = $("<span class='description'>");
    let spanHiLoEl = $("<span class='hiLo'>");
    let spanIconEl = $("<span class='icon'>");
    let spanUviEl = $("<span class='uvi'>");
    let spanWindEl = $("<span>");

    let leftRightContainer = $('<span id="display">');
    let leftEl = $('<span class="left">');
    let rightEl = $('<span class="right">');

    let spanTempDescriptionEl = $("<span class='tempDescription'>");

    let sunrise = moment.unix(current.sunrise).format("h:mm a");
    let sunset = moment.unix(current.sunset).format("h:mm a");
    let time = moment.unix(current.dt).format("MMMM Do YYYY, h:mm:ss a");
    let humidity = getHumidity(current.humidity);
    let temp = `${current.temp.toFixed(0)}&#176;`;
    let description = current.weather[0].main;
    let hiLo = `${data.daily[0].temp.max.toFixed(
      0
    )}&#176;/${data.daily[0].temp.min.toFixed(0)}&#176;`;
    let windSpeed = getWindSpeed(current.wind_speed);
    let icon = getWeatherIcon(current.weather[0].icon);
    let uvi = getUviHtml(current.uvi);
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

    // add content to html elements
    spanCityEl.text(city);
    spanTimeEl.text(time);
    spanTempEl.html(temp);
    spanDescriptionEl.html(description);
    spanIconEl.html(icon);
    spanHiLoEl.html(hiLo);
    spanHumidityEl.text(humidity);
    spanWindSpeedEl.text(windSpeed);
    spanUviEl.html(uvi);

    leftEl
      .append(spanTempEl)
      .append(spanHiLoEl)
      .append(spanIconEl)
      .append(spanDescriptionEl);
    rightEl.append(spanHumidityEl).append(spanWindSpeedEl).append(spanUviEl);
    leftRightContainer.append(leftEl).append(rightEl);

    currentEl.append(spanCityEl).append(spanTimeEl).append(leftRightContainer);

    if (data) {
      currentEl.css("display", "flex");
    }
  }

  function setForecastWeather(data) {
    let currentDay = moment.unix(data.current.dt).format("MMMM Do YYYY");
    let firstForecastDay = moment.unix(data.daily[0].dt).format("MMMM Do YYYY");
    daily =
      currentDay !== firstForecastDay
        ? data.daily.slice(2, 7)
        : data.daily.slice(1, 6);

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
      let humidity = getHumidity(day.humidity);
      let windSpeed = getWindSpeed(day.wind_speed);

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
    forecastEl.css("display", "flex");
  }

  function getUviHtml(uvi) {
    className = "";
    if (uvi < 3) {
      className = "good";
    } else if (uvi > 3 && uvi < 6) {
      className = "moderate";
    } else if (uvi > 6 && uvi < 8) {
      className = "warning";
    } else {
      className = "danger";
    }
    return `<span class='${className}'>UV Index: ${uvi}</span>`;
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

  function getHumidity(humidity) {
    return `Humidity: ${humidity}%`;
  }

  function getWindSpeed(windSpeed) {
    return `Wind: ${windSpeed.toFixed(1)} MPH`;
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
    let formCityValue = e.target[0].value;

    getLongLat(formCityValue);
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
