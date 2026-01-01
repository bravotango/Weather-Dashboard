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
    let localStorageCities = JSON.parse(
      localStorage.getItem("searchedDestinations")
    );
    return localStorageCities;
  }

  function setLocalStorage(data) {
    console.log({ data });
    destination = data.city.name;
    if (!searchedDestinations.find((c) => c === destination)) {
      searchedDestinations.push(destination);
    }
    localStorage.setItem(
      "searchedDestinations",
      JSON.stringify(searchedDestinations)
    );
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

  function fetchWeatherByCity(destination) {
    resetPage();

    const URL = `https://api.openweathermap.org/data/2.5/forecast?q=${destination}&appid=${APIKey}&units=imperial`;

    fetch(URL)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(notResponse200(response));
        }
        return response.json();
      })
      .then((data) => {
        setLocalStorage(data);
        setCurrentWeather(data);
        setForecastWeather(data);
        printSearchedNav();
      })
      .catch((err) => {
        handleError(err);
      });
  }

  function notResponse200(response) {
    return `Request responded with status <i>'${response.status}'</i>`;
  }

  function setCurrentWeather(data) {
    const now = data.list[0]; // closest forecast to current time

    // Group forecasts and grab today
    const groupedDays = groupForecastByDay(data.list);
    const todayData = groupedDays[0];
    const todaySummary = summarizeDay(todayData);

    // Elements
    let spanDestinationEl = $("<span class='destination'>").text(destination);
    let spanDayNameEl = $("<span class='dayName'>").text(todaySummary.dayName); // Monday, Tuesday...
    let spanTimeEl = $("<span class='time'>").text(
      moment.unix(now.dt).format("MMMM Do YYYY, h:mm a")
    );

    let spanTempEl = $("<span class='temp'>").html(
      `${now.main.temp.toFixed(0)}&#176;`
    );
    let spanHiLoEl = $("<span class='hiLo'>").html(
      `${todaySummary.high.toFixed(0)}&#176; / ${todaySummary.low.toFixed(
        0
      )}&#176;`
    );
    let spanDescriptionEl = $("<span class='description'>").text(
      `${now.weather[0].main}: ${now.weather[0].description}`
    );
    let spanIconEl = $("<span class='icon'>").html(
      getWeatherIcon(todaySummary.icon)
    );

    let spanHumidityEl = $("<span class='stat'>").text(
      `Humidity: ${todaySummary.humidity}%`
    );
    let spanWindEl = $("<span class='stat'>").text(
      `Wind: ${todaySummary.windSpeed.toFixed(1)} MPH ${
        todaySummary.windDirection
      }`
    );
    let spanCloudEl = $("<span class='stat'>").text(
      `Cloud Cover: ${todaySummary.cloudCover}%`
    );

    // Layout
    let leftRightContainer = $('<span id="display">');
    let leftEl = $('<span class="left">');
    let rightEl = $('<span class="right">');

    // Left: temp, hi/lo, icon, description
    leftEl
      .append(spanTempEl)
      .append(spanHiLoEl)
      .append(spanIconEl)
      .append(spanDescriptionEl);

    // Right: stats
    rightEl.append(spanHumidityEl).append(spanWindEl).append(spanCloudEl);

    leftRightContainer.append(leftEl).append(rightEl);

    // Append all to #current
    currentEl
      .html("") // clear any previous
      .append(spanDestinationEl)
      .append(spanDayNameEl)
      .append(spanTimeEl)
      .append(leftRightContainer)
      .css("display", "flex");
  }

  // UPDATED FORECAST
  function groupForecastByDay(list) {
    console.log({ list });
    const days = {};

    list.forEach((item) => {
      const day = moment.unix(item.dt).format("YYYY-MM-DD");

      if (!days[day]) {
        days[day] = [];
      }

      days[day].push(item);
    });
    console.log({ days });

    return Object.values(days).slice(0, 5); // next 5 days
  }

  // populate #forecast with data
  function setForecastWeather(data) {
    const dailyForecast = groupForecastByDay(data.list);
    dailyForecast.forEach((day) => {
      const summary = summarizeDay(day);

      forecastEl.append(
        $("<div>")
          .append($("<span class='header'>").text(summary.date))
          .append($("<span>").html(`${summary.high.toFixed(0)}°`))
          .append($("<span>").html(`${summary.low.toFixed(0)}°`))
          .append(
            $("<img>").attr(
              "src",
              `https://openweathermap.org/img/wn/${summary.icon}@2x.png`
            )
          )
      );
      // display the forecast container
      forecastEl.css("display", "flex");
    });
  }
  function average(numbers) {
    if (!numbers.length) return 0;
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    return sum / numbers.length;
  }

  function mostCommon(arr) {
    const map = {};
    arr.forEach((item) => (map[item] = (map[item] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0][0];
  }
  function dominantWindDirection(degreesArray) {
    if (!degreesArray.length) return "";

    // Convert degrees into compass buckets
    const directions = degreesArray.map(degToCompass);

    // Count occurrences
    const counts = directions.reduce((acc, dir) => {
      acc[dir] = (acc[dir] || 0) + 1;
      return acc;
    }, {});

    // Return the most frequent direction
    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }

  function degToCompass(num) {
    const val = Math.floor(num / 22.5 + 0.5);
    const arr = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    return arr[val % 16];
  }

  function summarizeDay(dayData) {
    const temps = dayData.map((d) => d.main.temp);
    const feelsLike = dayData.map((d) => d.main.feels_like);
    const icons = dayData.map((d) => d.weather[0].icon);
    const descriptions = dayData.map((d) => d.weather[0].description);
    const windSpeeds = dayData.map((d) => d.wind.speed);
    const windDirs = dayData.map((d) => d.wind.deg);
    const humidity = dayData.map((d) => d.main.humidity);
    const clouds = dayData.map((d) => d.clouds.all);
    const precipChance = dayData.map((d) => d.pop || 0);

    const rainTotal = dayData.reduce(
      (sum, d) => sum + (d.rain?.["3h"] || 0),
      0
    );
    const snowTotal = dayData.reduce(
      (sum, d) => sum + (d.snow?.["3h"] || 0),
      0
    );

    const dateMoment = moment.unix(dayData[0].dt);

    return {
      dayName: dateMoment.format("dddd"),
      date: dateMoment.format("ddd D"),
      isWeekend: dateMoment.day() === 0 || dateMoment.day() === 6,

      high: Math.max(...temps),
      low: Math.min(...temps),

      feelsLikeHigh: Math.max(...feelsLike),
      feelsLikeLow: Math.min(...feelsLike),

      icon: icons[Math.floor(icons.length / 2)],
      description: mostCommon(descriptions),

      windSpeed: average(windSpeeds),
      windDirection: dominantWindDirection(windDirs),

      humidity: Math.round(average(humidity)),
      cloudCover: Math.round(average(clouds)),

      precipChance: Math.round(Math.max(...precipChance) * 100),
      rainTotal: rainTotal,
      snowTotal: snowTotal,
    };
  }

  function handleError(e) {
    invalidSearchEl.html(`<div class="alert alert-danger">${e}</div>`);
  }

  function getWeatherIcon(iconCode) {
    let iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    let img = $("<img>").attr("src", iconUrl);
    return img;
  }

  // destination search form submitted
  $("form").on("submit", function (e) {
    e.preventDefault();
    fetchWeatherByCity(e.target[0].value);
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
    fetchWeatherByCity(destination);
  });
});
