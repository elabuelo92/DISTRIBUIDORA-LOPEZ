package com.distribuidora.lopez;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.BatteryManager;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.provider.Settings;
import android.webkit.CookieManager;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class LocationForegroundService extends Service {
    public static final String ACTION_START = "com.distribuidora.lopez.ACTION_START_GPS";
    public static final String ACTION_STOP = "com.distribuidora.lopez.ACTION_STOP_GPS";

    private static final String CHANNEL_ID = "dl_gps_tracking";
    private static final int NOTIFICATION_ID = 879074;
    private static final long MOVING_POST_INTERVAL_MS = 10000L;
    private static final long STATIONARY_POST_INTERVAL_MS = 10000L;
    private static final float MIN_DISTANCE_METERS = 5f;
    private static final String PREFS_NAME = "dl_gps_foreground_service";
    private static final String PREF_SERVER_URL = "server_url";
    private static final String PREF_COOKIE = "cookie";
    private static final String PREF_STATUS = "status";
    private static final String PREF_DEVICE_ID = "device_id";
    private static final String PREF_DEVICE_LABEL = "device_label";
    private static final String PREF_APP_VERSION = "app_version";

    private LocationManager locationManager;
    private LocationListener locationListener;
    private HandlerThread locationThread;
    private Handler locationHandler;
    private Runnable heartbeatRunnable;
    private String serverUrl = "";
    private String cookieHeader = "";
    private String statusLabel = "Disponible";
    private String deviceId = "";
    private String deviceLabel = "";
    private String appVersion = "";
    private long lastPostAt = 0L;
    private Location lastPostedLocation;
    private Location lastKnownLocation;
    private int consecutiveAuthFailures = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        if (deviceId == null || deviceId.trim().length() == 0) deviceId = "android-" + System.currentTimeMillis();
        deviceLabel = Build.MODEL == null ? "Android" : Build.MODEL;
        appVersion = readAppVersion();
        loadStoredConfig();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            clearStoredConfig();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (intent != null) {
            serverUrl = value(intent.getStringExtra("server_url"), serverUrl);
            cookieHeader = value(intent.getStringExtra("cookie"), cookieHeader);
            statusLabel = value(intent.getStringExtra("status"), statusLabel);
            deviceId = value(intent.getStringExtra("device_id"), deviceId);
            deviceLabel = value(intent.getStringExtra("device_label"), deviceLabel);
            appVersion = value(intent.getStringExtra("app_version"), appVersion);
        }
        saveStoredConfig();
        startForeground(NOTIFICATION_ID, buildNotification());
        startTracking();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopTracking();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private String value(String value, String fallback) {
        return value == null || value.trim().length() == 0 ? fallback : value.trim();
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "DL GPS en vivo",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Rastreo operativo de vendedores y repartidores");
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }
        Intent launchIntent = new Intent(this, MainActivity.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, flags);
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        return builder
                .setSmallIcon(getApplicationInfo().icon)
                .setContentTitle("DL Preventa GPS activo")
                .setContentText("Enviando ubicacion real cada 10 segundos")
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .build();
    }

    @SuppressLint("MissingPermission")
    private void startTracking() {
        if (!hasLocationPermission() || locationManager == null || serverUrl.trim().length() == 0) return;
        stopTracking();
        locationThread = new HandlerThread("DLGpsTracking");
        locationThread.start();
        locationHandler = new Handler(locationThread.getLooper());
        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (location != null) {
                    lastKnownLocation = new Location(location);
                    maybePostLocation(location);
                }
            }

            @Override
            public void onProviderEnabled(String provider) {
            }

            @Override
            public void onProviderDisabled(String provider) {
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {
            }
        };
        List<String> providers = enabledProviders();
        for (String provider : providers) {
            try {
                locationManager.requestLocationUpdates(
                        provider,
                        10000L,
                        MIN_DISTANCE_METERS,
                        locationListener,
                        locationHandler.getLooper()
                );
                Location last = locationManager.getLastKnownLocation(provider);
                if (last != null) {
                    lastKnownLocation = new Location(last);
                    maybePostLocation(last);
                }
            } catch (Exception ignored) {
            }
        }
        startHeartbeatPosts();
    }

    private void stopTracking() {
        if (locationHandler != null && heartbeatRunnable != null) {
            locationHandler.removeCallbacks(heartbeatRunnable);
        }
        heartbeatRunnable = null;
        try {
            if (locationManager != null && locationListener != null) {
                locationManager.removeUpdates(locationListener);
            }
        } catch (Exception ignored) {
        }
        locationListener = null;
        locationHandler = null;
        lastKnownLocation = null;
        if (locationThread != null) {
            locationThread.quitSafely();
            locationThread = null;
        }
    }

    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private List<String> enabledProviders() {
        List<String> providers = new ArrayList<String>();
        if (locationManager == null) return providers;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) providers.add(LocationManager.GPS_PROVIDER);
        } catch (Exception ignored) {
        }
        try {
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) providers.add(LocationManager.NETWORK_PROVIDER);
        } catch (Exception ignored) {
        }
        return providers;
    }

    private void startHeartbeatPosts() {
        if (locationHandler == null) return;
        heartbeatRunnable = new Runnable() {
            @Override
            public void run() {
                Location heartbeat = lastKnownLocation != null ? new Location(lastKnownLocation) : bestLastKnownLocation();
                if (heartbeat != null) {
                    if (System.currentTimeMillis() - heartbeat.getTime() > STATIONARY_POST_INTERVAL_MS) {
                        heartbeat.setTime(System.currentTimeMillis());
                    }
                    maybePostLocation(heartbeat);
                } else {
                    postHeartbeatAsync();
                }
                if (locationHandler != null && heartbeatRunnable != null) {
                    locationHandler.postDelayed(heartbeatRunnable, STATIONARY_POST_INTERVAL_MS);
                }
            }
        };
        locationHandler.postDelayed(heartbeatRunnable, STATIONARY_POST_INTERVAL_MS);
    }

    @SuppressLint("MissingPermission")
    private Location bestLastKnownLocation() {
        if (!hasLocationPermission() || locationManager == null) return null;
        Location best = null;
        for (String provider : enabledProviders()) {
            try {
                Location candidate = locationManager.getLastKnownLocation(provider);
                if (candidate == null) continue;
                if (best == null || candidate.getTime() > best.getTime()) {
                    best = candidate;
                }
            } catch (Exception ignored) {
            }
        }
        if (best != null) lastKnownLocation = new Location(best);
        return best;
    }

    private void maybePostLocation(Location location) {
        long now = System.currentTimeMillis();
        long interval = location.hasSpeed() && location.getSpeed() > 0.8f
                ? MOVING_POST_INTERVAL_MS
                : STATIONARY_POST_INTERVAL_MS;
        if (lastPostedLocation != null) {
            float distance = location.distanceTo(lastPostedLocation);
            if (distance < MIN_DISTANCE_METERS && now - lastPostAt < interval) return;
        }
        lastPostedLocation = new Location(location);
        lastPostAt = now;
        postLocationAsync(location);
    }

    private void postLocationAsync(final Location location) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                postLocation(location);
            }
        }, "DLGpsPost").start();
    }

    private void postLocation(Location location) {
        HttpURLConnection connection = null;
        try {
            String origin = serverOrigin();
            String endpoint = origin + "/api/presence/location";
            String cookie = cookieHeader;
            try {
                String fromManager = CookieManager.getInstance().getCookie(origin);
                if (fromManager != null && fromManager.trim().length() > 0) {
                    cookie = fromManager;
                    cookieHeader = fromManager;
                    saveStoredConfig();
                }
            } catch (Exception ignored) {
            }
            JSONObject body = new JSONObject();
            JSONObject device = new JSONObject();
            device.put("id", deviceId);
            device.put("label", deviceLabel);
            device.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            device.put("os", "Android " + Build.VERSION.RELEASE);
            device.put("appVersion", appVersion);
            JSONObject gps = new JSONObject();
            gps.put("lat", location.getLatitude());
            gps.put("lng", location.getLongitude());
            gps.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : 0f);
            gps.put("speed", location.hasSpeed() ? location.getSpeed() : JSONObject.NULL);
            gps.put("heading", location.hasBearing() ? location.getBearing() : JSONObject.NULL);
            gps.put("source", "native-background");
            gps.put("provider", location.getProvider() == null ? "" : location.getProvider());
            gps.put("mock", location.isFromMockProvider());
            gps.put("deviceAt", iso(location.getTime() > 0L ? location.getTime() : System.currentTimeMillis()));
            int battery = batteryPercent();
            if (battery >= 0) gps.put("battery", battery);
            gps.put("online", isNetworkAvailable());
            body.put("device", device);
            body.put("status", statusLabel);
            body.put("gps", gps);

            connection = (HttpURLConnection) new URL(endpoint).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setRequestProperty("Cache-Control", "no-store");
            if (cookie != null && cookie.trim().length() > 0) {
                connection.setRequestProperty("Cookie", cookie);
            }
            OutputStream output = connection.getOutputStream();
            output.write(body.toString().getBytes("UTF-8"));
            output.flush();
            output.close();
            int code = connection.getResponseCode();
            handleResponseCode(code);
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void postHeartbeatAsync() {
        new Thread(new Runnable() {
            @Override
            public void run() {
                postHeartbeat();
            }
        }, "DLGpsHeartbeat").start();
    }

    private void postHeartbeat() {
        HttpURLConnection connection = null;
        try {
            String origin = serverOrigin();
            String endpoint = origin + "/api/presence/heartbeat";
            String cookie = cookieHeader;
            try {
                String fromManager = CookieManager.getInstance().getCookie(origin);
                if (fromManager != null && fromManager.trim().length() > 0) {
                    cookie = fromManager;
                    cookieHeader = fromManager;
                    saveStoredConfig();
                }
            } catch (Exception ignored) {
            }
            JSONObject body = new JSONObject();
            JSONObject device = new JSONObject();
            device.put("id", deviceId);
            device.put("label", deviceLabel);
            device.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            device.put("os", "Android " + Build.VERSION.RELEASE);
            device.put("appVersion", appVersion);
            body.put("device", device);
            body.put("status", statusLabel);

            connection = (HttpURLConnection) new URL(endpoint).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(8000);
            connection.setReadTimeout(8000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setRequestProperty("Cache-Control", "no-store");
            if (cookie != null && cookie.trim().length() > 0) {
                connection.setRequestProperty("Cookie", cookie);
            }
            OutputStream output = connection.getOutputStream();
            output.write(body.toString().getBytes("UTF-8"));
            output.flush();
            output.close();
            handleResponseCode(connection.getResponseCode());
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void handleResponseCode(int code) {
        if (code >= 200 && code < 300) {
            consecutiveAuthFailures = 0;
            return;
        }
        if (code == 401 || code == 403) {
            consecutiveAuthFailures += 1;
            if (consecutiveAuthFailures >= 3) stopSelf();
        }
    }

    private String serverOrigin() {
        Uri uri = Uri.parse(serverUrl);
        String scheme = uri.getScheme() == null ? "http" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost();
        int port = uri.getPort();
        return scheme + "://" + host + (port > 0 ? ":" + port : "");
    }

    private String iso(long millis) {
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        return formatter.format(new Date(millis));
    }

    private String readAppVersion() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return getPackageManager().getPackageInfo(getPackageName(), PackageManager.PackageInfoFlags.of(0)).versionName;
            }
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception ignored) {
            return "android";
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    private void loadStoredConfig() {
        try {
            SharedPreferences stored = prefs();
            serverUrl = value(stored.getString(PREF_SERVER_URL, ""), serverUrl);
            cookieHeader = value(stored.getString(PREF_COOKIE, ""), cookieHeader);
            statusLabel = value(stored.getString(PREF_STATUS, ""), statusLabel);
            deviceId = value(stored.getString(PREF_DEVICE_ID, ""), deviceId);
            deviceLabel = value(stored.getString(PREF_DEVICE_LABEL, ""), deviceLabel);
            appVersion = value(stored.getString(PREF_APP_VERSION, ""), appVersion);
        } catch (Exception ignored) {
        }
    }

    private void saveStoredConfig() {
        try {
            prefs().edit()
                    .putString(PREF_SERVER_URL, serverUrl)
                    .putString(PREF_COOKIE, cookieHeader)
                    .putString(PREF_STATUS, statusLabel)
                    .putString(PREF_DEVICE_ID, deviceId)
                    .putString(PREF_DEVICE_LABEL, deviceLabel)
                    .putString(PREF_APP_VERSION, appVersion)
                    .apply();
        } catch (Exception ignored) {
        }
    }

    private void clearStoredConfig() {
        try {
            prefs().edit().clear().apply();
        } catch (Exception ignored) {
        }
    }

    private int batteryPercent() {
        try {
            BatteryManager manager = (BatteryManager) getSystemService(Context.BATTERY_SERVICE);
            if (manager == null) return -1;
            return manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
        } catch (Exception ignored) {
            return -1;
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo info = manager == null ? null : manager.getActiveNetworkInfo();
            return info != null && info.isConnected();
        } catch (Exception ignored) {
            return true;
        }
    }
}
