import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { UserRole, OrganizerStackParamList, SellerStackParamList, BuyerStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';

// Organizer screens
import CreateEventScreen from '../screens/organizer/CreateEventScreen';
import ManageEventScreen from '../screens/organizer/ManageEventScreen';
import ParticipantsListScreen from '../screens/organizer/ParticipantsListScreen';

// Seller screens
import JoinEventScreen from '../screens/seller/JoinEventScreen';
import AddAddressScreen from '../screens/seller/AddAddressScreen';
import MyItemsScreen from '../screens/seller/MyItemsScreen';
import AddItemScreen from '../screens/seller/AddItemScreen';

// Buyer screens
import BrowseEventsScreen from '../screens/buyer/BrowseEventsScreen';
import EventDetailsScreen from '../screens/buyer/EventDetailsScreen';
import { EventMapScreen } from '../screens/buyer/EventMapScreen';
import SellerDetailsScreen from '../screens/buyer/SellerDetailsScreen';

const Tab = createBottomTabNavigator();
const OrganizerStack = createStackNavigator<OrganizerStackParamList>();
const SellerStack = createStackNavigator<SellerStackParamList>();
const BuyerStack = createStackNavigator<BuyerStackParamList>();

function OrganizerNavigator() {
  return (
    <OrganizerStack.Navigator>
      <OrganizerStack.Screen
        name="ManageEvent"
        component={ManageEventScreen}
        options={{ title: 'My Events' }}
      />
      <OrganizerStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Create Event' }}
      />
      <OrganizerStack.Screen
        name="ParticipantsList"
        component={ParticipantsListScreen}
        options={{ title: 'Participants' }}
      />
    </OrganizerStack.Navigator>
  );
}

function SellerNavigator() {
  return (
    <SellerStack.Navigator>
      <SellerStack.Screen
        name="JoinEvent"
        component={JoinEventScreen}
        options={{ title: 'Join Event' }}
      />
      <SellerStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: 'Add Address' }}
      />
      <SellerStack.Screen
        name="MyItems"
        component={MyItemsScreen}
        options={{ title: 'My Items' }}
      />
      <SellerStack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: 'Add Item' }}
      />
    </SellerStack.Navigator>
  );
}

function BuyerNavigator() {
  return (
    <BuyerStack.Navigator>
      <BuyerStack.Screen
        name="BrowseEvents"
        component={BrowseEventsScreen}
        options={{ title: 'Browse Events' }}
      />
      <BuyerStack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Event Details' }}
      />
      <BuyerStack.Screen
        name="EventMap"
        component={EventMapScreen}
        options={{ title: 'Event Map' }}
      />
      <BuyerStack.Screen
        name="SellerDetails"
        component={SellerDetailsScreen}
        options={{ title: 'Seller Details' }}
      />
    </BuyerStack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Show different tabs based on user role
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user.role === UserRole.ORGANIZER && (
        <Tab.Screen
          name="OrganizerTab"
          component={OrganizerNavigator}
          options={{ title: 'Events' }}
        />
      )}

      {user.role === UserRole.SELLER && (
        <Tab.Screen
          name="SellerTab"
          component={SellerNavigator}
          options={{ title: 'Sell' }}
        />
      )}

      {user.role === UserRole.BUYER && (
        <Tab.Screen
          name="BuyerTab"
          component={BuyerNavigator}
          options={{ title: 'Browse' }}
        />
      )}
    </Tab.Navigator>
  );
}
