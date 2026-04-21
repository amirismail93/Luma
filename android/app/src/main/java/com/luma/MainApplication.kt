package com.luma

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.PackageList
import com.facebook.soloader.SoLoader

/**
 * Luma — Android TV application entry point.
 *
 * Configures React Native with Hermes, New Architecture support,
 * and autolinked native packages for the TV build.
 */
class MainApplication : Application(), ReactApplication {

    private val rnHost: ReactNativeHost by lazy {
        object : DefaultReactNativeHost(this@MainApplication) {
            override fun getPackages(): List<ReactPackage> {
                val autolinked = PackageList(this).packages
                // Add any manually-linked packages here if needed
                return autolinked
            }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean
                get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

            override val isHermesEnabled: Boolean
                get() = BuildConfig.IS_HERMES_ENABLED
        }
    }

    override val reactNativeHost: ReactNativeHost
        get() = rnHost

    override val reactHost: ReactHost
        get() = DefaultReactHost.getDefaultReactHost(applicationContext, rnHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, /* native exo-package */ false)

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load()
        }
    }
}
