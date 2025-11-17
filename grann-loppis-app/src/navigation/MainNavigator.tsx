import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { UserRole, OrganizerStackParamList, SellerStackParamList, BuyerStackParamList, MapStackParamList, MainTabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import { AuthButton } from '../components/common/AuthButton';
import { NotificationBadge } from '../components/common/NotificationBadge';
import { participantsService } from '../services/firebase/participants.service';
import { theme } from '../styles/theme';

// Organizer screens
import CreateEventScreen from '../screens/organizer/CreateEventScreen';
import ManageEventScreen from '../screens/organizer/ManageEventScreen';
import ParticipantsListScreen from '../screens/organizer/ParticipantsListScreen';

// Seller screens
import JoinEventScreen from '../screens/seller/JoinEventScreen';
import AddAddressScreen from '../screens/seller/AddAddressScreen';

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
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
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
        options={{
          title: 'Loppis Rundan',
          headerBackTitle: '',
        }}
      />
      <OrganizerStack.Screen
        name="ParticipantsList"
        component={ParticipantsListScreen}
        options={{
          title: 'Loppis Rundan',
          headerBackTitle: '',
        }}
      />
    </OrganizerStack.Navigator>
  );
}

function SellerNavigator() {
  return (
    <SellerStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
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
        options={{ title: 'Loppis Rundan' }}
      />
      <SellerStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: 'Loppis Rundan' }}
      />
    </SellerStack.Navigator>
  );
}

function BuyerNavigator() {
  return (
    <BuyerStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
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
        options={{
          title: 'Loppis Rundan',
           headerBackTitle: '',
         }}
      />
      <BuyerStack.Screen
        name="EventMap"
        component={EventMapScreen}
        options={{
          title: 'Loppis Rundan',
          headerTransparent: false,
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
        }}
      />
      <BuyerStack.Screen
        name="SellerDetails"
        component={SellerDetailsScreen}
        options={{
          title: 'Loppis Rundan',
           headerBackTitle: '',
         }}
      />
    </BuyerStack.Navigator>
  );
}

function MapNavigator() {
  return (
    <MapStack.Navigator
      screenOptions={{
        headerRight: () => <AuthButton />,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: 'transparent',
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
        options={{
          title: 'Loppis Rundan',
          headerTransparent: false,
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
        }}
      />
      <MapStack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{
          title: 'Loppis Rundan',
           headerBackTitle: '',
         }}
      />
      <MapStack.Screen
        name="EventMap"
        component={EventMapScreen}
        options={{
          title: 'Loppis Rundan',
          headerTransparent: false,
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
        }}
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
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  // Force re-render when user changes
  useEffect(() => {
    console.log(' User changed in MainNavigator:', user ? `${user.displayName} (${user.role})` : 'null');
    setForceUpdate(prev => prev + 1);
  }, [user]);

  // Load pending applications count for organizers
  useEffect(() => {
    if (user?.role === UserRole.ORGANIZER) {
      loadPendingApplicationsCount();

      // Set up an interval to refresh the count every 30 seconds
      const interval = setInterval(loadPendingApplicationsCount, 30000);

      return () => clearInterval(interval);
    } else {
      setPendingApplicationsCount(0);
    }
  }, [user]);

  const loadPendingApplicationsCount = async () => {
    if (user?.role === UserRole.ORGANIZER) {
      try {
        const count = await participantsService.getPendingApplicationsCountForOrganizer(user.id);
        setPendingApplicationsCount(count);
      } catch (error) {
        console.error('Error loading pending applications count:', error);
      }
    }
  };

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
      options={{
        title: 'Hem',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="home" size={size || 24} color={color} />
        ),
      }}
    />
  );

  // Map tab - always visible
  screens.push(
    <Tab.Screen
      key="MapTab"
      name="MapTab"
      component={MapNavigator}
      options={{
        title: 'Karta',
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name="map" size={size || 24} color={color} />
        ),
      }}
    />
  );

  // Organizer tab - only if user is logged in as organizer
  if (user?.role === UserRole.ORGANIZER) {
    screens.push(
      <Tab.Screen
        key="OrganizerTab"
        name="OrganizerTab"
        component={OrganizerNavigator}
        options={{
          title: 'Min Loppis',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialIcons name="person" size={size || 24} color={color} />
              <NotificationBadge count={pendingApplicationsCount} />
            </View>
          ),
        }}
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
        options={{
          title: 'Sälj',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size || 24} color={color} />
          ),
        }}
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
        options={{
          title: 'Konto',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size || 24} color={color} />
          ),
        }}
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
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 40,
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          height: 70,
          paddingHorizontal: 20,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 10,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingHorizontal: 12,
        },
      }}
    >
      {screens}
    </Tab.Navigator>
  );
}
