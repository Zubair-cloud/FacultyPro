package com.example.facultypro; // APNA PACKAGE NAME RAKHEIN

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebStorage;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;
    private ActivityResultLauncher<String> filePickerLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        // --- STATUS BAR COLOR FIX ---
        // Status bar ko background color jaisa kar do
        getWindow().setStatusBarColor(android.graphics.Color.parseColor("#101622"));
        myWebView = findViewById(R.id.myWebView);
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        myWebView.setWebViewClient(new WebViewClient());
        myWebView.setWebChromeClient(new android.webkit.WebChromeClient());

        myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");

        // --- FIXED BACK GESTURE ---
        // Hum Java se HTML ko bolenge "Check karo kya karna hai"
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // HTML ke andar 'handleBackPress' function call karenge
                myWebView.evaluateJavascript("javascript:handleBackPress()", null);
            }
        });

        filePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.GetContent(),
                uri -> {
                    if (uri != null) {
                        try {
                            InputStream inputStream = getContentResolver().openInputStream(uri);
                            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                            StringBuilder stringBuilder = new StringBuilder();
                            String line;
                            while ((line = reader.readLine()) != null)
                                stringBuilder.append(line);
                            inputStream.close();
                            String jsonContent = stringBuilder.toString().replace("'", "\\'");
                            myWebView.evaluateJavascript("javascript:androidRestore('" + jsonContent + "')", null);
                        } catch (Exception e) {
                            Toast.makeText(this, "Error reading file", Toast.LENGTH_SHORT).show();
                        }
                    }
                });

        myWebView.loadUrl("file:///android_asset/attendance.html");
    }

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void resetApp() {
            runOnUiThread(() -> {
                myWebView.clearCache(true);
                myWebView.clearHistory();
                WebStorage.getInstance().deleteAllData();
                Toast.makeText(mContext, "App data has been reset.", Toast.LENGTH_SHORT).show();
                // Reload the page to apply changes
                myWebView.loadUrl("file:///android_asset/attendance.html");
            });
        }

        // --- NEW SHARE FUNCTION (SOLVES PDF & BACKUP ISSUE) ---
        @JavascriptInterface
        public void shareFile(String base64Content, String fileName, String mimeType) {
            try {
                // 1. File ko App ke Cache mein save karo (Temporary)
                File cachePath = new File(mContext.getCacheDir(), "files");
                cachePath.mkdirs();
                File newFile = new File(cachePath, fileName);
                FileOutputStream fos = new FileOutputStream(newFile);

                // Decode Base64 string to bytes
                byte[] fileBytes = android.util.Base64.decode(base64Content, android.util.Base64.DEFAULT);
                fos.write(fileBytes);
                fos.close();

                // 2. FileProvider se URI generate karo (Secure sharing)
                Uri contentUri = FileProvider.getUriForFile(mContext, mContext.getPackageName() + ".provider", newFile);

                // 3. Share Sheet kholo (WhatsApp, Gmail, Drive, etc.)
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(mimeType); // "application/pdf" or "application/json"
                shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "Share via");
                mContext.startActivity(chooser);

            } catch (Exception e) {
                Toast.makeText(mContext, "Error Sharing: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }

        @JavascriptInterface
        public void openFilePicker() {
            filePickerLauncher.launch("application/json");
        }

        // --- APP EXIT COMMAND ---
        @JavascriptInterface
        public void exitApp() {
            finish(); // App band kar dega
        }
    }
}