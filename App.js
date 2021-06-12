import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createAppContainer,} from 'react-navigation';
import { createBottomTabNavigator } from "react-navigation-tabs";
import TransactionScreen from './screens/TransactionScreen';
import SearchScreen from './screens/SearchScreen';

export default class App extends React.Component {
  render(){
  return (
    <Appcontainer />
  );
  }
}

var tabNavigator = createBottomTabNavigator({
  Transaction:TransactionScreen,
  search:SearchScreen ,
})
const Appcontainer = createAppContainer(tabNavigator)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
