import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { UserRole, OrganizerStackParamList, SellerStackParamList, BuyerStackParamList, MapStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import { AuthButton } from '../components/common/AuthButton';
import { theme } from '../styles/theme';

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
import { AllEventsMapScreen } from '../screens/buyer/AllEventsMapScreen';
import SellerDetailsScreen from '../screens/buyer/SellerDetailsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const OrganizerStack = createStackNavigator<OrganizerStackParamList>();
const SellerStack = createStackNavigator<SellerStackParamList>();
const BuyerStack = createStackNavigator<BuyerStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();

function OrganizerNavigator() {
  return (
    <OrganizerStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <OrganizerStack.Screen
        name="ManageEvent"
        component={ManageEventScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <OrganizerStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Skapa loppmarknad' }}
      />
      <OrganizerStack.Screen
        name="ParticipantsList"
        component={ParticipantsListScreen}
        options={{ title: 'Säljare' }}
      />
    </OrganizerStack.Navigator>
  );
}

function SellerNavigator() {
  return (
    <SellerStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
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
    <BuyerStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <BuyerStack.Screen
        name="BrowseEvents"
        component={BrowseEventsScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <BuyerStack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <BuyerStack.Screen
        name="EventMap"
        component={EventMapScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <BuyerStack.Screen
        name="SellerDetails"
        component={SellerDetailsScreen}
        options={{ title: 'Loppis Rundan' }}
      />
    </BuyerStack.Navigator>
  );
}

function MapNavigator() {
  return (
    <MapStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <MapStack.Screen
        name="AllEventsMap"
        component={AllEventsMapScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <MapStack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <MapStack.Screen
        name="EventMap"
        component={EventMapScreen}
        options={{ title: 'Loppis Rundan' }}
      />
      <MapStack.Screen
        name="SellerDetails"
        component={SellerDetailsScreen}
        options={{ title: 'Loppis Rundan' }}
      />
    </MapStack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when user changes
  useEffect(() => {
    console.log(' User changed in MainNavigator:', user ? `${user.displayName} (${user.role})` : 'null');
    setForceUpdate(prev => prev + 1);
  }, [user]);

  console.log(' MainNavigator rendering, user:', user ? `${user.displayName} (${user.role})` : 'null', 'forceUpdate:', forceUpdate);

  // Determine initial route based on user state
  const getInitialRoute = () => {
    if (!user) return 'BuyerTab'; // Default to browse for non-logged-in users
    if (user.role === UserRole.ORGANIZER) return 'OrganizerTab';
    if (user.role === UserRole.SELLER) return 'SellerTab';
    return 'BuyerTab';
  };

  // Create screens array based on user state
  const screens = [];

  // Home tab (Browse) - always visible
  screens.push(
    <Tab.Screen
      key="BuyerTab"
      name="BuyerTab"
      component={BuyerNavigator}
      options={{ title: 'Hem' }}
    />
  );

  // Map tab - always visible
  screens.push(
    <Tab.Screen
      key="MapTab"
      name="MapTab"
      component={MapNavigator}
      options={{ title: 'Karta' }}
    />
  );

  // Organizer tab - only if user is logged in as organizer
  if (user?.role === UserRole.ORGANIZER) {
    screens.push(
      <Tab.Screen
        key="OrganizerTab"
        name="OrganizerTab"
        component={OrganizerNavigator}
        options={{ title: 'Min Loppis' }}
      />
    );
  }

  // Seller tab - only if user is logged in as seller
  if (user?.role === UserRole.SELLER) {
    screens.push(
      <Tab.Screen
        key="SellerTab"
        name="SellerTab"
        component={SellerNavigator}
        options={{ title: 'Sälj' }}
      />
    );
  }

  // Auth tab - shown when not logged in
  if (!user) {
    screens.push(
      <Tab.Screen
        key="AuthTab"
        name="AuthTab"
        component={AuthNavigator}
        options={{ title: 'Konto' }}
      />
    );
  }

  const initialRoute = getInitialRoute();
  console.log('Initial route will be:', initialRoute);

  // Always show browse tab, conditionally show others based on user role
  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
      }}
    >
      {screens}
    </Tab.Navigator>
  );
}
