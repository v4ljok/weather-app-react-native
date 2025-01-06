import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '97e009cf1007dac517fe1b7ba4841b52';

interface Weather {
  dt: number;
  main: {
    temp: number;
    temp_max: number;
    temp_min: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
}

interface WeatherData {
  city: {
    name: string;
  };
  list: Weather[];
}

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Narva');
  const [isCelsius, setIsCelsius] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('city');
      const savedIsCelsius = await AsyncStorage.getItem('isCelsius');
      if (savedCity) setCity(savedCity);
      if (savedIsCelsius !== null) setIsCelsius(JSON.parse(savedIsCelsius));
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('city', city);
      await AsyncStorage.setItem('isCelsius', JSON.stringify(isCelsius));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };  

  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
      );
      if (!response.ok) {
        setError('Invalid city name. Please try again.');
        return;
      }
      const data: WeatherData = await response.json();
      setWeather(data);
      setError(null);
      await saveSettings();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Unable to fetch weather data. Please try again later.');
    }
  };  

  useEffect(() => {
    loadSettings();
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      fetchWeather();
    }
  }, [city, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }  

  const getBackgroundImage = (): string => {
    if (!weather) return '';

    const weatherCondition = weather.list[0].weather[0].main;

    switch (weatherCondition) {
      case 'Clear':
        return 'https://www.nordicexperience.com/wp-content/uploads/2018/03/AdobeStock_105794017-1024x683.jpeg';
      case 'Clouds':
        return 'https://images.unsplash.com/photo-1498085245356-7c3cda3b412f?q=80&w=1267&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
      case 'Rain':
        return 'https://eesti-mesi.ee/wp-content/uploads/2024/01/DALL%C2%B7E-2024-02-26-15.58.53-A-rainy-February-scene-in-Estonia-showcasing-a-gloomy-and-overcast-sky-with-steady-rain-falling-over-an-urban-setting.-The-streets-are-wet-and-reflec.webp';
      case 'Snow':
        return 'https://www.anadventurousworld.com/wp-content/uploads/2022/09/tallinn-in-winter.jpg';
      case 'Thunderstorm':
        return 'https://img.atlasobscura.com/jL0gEhZKHLwd48O0a4OayWvQPp8Hu4xmjNhugU-VmZo/rs:fill:12000:12000/q:81/sm:1/scp:1/ar:1/aHR0cHM6Ly9hdGxh/cy1kZXYuczMuYW1h/em9uYXdzLmNvbS8y/MDE5LzAzLzI1LzE2/LzE3LzAyL2M2YjU3/NWI0LWZlNTAtNDJj/YS1iZTdhLWNmMWU1/MGMzYWM4Mi9SZWxh/bXBvU3RpbGxzXzAy/LmpwZw.jpg';
      default:
        return 'https://www.nordicexperience.com/wp-content/uploads/2018/03/AdobeStock_105794017-1024x683.jpeg';
    }
  };

  const convertTemperature = (temp: number) => {
    return isCelsius ? temp : temp * 1.8 + 32;
  };

  return (
    <ImageBackground
      source={{ uri: getBackgroundImage() }}
      style={styles.backgroundImage}
    >
      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter city"
            placeholderTextColor="#aaa"
            value={city}
            onChangeText={setCity}
          />
          <TouchableOpacity onPress={fetchWeather} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              setIsCelsius(!isCelsius);
              saveSettings();
            }}
          >
            <Text style={styles.settingsText}>
              {isCelsius ? 'Switch to °F' : 'Switch to °C'}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : weather ? (
          <>

            <View style={styles.currentWeather}>
              <Text style={styles.cityName}>{weather.city.name}</Text>
              <Text style={styles.temperature}>
                {Math.round(convertTemperature(weather.list[0].main.temp))}°
                {isCelsius ? 'C' : 'F'}
              </Text>

              <Text style={styles.description}>
                {weather.list[0].weather[0].description}
              </Text>
            </View>

            <View style={styles.hourlyForecast}>
              <Text style={styles.sectionTitle}>Hourly forecast</Text>
              <FlatList
                horizontal
                data={weather.list.slice(0, 8)}
                renderItem={({ item }) => (
                  <View style={styles.hourItem}>
                    <Text style={styles.hour}>
                      {new Date(item.dt * 1000).getHours()}:00
                    </Text>
                    <Image
                      style={[
                        styles.weatherIcon,
                        item.weather[0].main === 'Snow' && { tintColor: 'white' },
                      ]}
                      source={{
                        uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                      }}
                    />
                    <Text style={styles.hourTemp}>
                      {Math.round(convertTemperature(item.main.temp))}°
                    </Text>

                  </View>
                )}
                keyExtractor={(item) => item.dt.toString()}
              />
            </View>

          <View style={styles.dailyForecast}>
            <Text style={styles.sectionTitle}>6-day forecast</Text>
            {weather.list
              .filter((item, index, array) => {
                const currentDate = new Date(item.dt * 1000).getDate();
                const previousDate =
                  index > 0 ? new Date(array[index - 1].dt * 1000).getDate() : null;
                return currentDate !== previousDate;
              })
              .map((item, index) => (
                <View style={styles.dailyItem} key={index}>
                  <Text style={styles.dailyDate}>
                    {new Date(item.dt * 1000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Image
                    style={[
                      styles.weatherIcon,
                      item.weather[0].main === 'Snow' && { tintColor: 'white' },
                    ]}
                    source={{
                      uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
                    }}
                  />
                  <Text style={styles.dailyTemp}>
                    {Math.round(convertTemperature(item.main.temp_max))}° / {Math.round(convertTemperature(item.main.temp_min))}°
                  </Text>

                </View>
              ))}
          </View>
          </>
        ) : (
          <Text style={styles.loadingText}>Loading...</Text>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    marginTop: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    color: '#fff',
    backgroundColor: '#1e1e1e',
  },
  searchButton: {
    marginTop: 10,
    marginLeft: 10,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cityName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 18,
    color: '#aaa',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 10,
  },
  hourlyForecast: {
    marginBottom: 20,
  },
  hourItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  hour: {
    fontSize: 16,
    color: '#aaa',
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  hourTemp: {
    fontSize: 18,
    color: '#fff',
  },
  dailyForecast: {
    marginBottom: 20,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  dailyDate: {
    fontSize: 16,
    color: '#aaa',
  },
  dailyTemp: {
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
  },
  settingsButton: {
    marginTop: 10,
    marginLeft: 10,
    alignSelf: 'center',
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 5,
  },
  settingsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },  
});

export default App;