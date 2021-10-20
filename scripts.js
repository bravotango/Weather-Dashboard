$(document).ready(function () {
  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5"; // My OpenWeather.org API key

  let destination; // most recent session search destination

  let invalidSearchEl = $("#invalidSearch"); // element: show error
  let currentEl = $("#current"); // element: current conditions element
  let forecastEl = $("#forecast"); // element: forecast element
  let accordionToggleEl = $("#accordion h3"); // element: searched destinations collapse toggle

  let searchedDestinations = getLocalStorage(); // get searched cities from local storage

  if (!searchedDestinations) {
    searchedDestinations = [];
    accordionToggleEl.css("display", "none");
  } else {
    printSearchedNav();
    addAccordion();
  }

  function resetPage() {
    invalidSearchEl.html("");
    currentEl.html("").css("display", "none");
    forecastEl.html("").css("display", "none");
  }

  function getLocalStorage() {
    let localStorageCities = JSON.parse(localStorage.getItem("searchedDestinations"));
    return localStorageCities;
  }

  function setLocalStorage(data) {
    destination = data.name;
    if (!searchedDestinations.find((c) => c === destination)) {
      searchedDestinations.push(destination);
    }
    localStorage.setItem("searchedDestinations", JSON.stringify(searchedDestinations));
    addAccordion();
  }

  function printSearchedNav() {
    let searchedDestinationsEl = $("#searchedDestinations");
    searchedDestinationsEl.html("");
    searchedDestinations.forEach((destination) => {
      let li = $("<li class='list-group-item'>");
      let a = $("<a href='#' class='destination'>");
      a.text(destination);
      li.append(a);
      searchedDestinationsEl.append(li);
    });
  }

  function getLongLat(destination) {
    resetPage();
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${destination}&appid=${APIKey}`;
    fetch(URL)
      .then(function (response) {
        if (response.status !== 200) {
          throw new Error(notResponse200(response));
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
          throw new Error(notResponse200(response));
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

  function notResponse200(response) {
    return `Request responded with status <i>'${response.status}'</i>`;
  }

  // populate #current with data
  function setCurrentWeather(data) {
    const current = data.current;

    // create HTML elements & populate with data
    let spanDestinationEl = $("<span class='destination'>").text(destination);
    let spanTimeEl = $("<span>").text(moment.unix(current.dt).format("MMMM Do YYYY, h:mm:ss a"));
    let spanHumidityEl = $("<span>").text(getHumidity(current.humidity));
    let spanWindSpeedEl = $("<span>").text(`${getWindSpeed(current.wind_speed)} ${getWindDirection(current.wind_deg)}`);
    let spanTempEl = $("<span class='temp'>").html(`${current.temp.toFixed(0)}&#176;`);
    let spanDescriptionEl = $("<span class='description'>").html(current.weather[0].main);
    let spanHiLoEl = $("<span class='hiLo'>").html(
      `${data.daily[0].temp.max.toFixed(0)}&#176;/${data.daily[0].temp.min.toFixed(0)}&#176;`
    );
    let spanIconEl = $("<span class='icon'>").html(getWeatherIcon(current.weather[0].icon));
    let spanUviEl = $("<span class='uvi mt-2'>").html(getUviHtml(current.uvi));
    let leftRightContainer = $('<span id="display">');
    let leftEl = $('<span class="left">');
    let rightEl = $('<span class="right">');

    // append the elements to the DOM
    leftEl.append(spanTempEl).append(spanHiLoEl).append(spanIconEl).append(spanDescriptionEl);
    rightEl.append(spanHumidityEl).append(spanWindSpeedEl).append(spanUviEl);
    leftRightContainer.append(leftEl).append(rightEl);

    currentEl.append(spanDestinationEl).append(spanTimeEl).append(leftRightContainer);

    // show current conditions if data is populated
    if (data) {
      currentEl.css("display", "flex");
    }
  }

  // populate #forecast with data
  function setForecastWeather(data) {
    let currentDay = moment.unix(data.current.dt).format("MMMM Do YYYY");
    let firstForecastDay = moment.unix(data.daily[0].dt).format("MMMM Do YYYY");
    // only grab the next five days for forecast
    daily = currentDay !== firstForecastDay ? data.daily.slice(2, 7) : data.daily.slice(1, 6);

    // forEach day in daily array, create a day container with data
    daily.forEach((day) => {
      // append day elements & data for each forecast day
      let divEl = $("<div>")
        .append($("<span class='date bg-primary'>").text(unixToDate(day.dt, "ddd D")))
        .append($("<span class='hi'>").html(`${day.temp.max.toFixed(0)}&#176;`))
        .append($("<span class='lo'>").html(`${day.temp.min.toFixed(0)}&#176;`))
        .append($("<span class='icon'>").html(getWeatherIcon(day.weather[0].icon)))
        .append($("<span class='humidity'>").text(getHumidity(day.humidity)))
        .append(
          $("<span class='windSpeed'>").html(`${getWindSpeed(day.wind_speed)} ${getWindDirection(day.wind_deg)}`)
        );
      // append day container to DOM
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
    return moment().format(format) === moment.unix(unix).format(format) ? "Today" : moment.unix(unix).format(format);
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
  function addAccordion() {
    accordionToggleEl.css("display", "block");
    $(".jumbotron").css("padding", "0");
    $("#accordion").accordion({
      active: false, // collapse the menu
      collapsible: true,
      heightStyle: "content", // size accordion to inner content
    });
  }

  // on click of searched destination - lets call getLongLat for that city
  $(document).on("click", ".destination", function (e) {
    destination = e.currentTarget.innerText;
    getLongLat(destination);
  });
});
