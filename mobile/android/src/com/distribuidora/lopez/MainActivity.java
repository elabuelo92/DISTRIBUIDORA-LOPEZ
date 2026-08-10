package com.distribuidora.lopez;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Insets;
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
import android.os.Looper;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.text.InputType;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebChromeClient.FileChooserParams;
import android.webkit.ValueCallback;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQUEST_LOCATION_PERMISSION = 5001;
    private static final int REQUEST_FILE_CHOOSER = 5002;
    private static final int REQUEST_MEDIA_PERMISSION = 5003;
    private static final int REQUEST_BACKGROUND_LOCATION_PERMISSION = 5004;
    private static final int REQUEST_NOTIFICATION_PERMISSION = 5005;
    private static final long LOCATION_TIMEOUT_MS = 12000L;
    private static final long RECENT_LOCATION_MS = 5 * 60 * 1000L;
    private static final long CONTINUOUS_LOCATION_MIN_TIME_MS = 10000L;
    private static final float CONTINUOUS_LOCATION_MIN_DISTANCE_M = 5f;

    private static final String PREFS_NAME = "dl_preventa";
    private static final String PREF_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER_URL = "https://distribuidora-lopez.216-128-169-34.sslip.io/index.html?v=8790-88#preventa";

    private WebView webView;
    private TextView statusView;
    private Handler mainHandler;
    private LocationManager locationManager;
    private LocationListener activeLocationListener;
    private ValueCallback<Uri[]> filePathCallback;
    private FileChooserParams pendingFileChooserParams;
    private Uri pendingCameraImageUri;
    private boolean pendingLocationRequest;
    private boolean continuousLocationMode;
    private boolean lastLocationRequestContinuous;
    private boolean serverDialogShowing;
    private String continuousLocationContext = "";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mainHandler = new Handler(Looper.getMainLooper());
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        FrameLayout root = new FrameLayout(this);
        applySystemBarInsets(root);
        webView = new WebView(this);
        statusView = new TextView(this);
        statusView.setTextColor(0xffffffff);
        statusView.setTextSize(16);
        statusView.setPadding(28, 28, 28, 28);
        statusView.setBackgroundColor(0xff0f2a2f);
        statusView.setVisibility(View.GONE);
        statusView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showServerConfigDialog("Configurar servidor de DL Preventa");
            }
        });

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        root.addView(statusView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        ));
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        webView.clearCache(true);
        webView.clearFormData();

        webView.addJavascriptInterface(new AndroidLocationBridge(), "AndroidLocation");
        webView.addJavascriptInterface(new AndroidConnectionBridge(), "AndroidConnection");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;
                MainActivity.this.pendingFileChooserParams = fileChooserParams;
                if (shouldRequestCameraPermission(fileChooserParams)) {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, REQUEST_MEDIA_PERMISSION);
                    return true;
                }
                openFileChooser(fileChooserParams);
                return true;
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && request != null && request.getUrl() != null) {
                    Uri uri = request.getUrl();
                    if (shouldOpenExternally(uri)) {
                        openExternalUri(uri);
                        return true;
                    }
                }
                return false;
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                try {
                    Uri uri = Uri.parse(url);
                    if (shouldOpenExternally(uri)) {
                        openExternalUri(uri);
                        return true;
                    }
                } catch (Exception ignored) {
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                showStatus("");
                super.onPageFinished(view, url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request != null && request.isForMainFrame()) {
                    handleMainFrameError();
                }
                super.onReceivedError(view, request, error);
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                handleMainFrameError();
                super.onReceivedError(view, errorCode, description, failingUrl);
            }
        });

        if (!isNetworkAvailable()) {
            showStatus("Sin red. Conectar el telefono a Tailscale o WiFi y tocar atras/abrir de nuevo.");
        }
        requestNotificationPermissionIfNeeded();
        webView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                showServerConfigDialog("Configurar servidor de DL Preventa");
                return true;
            }
        });
        webView.loadUrl(getServerUrl());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (continuousLocationMode && hasLocationPermission()) {
            startNativeLocationRequest(true);
            startBackgroundLocationService(continuousLocationContext);
        }
    }

    private void applySystemBarInsets(final View root) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override
                public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                    Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                    return insets;
                }
            });
        } else {
            root.setFitsSystemWindows(true);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            showStatus("Estas dentro de DL Preventa. Usar Salir para cerrar sesion.");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            webView.evaluateJavascript(
                    "(function(){try{return !!(window.DL_HANDLE_ANDROID_BACK && window.DL_HANDLE_ANDROID_BACK());}catch(e){return false;}})();",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"true".equals(value) && !"\"true\"".equals(value)) fallbackBackNavigation();
                        }
                    }
            );
            return;
        }
        fallbackBackNavigation();
    }

    private void fallbackBackNavigation() {
        if (webView != null) {
            webView.loadUrl("javascript:(function(){try{if(window.DL_HANDLE_ANDROID_BACK){window.DL_HANDLE_ANDROID_BACK();}}catch(e){}})();");
            showStatus("Estas dentro de DL Preventa. Usar Volver o Salir desde la app.");
            return;
        }
        showStatus("Estas dentro de DL Preventa. Usar Salir desde la app.");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            onBackPressed();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        stopLocationUpdates();
        // El servicio GPS de fondo se detiene solo con logout desde la app.
        // Si Android destruye la Activity estando minimizada, debe seguir transmitiendo.
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_NOTIFICATION_PERMISSION) return;
        if (requestCode == REQUEST_BACKGROUND_LOCATION_PERMISSION) {
            if (lastLocationRequestContinuous && hasLocationPermission()) {
                startNativeLocationRequest(true);
                startBackgroundLocationService(continuousLocationContext);
            }
            return;
        }
        if (requestCode == REQUEST_MEDIA_PERMISSION) {
            if (filePathCallback != null && pendingFileChooserParams != null) {
                openFileChooser(pendingFileChooserParams);
            }
            return;
        }
        if (requestCode != REQUEST_LOCATION_PERMISSION) return;
        if (hasLocationPermission()) {
            requestBackgroundLocationPermissionIfNeeded();
            startNativeLocationRequest(lastLocationRequestContinuous);
            if (lastLocationRequestContinuous) {
                startBackgroundLocationService(continuousLocationContext);
            }
        } else {
            pendingLocationRequest = false;
            continuousLocationMode = false;
            sendLocationError("GPS sin permiso en Android. Permitir Ubicacion para DL Preventa.");
        }
    }

    private boolean shouldRequestCameraPermission(FileChooserParams params) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && params != null
                && params.isCaptureEnabled()
                && acceptsImages(params)
                && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasCameraPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private void openFileChooser(FileChooserParams params) {
        try {
            if (params != null && params.isCaptureEnabled() && acceptsImages(params) && hasCameraPermission()) {
                Intent cameraIntent = buildCameraIntent();
                if (cameraIntent != null) {
                    startActivityForResult(cameraIntent, REQUEST_FILE_CHOOSER);
                    return;
                }
            }

            Intent contentIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            contentIntent.addCategory(Intent.CATEGORY_OPENABLE);
            configureAcceptTypes(contentIntent, params);
            if (params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                contentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }

            Intent chooser = Intent.createChooser(contentIntent, "Seleccionar adjunto");
            if (acceptsImages(params) && hasCameraPermission()) {
                Intent cameraIntent = buildCameraIntent();
                if (cameraIntent != null) {
                    chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});
                }
            }
            startActivityForResult(chooser, REQUEST_FILE_CHOOSER);
        } catch (Exception ex) {
            cancelFileChooser();
            showStatus("No se pudo abrir camara, galeria o archivos: " + ex.getMessage());
        }
    }

    private void configureAcceptTypes(Intent intent, FileChooserParams params) {
        List<String> mimes = collectAcceptTypes(params);
        if (mimes.isEmpty()) {
            intent.setType("*/*");
        } else if (mimes.size() == 1) {
            intent.setType(mimes.get(0));
        } else {
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0]));
        }
    }

    private List<String> collectAcceptTypes(FileChooserParams params) {
        List<String> mimes = new ArrayList<String>();
        if (params == null || params.getAcceptTypes() == null) return mimes;
        for (String raw : params.getAcceptTypes()) {
            if (raw == null) continue;
            String[] parts = raw.split(",");
            for (String part : parts) {
                String mime = part.trim();
                if (mime.length() == 0 || mime.startsWith(".")) continue;
                if (!mimes.contains(mime)) mimes.add(mime);
            }
        }
        return mimes;
    }

    private boolean acceptsImages(FileChooserParams params) {
        List<String> mimes = collectAcceptTypes(params);
        if (mimes.isEmpty()) return true;
        for (String mime : mimes) {
            if ("*/*".equals(mime) || mime.startsWith("image/")) return true;
        }
        return false;
    }

    private Intent buildCameraIntent() {
        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (cameraIntent.resolveActivity(getPackageManager()) == null) return null;
        pendingCameraImageUri = createCameraImageUri();
        if (pendingCameraImageUri != null) {
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraImageUri);
            cameraIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        }
        return cameraIntent;
    }

    private Uri createCameraImageUri() {
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, "dl_adjunto_" + System.currentTimeMillis() + ".jpg");
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/DistribuidoraLopez");
            }
            return getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void cancelFileChooser() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
        }
        filePathCallback = null;
        pendingFileChooserParams = null;
        pendingCameraImageUri = null;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_FILE_CHOOSER || filePathCallback == null) return;
        Uri[] results = null;
        if (resultCode == Activity.RESULT_OK) {
            List<Uri> uris = new ArrayList<Uri>();
            if (data != null && data.getClipData() != null) {
                ClipData clipData = data.getClipData();
                for (int i = 0; i < clipData.getItemCount(); i++) {
                    Uri uri = clipData.getItemAt(i).getUri();
                    if (uri != null) uris.add(uri);
                }
            } else if (data != null && data.getData() != null) {
                uris.add(data.getData());
            }
            if (uris.isEmpty()) {
                Uri[] parsed = FileChooserParams.parseResult(resultCode, data);
                if (parsed != null) {
                    for (Uri uri : parsed) {
                        if (uri != null) uris.add(uri);
                    }
                }
            }
            if (uris.isEmpty() && pendingCameraImageUri != null) {
                uris.add(pendingCameraImageUri);
            }
            if (!uris.isEmpty()) {
                results = uris.toArray(new Uri[0]);
            }
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        pendingFileChooserParams = null;
        pendingCameraImageUri = null;
    }

    private void handleMainFrameError() {
        showStatus("No conecta al servidor configurado. Verificar Internet y servidor HTTPS. Tocar esta barra para cambiar URL.");
        if (!serverDialogShowing) {
            mainHandler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    showServerConfigDialog("No conecta al servidor. Revisar URL HTTPS configurada");
                }
            }, 900);
        }
    }

    private SharedPreferences prefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
    }

    private String getServerUrl() {
        String stored = prefs().getString(PREF_SERVER_URL, DEFAULT_SERVER_URL);
        if (shouldReplaceLegacyServerUrl(stored)) {
            stored = DEFAULT_SERVER_URL;
            prefs().edit().putString(PREF_SERVER_URL, stored).apply();
        }
        return normalizeServerUrl(stored);
    }

    private void saveServerUrl(String rawUrl) {
        prefs().edit().putString(PREF_SERVER_URL, normalizeServerUrl(rawUrl)).apply();
    }

    private void resetServerUrl() {
        prefs().edit().remove(PREF_SERVER_URL).apply();
    }

    private String normalizeServerUrl(String rawUrl) {
        String value = rawUrl == null ? "" : rawUrl.trim();
        if (value.length() == 0) value = DEFAULT_SERVER_URL;
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://" + value;
        }
        String lower = value.toLowerCase();
        if (!lower.contains("/index.html")) {
            int hash = value.indexOf("#");
            String suffix = hash >= 0 ? value.substring(hash) : "#preventa";
            String base = hash >= 0 ? value.substring(0, hash) : value;
            while (base.endsWith("/")) base = base.substring(0, base.length() - 1);
            value = base + "/index.html?v=8790-88" + suffix;
        }
        return value;
    }

    private boolean shouldReplaceLegacyServerUrl(String rawUrl) {
        String value = rawUrl == null ? "" : rawUrl.trim().toLowerCase();
        if (value.length() == 0) return false;
        if (value.contains("distribuidora-lopez.216-128-169-34.sslip.io")) return false;
        return value.contains("desktop-c2c0q4v")
                || value.contains("tail6f19de")
                || value.contains("localhost")
                || value.contains("127.0.0.1")
                || value.contains("192.168.")
                || value.contains("100.")
                || value.startsWith("http://");
    }

    private void showServerConfigDialog(String title) {
        if (serverDialogShowing || isFinishing()) return;
        serverDialogShowing = true;
        final EditText input = new EditText(this);
        input.setSingleLine(false);
        input.setMinLines(2);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(getServerUrl());
        input.setSelectAllOnFocus(true);
        new AlertDialog.Builder(this)
                .setTitle(title)
                .setMessage("Usar URL HTTPS del servidor. Ejemplo: https://distribuidora-lopez.216-128-169-34.sslip.io")
                .setView(input)
                .setPositiveButton("Guardar y abrir", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        saveServerUrl(input.getText().toString());
                        serverDialogShowing = false;
                        webView.loadUrl(getServerUrl());
                    }
                })
                .setNegativeButton("Cancelar", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        serverDialogShowing = false;
                    }
                })
                .setNeutralButton("Restablecer", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        resetServerUrl();
                        serverDialogShowing = false;
                        webView.loadUrl(getServerUrl());
                    }
                })
                .setOnCancelListener(new DialogInterface.OnCancelListener() {
                    @Override
                    public void onCancel(DialogInterface dialog) {
                        serverDialogShowing = false;
                    }
                })
                .show();
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

    private void showStatus(final String message) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (message == null || message.length() == 0) {
                    statusView.setVisibility(View.GONE);
                    statusView.setText("");
                } else {
                    statusView.setText(message);
                    statusView.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    private boolean shouldOpenExternally(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if ("geo".equals(scheme) || "tel".equals(scheme) || "mailto".equals(scheme) || "whatsapp".equals(scheme)) {
            return true;
        }
        return host.equals("wa.me")
                || host.endsWith(".whatsapp.com")
                || host.equals("maps.app.goo.gl")
                || host.equals("maps.google.com")
                || (host.endsWith(".google.com") && uri.toString().contains("/maps"));
    }

    private void openExternalUri(Uri uri) {
        if (uri == null) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (Exception ex) {
            showStatus("No se pudo abrir la aplicacion externa: " + ex.getMessage());
        }
    }

    private void startBackgroundLocationService(String contextLabel) {
        if (!hasLocationPermission() || !isLocationEnabled()) return;
        if (!hasBackgroundLocationPermission()) {
            requestBackgroundLocationPermissionIfNeeded();
            showStatus("Permitir ubicacion en segundo plano para mantener GPS con pantalla apagada.");
        }
        try {
            Intent intent = new Intent(this, LocationForegroundService.class);
            intent.setAction(LocationForegroundService.ACTION_START);
            intent.putExtra("server_url", getServerUrl());
            intent.putExtra("cookie", cookieForServer());
            intent.putExtra("status", statusForGpsContext(contextLabel));
            intent.putExtra("device_id", deviceId());
            intent.putExtra("device_label", Build.MODEL == null ? "Android" : Build.MODEL);
            intent.putExtra("app_version", appVersionName());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
        } catch (Exception ex) {
            showStatus("GPS en segundo plano no pudo iniciar: " + ex.getMessage());
        }
    }

    private void stopBackgroundLocationService() {
        try {
            Intent intent = new Intent(this, LocationForegroundService.class);
            intent.setAction(LocationForegroundService.ACTION_STOP);
            stopService(intent);
        } catch (Exception ignored) {
        }
    }

    private String statusForGpsContext(String contextLabel) {
        String context = contextLabel == null ? "" : contextLabel.toUpperCase();
        if (context.startsWith("REPARTO")) return "En Reparto";
        return "Disponible";
    }

    private String deviceId() {
        String value = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        return value == null || value.trim().length() == 0 ? "android-" + System.currentTimeMillis() : value;
    }

    private String cookieForServer() {
        try {
            String origin = serverOrigin(getServerUrl());
            String cookie = CookieManager.getInstance().getCookie(origin);
            return cookie == null ? "" : cookie;
        } catch (Exception ignored) {
            return "";
        }
    }

    private String serverOrigin(String url) {
        try {
            Uri uri = Uri.parse(url);
            String scheme = uri.getScheme() == null ? "http" : uri.getScheme();
            String host = uri.getHost() == null ? "" : uri.getHost();
            int port = uri.getPort();
            return scheme + "://" + host + (port > 0 ? ":" + port : "");
        } catch (Exception ignored) {
            return "";
        }
    }

    private String appVersionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception ignored) {
            return "android-v81";
        }
    }

    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasBackgroundLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestLocationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        requestPermissions(new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
        }, REQUEST_LOCATION_PERMISSION);
    }

    private void requestBackgroundLocationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || hasBackgroundLocationPermission()) return;
        requestPermissions(new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, REQUEST_BACKGROUND_LOCATION_PERMISSION);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQUEST_NOTIFICATION_PERMISSION);
    }

    private boolean isLocationEnabled() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return locationManager != null && locationManager.isLocationEnabled();
            }
            int mode = Settings.Secure.getInt(getContentResolver(), Settings.Secure.LOCATION_MODE);
            return mode != Settings.Secure.LOCATION_MODE_OFF;
        } catch (Exception ignored) {
            return true;
        }
    }

    @SuppressLint("MissingPermission")
    private void startNativeLocationRequest() {
        startNativeLocationRequest(false);
    }

    private void startNativeLocationRequest(boolean continuous) {
        pendingLocationRequest = true;
        continuousLocationMode = continuous;
        lastLocationRequestContinuous = continuous;
        if (!hasLocationPermission()) {
            requestLocationPermissionIfNeeded();
            return;
        }
        if (!isLocationEnabled()) {
            pendingLocationRequest = false;
            continuousLocationMode = false;
            sendLocationError("GPS desactivado en Android. Activar Ubicacion del telefono.");
            return;
        }

        stopLocationUpdates();
        continuousLocationMode = continuous;
        pendingLocationRequest = true;
        showStatus("Buscando GPS real del telefono...");

        final Location bestRecentLocation = getBestLastKnownLocation(true);
        final List<String> providers = getAvailableProviders();
        if (providers.isEmpty()) {
            pendingLocationRequest = false;
            if (bestRecentLocation != null) {
                sendLocation(bestRecentLocation);
            } else {
                sendLocationError("Sin proveedor GPS disponible. Activar GPS/ubicacion precisa.");
            }
            return;
        }

        activeLocationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (location == null) return;
                if (!pendingLocationRequest && !continuousLocationMode) return;
                pendingLocationRequest = false;
                if (!continuousLocationMode) {
                    stopLocationUpdates();
                }
                sendLocation(location);
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

        try {
            for (String provider : providers) {
                locationManager.requestLocationUpdates(
                        provider,
                        continuous ? CONTINUOUS_LOCATION_MIN_TIME_MS : 0L,
                        continuous ? CONTINUOUS_LOCATION_MIN_DISTANCE_M : 0f,
                        activeLocationListener,
                        Looper.getMainLooper()
                );
            }
        } catch (Exception ex) {
            pendingLocationRequest = false;
            continuousLocationMode = false;
            stopLocationUpdates();
            sendLocationError("GPS nativo no pudo iniciar: " + ex.getMessage());
            return;
        }

        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!pendingLocationRequest) return;
                pendingLocationRequest = false;
                if (!continuousLocationMode) {
                    stopLocationUpdates();
                }
                Location fallback = bestRecentLocation != null ? bestRecentLocation : getBestLastKnownLocation(false);
                if (fallback != null) {
                    sendLocation(fallback);
                } else {
                    sendLocationError("GPS sin lectura. Salir al exterior o activar ubicacion precisa.");
                }
            }
        }, LOCATION_TIMEOUT_MS);
    }

    @SuppressLint("MissingPermission")
    private Location getBestLastKnownLocation(boolean onlyRecent) {
        if (!hasLocationPermission() || locationManager == null) return null;
        Location best = null;
        List<String> providers = getAvailableProviders();
        for (String provider : providers) {
            try {
                Location candidate = locationManager.getLastKnownLocation(provider);
                if (candidate == null) continue;
                if (onlyRecent && !isRecent(candidate)) continue;
                if (best == null || isBetterLocation(candidate, best)) {
                    best = candidate;
                }
            } catch (Exception ignored) {
            }
        }
        return best;
    }

    private List<String> getAvailableProviders() {
        List<String> providers = new ArrayList<String>();
        if (locationManager == null) return providers;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                providers.add(LocationManager.GPS_PROVIDER);
            }
        } catch (Exception ignored) {
        }
        try {
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                providers.add(LocationManager.NETWORK_PROVIDER);
            }
        } catch (Exception ignored) {
        }
        return providers;
    }

    private boolean isRecent(Location location) {
        long age = System.currentTimeMillis() - location.getTime();
        return age >= 0 && age <= RECENT_LOCATION_MS;
    }

    private boolean isBetterLocation(Location candidate, Location current) {
        if (candidate.getTime() > current.getTime() + 30000L) return true;
        if (candidate.hasAccuracy() && !current.hasAccuracy()) return true;
        return candidate.hasAccuracy() && current.hasAccuracy() && candidate.getAccuracy() < current.getAccuracy();
    }

    private void stopLocationUpdates() {
        try {
            if (locationManager != null && activeLocationListener != null) {
                locationManager.removeUpdates(activeLocationListener);
            }
        } catch (Exception ignored) {
        }
        activeLocationListener = null;
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

    private boolean isIgnoringBatteryOptimizations() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        try {
            PowerManager manager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            return manager != null && manager.isIgnoringBatteryOptimizations(getPackageName());
        } catch (Exception ignored) {
            return false;
        }
    }

    private void openBatteryOptimizationSettings() {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getPackageName()));
            }
            startActivity(intent);
        } catch (Exception ex) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + getPackageName()));
                startActivity(fallback);
            } catch (Exception ignored) {
                showStatus("Abrir Ajustes > Aplicaciones > DL Preventa > Bateria > Sin restricciones.");
            }
        }
    }

    private void sendLocation(Location location) {
        showStatus("");
        JSONObject payload = new JSONObject();
        try {
            payload.put("lat", location.getLatitude());
            payload.put("lng", location.getLongitude());
            payload.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : 0f);
            payload.put("speed", location.hasSpeed() ? location.getSpeed() : JSONObject.NULL);
            payload.put("heading", location.hasBearing() ? location.getBearing() : JSONObject.NULL);
            payload.put("source", "native");
            payload.put("provider", location.getProvider() == null ? "" : location.getProvider());
            payload.put("mock", isMockLocation(location));
            payload.put("deviceAt", location.getTime() > 0L ? location.getTime() : System.currentTimeMillis());
            int battery = batteryPercent();
            if (battery >= 0) payload.put("battery", battery);
            payload.put("online", isNetworkAvailable());
            payload.put("batteryOptimized", !isIgnoringBatteryOptimizations());
            payload.put("gpsEnabled", locationManager != null && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER));
            payload.put("networkEnabled", locationManager != null && locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER));
        } catch (Exception ignored) {
        }
        evaluateJavascript("window.receiveNativeLocation(" + payload.toString() + ");");
    }

    private boolean isMockLocation(Location location) {
        if (location == null) return false;
        return location.isFromMockProvider();
    }

    private void sendLocationError(String message) {
        showStatus(message);
        evaluateJavascript("window.receiveNativeLocationError(" + JSONObject.quote(message) + ");");
    }

    private void evaluateJavascript(final String script) {
        if (webView == null) return;
        webView.post(new Runnable() {
            @Override
            public void run() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    webView.evaluateJavascript(script, null);
                } else {
                    webView.loadUrl("javascript:" + script);
                }
            }
        });
    }

    public class AndroidLocationBridge {
        @JavascriptInterface
        public void start(String sellerName) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startNativeLocationRequest();
                }
            });
        }

        @JavascriptInterface
        public void startContinuous(final String contextLabel) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    continuousLocationContext = contextLabel == null ? "" : contextLabel;
                    startNativeLocationRequest(true);
                    startBackgroundLocationService(continuousLocationContext);
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    continuousLocationMode = false;
                    pendingLocationRequest = false;
                    continuousLocationContext = "";
                    stopLocationUpdates();
                    stopBackgroundLocationService();
                }
            });
        }

        @JavascriptInterface
        public void openBatterySettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    openBatteryOptimizationSettings();
                }
            });
        }

        @JavascriptInterface
        public boolean isBatteryOptimized() {
            return !isIgnoringBatteryOptimizations();
        }
    }

    public class AndroidConnectionBridge {
        @JavascriptInterface
        public String getServerUrl() {
            return MainActivity.this.getServerUrl();
        }

        @JavascriptInterface
        public void setServerUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.saveServerUrl(url);
                    webView.loadUrl(MainActivity.this.getServerUrl());
                }
            });
        }

        @JavascriptInterface
        public void resetServerUrl() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.resetServerUrl();
                    webView.loadUrl(MainActivity.this.getServerUrl());
                }
            });
        }

        @JavascriptInterface
        public void openSettings() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    showServerConfigDialog("Configurar servidor de DL Preventa");
                }
            });
        }

        @JavascriptInterface
        public void openExternalUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        openExternalUri(Uri.parse(url));
                    } catch (Exception ex) {
                        showStatus("No se pudo abrir enlace externo: " + ex.getMessage());
                    }
                }
            });
        }
    }
}

