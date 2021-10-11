$(document).ready(function () {
  let city = "seattle";
  const APIKey = "44c329c1fb39cc90b982fb588f6a68c5";
  const queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${APIKey}`;
  let kelvinTemp;
  let kelvinTempMax;
  let kelvinTempMin;
  let fahrenheit;
  let fahrenheitMax;
  let fahrenheitMin;
  let weatherDescription;
  let weatherMain;
  let weatherImg;

  let timer;

  timer = setInterval(function () {
    if (city) {
      getWeather();
    }
  }, 3600000); // refresh current data each hour

  let weatherIconEl = $("#weatherIcon");
  let cityEl = $("#city");
  let fahrenheitEl = $("#fahrenheit");

  function getWeather() {
    fetch(queryURL)
      .then(function (response) {
        //   console.log(response.type);
        //   console.log(response.url);
        //   console.log(response.useFinalURL);
        console.log(response.status);
        //   console.log(response.ok);
        //   console.log(response.statusText);
        //   console.log(response.headers);
        if (!response.ok) {
          throw new Error("HTTP error, status = " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        console.log(data);
        getWeatherStats(data);
      });
  }

  $("#accordion").accordion({
    collapsible: true,
  });

  function getWeatherStats(data) {
    // temperatures (converted to fahrenheit)
    kelvinTemp = data.main.temp;
    kelvinTempMax = data.main.temp_max;
    kelvinTempMin = data.main.temp_min;
    fahrenheit = kelvinToFahrenheit(kelvinTemp);
    fahrenheitMax = kelvinToFahrenheit(kelvinTempMax);
    f = kelvinToFahrenheit(kelvinTempMin);

    const weather = data.weather[0];
    weatherDescription = weather.description;
    weatherMain = weather.main;

    weatherImg = getWeatherIcon(weather.icon);

    $("#weatherIcon").append(weatherImg);

    setViewValues(data);

    console.log(
      fahrenheit,
      fahrenheitMax,
      fahrenheitMin,
      weatherDescription,
      weatherMain,
      weather.icon,
      convertUnixToUnderstandableTime()
      // 1633789192
    );
  }

  function convertUnixToUnderstandableTime() {
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

  function setViewValues(d) {
    //weather.icon
    cityEl.text(d.name);
    fahrenheitEl.text(kelvinToFahrenheit(d.main.temp));
    fahrenheitEl.append(" ° ");
  }
  getWeather();
});
