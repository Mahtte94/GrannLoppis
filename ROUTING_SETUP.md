# GrannLoppis Routing Feature - Setup Guide

## Overview

This document describes the routing functionality that uses the Google Maps Directions API to display optimal routes between sellers in the GrannLoppis app.

## What Was Implemented

### 1. **Google Maps Directions API Integration**
   - Created a new routing service (`src/services/routing/googlemaps.service.ts`)
   - Supports route optimization through multiple waypoints (seller locations) using Google Maps waypoint optimization
   - Calculates optimal walking routes starting from the user's current location
   - Supports up to 25 waypoints per route

### 2. **Type Definitions**
   - Added comprehensive routing types in `src/types/routing.types.ts`
   - Types include: `Route`, `RouteWaypoint`, `RouteSegment`, `RouteOptimizationOptions`

### 3. **EventMapScreen Enhancement**
   - Added "Visa rutt" (Show Route) button that appears when 2+ sellers are present
   - Displays route as a blue polyline on the map
   - Shows route statistics (distance and duration)
   - Toggle functionality to show/hide the route

## Setup Instructions

### Step 1: Enable Google Maps Directions API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for and enable **Directions API**
5. Navigate to **APIs & Services** > **Credentials**
6. Copy your API key (or create a new one if needed)

**Note**: Make sure you also have the following APIs enabled:
- Places API (for location autocomplete)
- Maps SDK for Android
- Maps SDK for iOS

### Step 2: Configure Environment Variables

1. Open your `.env` file (or create one from `.env.example`)
2. Make sure your Google Maps API key is set:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

3. Make sure all other required variables are set (Firebase)

**Note**: The same Google Maps API key is used for maps display, location autocomplete, AND routing.

### Step 3: Restart the Development Server

After adding the API key, restart your Expo development server:

```bash
cd grann-loppis-app
npm start
```

## How to Use

### For Users (Buyers)

1. Navigate to an event's map view (from Browse Events → Event Details → View Map)
2. If there are 2 or more sellers, a "Starta navigering" button will appear at the bottom
3. Click the button to start GPS navigation
4. The app will:
   - Request your current location (you must grant location permission)
   - **Optimize the order** to visit all sellers using the shortest route
   - Calculate the best walking route through all seller locations
   - Start real-time GPS tracking and turn-by-turn navigation
   - Display the route as a blue line on the map
   - Show a navigation panel with current turn instructions
   - Auto-follow your position as you move (Google Maps style)
   - Mark completed portions in green as you progress
5. During navigation:
   - Follow the turn-by-turn instructions at the top
   - Watch the green line grow as you complete the route
   - If you go off-route, it will automatically recalculate
   - Distance to next seller and total remaining distance are shown
6. Click the **✕ button** in the navigation panel to stop navigation

### Dynamic Routing

The route is **dynamically generated** based on your current GPS location:
- Every time you click "Skapa rutt från min plats", it uses your **current** location
- If you move to a different location and regenerate the route, it will calculate a new route from your new position
- The route always starts from wherever you are at that moment
- This is useful if you're driving/walking to the event area and want to see the route from different starting points

### Technical Features

- **Intelligent Route Optimization**: Uses Google Maps waypoint optimization to find a good order to visit all sellers to minimize total walking distance/time (supports up to 25 waypoints)
- **GPS Navigation Mode**: Real-time turn-by-turn navigation that follows your location like Google Maps
- **Auto-centering Camera**: Map automatically follows you as you move during navigation with 3D tilt view
- **Route Progress Tracking**: Green line shows completed portions, blue line shows remaining route
- **Off-Route Detection**: Automatically detects when you go off-route (>50m) and recalculates
- **User Location Integration**: Routes always start from your current GPS location
- **Transportation Mode**: Currently set to "foot-walking" (can be changed to driving or cycling)
- **Visual Feedback**: Loading indicator while route is being generated

## API Usage & Limits

### APIs Used
The app uses the **Google Maps Directions API** for route generation with waypoint optimization enabled.

Each route generation uses **1 API call** to Google Maps Directions API.

### Free Tier & Pricing
- Google Maps offers $200 free monthly credit
- Directions API: $5 per 1,000 requests
- With the free credit, you get ~40,000 route requests per month for free
- Supports up to 25 waypoints per request (10 waypoints for free tier without billing enabled)
- For more details, see: https://developers.google.com/maps/documentation/directions/usage-and-billing

### Recommendations
- Routes are cached per session to avoid regenerating
- Auto-recalculation only triggers when user goes off-route
- Monitor API usage if app becomes popular
- Consider implementing daily request counter

## Customization Options

### Change Transportation Mode

In `EventMapScreen.tsx`, line ~239, you can change the profile:

```typescript
const generatedRoute = await googleMapsService.getOptimizedRoute(waypoints, {
  includeUserLocation: true,
  profile: 'foot-walking', // Options: 'driving-car', 'foot-walking', 'cycling-regular'
});
```

### Customize Route Appearance

In `EventMapScreen.tsx`, you can customize the polyline:

```typescript
<Polyline
  coordinates={optimizedRoute.coordinates.map(coord => ({
    latitude: coord.lat,
    longitude: coord.lng,
  }))}
  strokeColor={theme.colors.primary} // Change color here
  strokeWidth={4} // Change line width here
  lineCap="round"
  lineJoin="round"
/>
```

### Add Turn-by-Turn Directions

The route data includes turn-by-turn instructions. To display them:

```typescript
if (generatedRoute.segments) {
  generatedRoute.segments.forEach(segment => {
    segment.steps?.forEach(step => {
      console.log(step.instruction); // e.g., "Turn left onto Main Street"
    });
  });
}
```

## Files Modified/Created

### New Files
- `src/services/routing/googlemaps.service.ts` - Google Maps Directions API integration
- `src/services/routing/navigation.service.ts` - GPS navigation tracking service
- `src/services/routing/index.ts` - Service exports
- `src/types/routing.types.ts` - Type definitions
- `src/components/NavigationPanel.tsx` - Navigation UI component
- `.env.example` - Updated with Google Maps API configuration

### Modified Files
- `src/types/index.ts` - Added routing types export
- `src/screens/buyer/EventMapScreen.tsx` - Added routing UI and logic

## Troubleshooting

### Route Not Generating
1. **Check API Key**: Ensure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`
2. **Check API Enabled**: Make sure Directions API is enabled in Google Cloud Console
3. **Restart Server**: Environment variables require a server restart
4. **Check Permissions**: Ensure location permissions are granted
5. **Minimum Sellers**: Need at least 2 sellers to generate a route
6. **Internet Connection**: Google Maps API requires active internet
7. **Billing**: If you have more than 10 waypoints, you may need to enable billing in Google Cloud Console

### Route Appears Incorrect
- Google Maps uses real road networks, so routes may look different than straight lines
- Ensure coordinates are correct (lat/lng format)

### API Errors
- Check Google Cloud Console > APIs & Services > Dashboard for error details
- Verify your API key has Directions API enabled
- Check if you've exceeded your quota (see API Usage & Limits section)

## How Route Optimization Works

### Waypoint Optimization
When you have multiple sellers to visit, the order matters! For example:
- **Unoptimized**: Home → Seller A → Seller B → Seller C might be 5 km
- **Optimized**: Home → Seller C → Seller A → Seller B might be only 3 km

The app uses Google Maps waypoint optimization to find a good order to visit all sellers.

### Optimization Process
1. **Input**: Your current location + all seller locations (up to 25 waypoints)
2. **Algorithm**: Google Maps runs a heuristic optimization to minimize total distance
3. **Output**: Reordered list of sellers to visit in optimized sequence
4. **Route Generation**: Creates turn-by-turn directions following the optimized order

This helps ensure you get an efficient route through all sellers!

**Note**: Google Maps uses a heuristic approach rather than solving the exact Traveling Salesman Problem, so the route may not always be the absolute optimal solution, but it will be close and is generated very quickly.

## Future Enhancements

Potential improvements for the routing feature:

1. **Route Optimization Options**
   - Allow users to manually reorder waypoints
   - Option to prioritize certain sellers

2. **Transportation Modes**
   - Add UI to select walking/cycling/driving
   - Show different route options

3. **Advanced Features**
   - Save favorite routes
   - Share routes with friends
   - Offline route caching
   - Real-time traffic integration

4. **User Preferences**
   - Avoid tolls/highways
   - Prefer scenic routes
   - Accessibility options

## Support

For issues or questions:
- Check Google Maps Directions API documentation: https://developers.google.com/maps/documentation/directions/overview
- Review error messages in console/logs
- Check Google Cloud Console for API usage and errors
- Ensure all dependencies are installed: `npm install`

---

**Happy routing!** 🗺️
