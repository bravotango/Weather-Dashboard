$(document).ready(function () {
  let destination; // current destination
  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5"; // OpenWeather.org API key
  let invalidSearchEl = $("#invalidSearch"); // show error element
  let currentEl = $("#current"); // current conditions element
  let forecastEl = $("#forecast"); // forecast element
  let searchedCities = getLocalStorage(); // get searched cities from local storage

  if (!searchedCities) {
    searchedCities = [];
  } else {
    printSearchedNav();
  }

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
    destination = data.name;
    if (!searchedCities.find((c) => c === destination)) {
      searchedCities.push(destination);
    }
    localStorage.setItem("searchedCities", JSON.stringify(searchedCities));
  }

  function printSearchedNav() {
    let searchedCitiesEl = $("#searchedCities");
    searchedCitiesEl.html("");
    searchedCities.forEach((destination) => {
      let li = $("<li class='list-group-item'>");
      let a = $("<a href='#' class='destination'>");
      a.text(destination);
      li.append(a);
      searchedCitiesEl.append(li);
    });
  }

  function getLongLat(destination) {
    resetPage();
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${APIKey}`;
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
    let spanDestinationEl = $("<span class='destination'>");
    let spanTimeEl = $("<span>");
    let spanHumidityEl = $("<span>");
    let spanWindSpeedEl = $("<span>");
    let spanTempEl = $("<span class='temp'>");
    let spanDescriptionEl = $("<span class='description'>");
    let spanHiLoEl = $("<span class='hiLo'>");
    let spanIconEl = $("<span class='icon'>");
    let spanUviEl = $("<span class='uvi mt-2'>");
    let leftRightContainer = $('<span id="display">');
    let leftEl = $('<span class="left">');
    let rightEl = $('<span class="right">');

    // grab the data for current day
    let time = moment.unix(current.dt).format("MMMM Do YYYY, h:mm:ss a");
    let humidity = getHumidity(current.humidity);
    let temp = `${current.temp.toFixed(0)}&#176;`;
    let description = current.weather[0].main;
    let hiLo = `${data.daily[0].temp.max.toFixed(
      0
    )}&#176;/${data.daily[0].temp.min.toFixed(0)}&#176;`;
    let windSpeed = `${getWindSpeed(current.wind_speed)} ${getWindDirection(
      current.wind_deg
    )}`;
    let icon = getWeatherIcon(current.weather[0].icon);
    let uvi = getUviHtml(current.uvi);

    // add data to html elements
    spanDestinationEl.text(destination);
    spanTimeEl.text(time);
    spanTempEl.html(temp);
    spanDescriptionEl.html(description);
    spanIconEl.html(icon);
    spanHiLoEl.html(hiLo);
    spanHumidityEl.text(humidity);
    spanWindSpeedEl.text(windSpeed);
    spanUviEl.html(uvi);

    // append the elements to the DOM
    leftEl
      .append(spanTempEl)
      .append(spanHiLoEl)
      .append(spanIconEl)
      .append(spanDescriptionEl);
    rightEl.append(spanHumidityEl).append(spanWindSpeedEl).append(spanUviEl);
    leftRightContainer.append(leftEl).append(rightEl);

    currentEl
      .append(spanDestinationEl)
      .append(spanTimeEl)
      .append(leftRightContainer);
    // show current conditions if data is populated
    if (data) {
      currentEl.css("display", "flex");
    }
  }

  // populate forecast containers with data
  function setForecastWeather(data) {
    let currentDay = moment.unix(data.current.dt).format("MMMM Do YYYY");
    let firstForecastDay = moment.unix(data.daily[0].dt).format("MMMM Do YYYY");
    // only grab the next five days for forecast
    daily =
      currentDay !== firstForecastDay
        ? data.daily.slice(2, 7)
        : data.daily.slice(1, 6);

    // forEach day in daily array, create a day container with data
    daily.forEach((day) => {
      // create day elements for each forecast day
      let divEl = $("<div>");
      let spanDateEl = $("<span class='date bg-primary'>");
      let spanHiEl = $("<span class='hi'>");
      let spanLoEl = $("<span class='lo'>");
      let spanIconEl = $("<span class='icon'>");
      let spanHumidityEl = $("<span class='humidity'>");
      let spanWindSpeedEl = $("<span class='windSpeed'>");

      // grab the data for forecast day
      let date = unixToDate(day.dt, "ddd D");
      let hi = `${day.temp.max.toFixed(0)}&#176;`;
      let lo = `${day.temp.min.toFixed(0)}&#176;`;
      let icon = getWeatherIcon(day.weather[0].icon);
      let humidity = getHumidity(day.humidity);
      let windSpeed = `${getWindSpeed(day.wind_speed)} ${getWindDirection(
        day.wind_deg
      )}`;

      // add data to forecast day element
      spanDateEl.text(date);
      spanHiEl.html(hi);
      spanLoEl.html(lo);
      spanIconEl.html(icon);
      spanHumidityEl.text(humidity);
      spanWindSpeedEl.text(windSpeed);

      // append elements to DOM
      divEl
        .append(spanDateEl)
        .append(spanHiEl)
        .append(spanLoEl)
        .append(spanIconEl)
        .append(spanHumidityEl)
        .append(spanWindSpeedEl);

      forecastEl.append(divEl);
    });
    // display the forecast container
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
    return `<span class='${className} p-2'>UV Index: ${uvi}</span>`;
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
  function getWindDirection(direction) {
    let d = direction;

    if (d <= 90) {
      return "NW";
    } else if (d <= 180) {
      return "SW";
    } else if (d <= 270) {
      return "SE";
    } else if (d <= 360) {
      return "NE";
    }
    return "";
  }

  // destination search form submitted
  $("form").on("submit", function (e) {
    e.preventDefault();
    getLongLat(e.target[0].value);
  });

  // accordion used to help with mobile screens, so main content can be viewed
  $(function () {
    $("#accordion").accordion({
      active: false,
      collapsible: true,
    });
  });

  // on click of searched destination - lets call getLongLat for that city
  $(document).on("click", ".destination", function (e) {
    destination = e.currentTarget.innerText;
    getLongLat(destination);
  });
});
