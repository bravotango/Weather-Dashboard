$(document).ready(function () {
  let city;
  let longitude;
  let latitude;
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
  let cityNavEl = $("nav ul#searchedCities");

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
    cityNavEl.html("");
    for (let i = 0; i < searchedCities.length; i++) {
      cityNavEl.append(searchedCities[i]);
    }
  }

  function getLongLat(city) {
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}`;
    fetch(URL)
      .then(function (response) {
        if (response.status === 404) {
          handle404();
          return;
        }
        return response.json();
      })
      .then(function (data) {
        console.log(data.coord.lat);
        latitude = data.coord.lat;
        longitude = data.coord.lon;

        fetchOneCallAPI(latitude, longitude);
        fetchAPI("weather");
        fetchAPI("forecast");
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
      });
  }

  function fetchAPI(name) {
    const URL = `https://api.openweathermap.org/data/2.5/${name}?q=${city}&appid=${APIKey}`;

    fetch(URL)
      .then(function (response) {
        if (response.status === 404) {
          handle404();
          return;
        }
        return response.json();
      })
      .then(function (data) {
        setLocalStorage();
        setWeatherStats(data);
      });
  }

  function handle404() {
    $("#invalidSearch").text("Weather destination not found");
  }

  function setWeatherStats(data) {
    if (!data) {
      return;
    }
    setWeatherValues(data);
    setViewElValues(data);
  }

  function setWeatherValues(main) {
    if (!main.list) {
      const weather = main.weather[0];
      weatherDescription = weather.description;
      weatherMain = weather.main;

      weatherImg = getWeatherIcon(weather.icon);
      humidity = main.humidity;
      windSpeed = main.wind.speed;
    }
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
    cityEl.text(d.name);
    let forecast = $("#forecast");
    weatherIconEl.html("").append(weatherImg);

    if (!d.list) {
      fahrenheitEl.text(kelvinToFahrenheit(d.main.temp));
      fahrenheitEl.append(" ° ");
      humidityEl.html("").append(humidity);
      windSpeedEl.html("").append(windSpeed);

      weatherMainEl.html("").append(weatherMain);
      weatherDescriptionEl.html("").append(weatherDescription);
    } else {
      let currentDay;

      for (let i = 0; i < d.list.length; i++) {
        let p = $("<p>");
        if (i === 0) {
          var div = $("<div>");
        }
        let list = d.list[i];
        let weather = list.weather[0];
        let day = moment(list.dt_txt).format("dddd, MMMM D");

        if (day !== currentDay) {
          if (currentDay) {
            forecast.append(div);
            var div = $("<div>");
          }
          currentDay = day;
          let h3 = $("<h3>");
          h3.text(day);
          forecast.append(h3);
        }

        let hour = moment(list.dt_txt).format("h:mm a");
        let fahrenheit = kelvinToFahrenheit(list.main.temp);
        let humidity = list.main.humidity;
        let icon = getWeatherIcon(weather.icon);
        let description = weather.main;

        let spanHour = $("<span>").text(hour);
        let spanTemp = $("<span>").text(fahrenheit).append(" ° ");
        let spanIcon = $("<span>").html(icon);
        let spanDescription = $("<span>").text(description);
        let spanHumidity = $("<span>").text(humidity);
        p.append(spanHour)
          .append(spanTemp)
          .append(spanIcon)
          .append(spanDescription)
          .append(spanHumidity);

        div.append(p);
        if (i === d.list.length - 1) {
          forecast.append(div);
        }
      }

      makeAccordion();
    }
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
