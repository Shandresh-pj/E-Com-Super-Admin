import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './App';

// Enable native hardware-accelerated screen containers (unlocks 90/120/144Hz native refresh)
enableScreens(true);

AppRegistry.registerComponent('main', () => App);
