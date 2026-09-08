import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

val routempoVersion = Properties().apply {
    rootProject.file("version.properties").inputStream().use(::load)
}
val routempoVersionName = routempoVersion.getProperty("VERSION_NAME")
    ?: error("VERSION_NAME is required in apps/mobile/version.properties")
val routempoVersionCode = routempoVersion.getProperty("VERSION_CODE")?.toIntOrNull()
    ?: error("VERSION_CODE must be an integer in apps/mobile/version.properties")

val releaseSigningValues = mapOf(
    "storeFile" to providers.environmentVariable("ROUTEMPO_SIGNING_STORE_FILE").orNull,
    "storePassword" to providers.environmentVariable("ROUTEMPO_SIGNING_STORE_PASSWORD").orNull,
    "keyAlias" to providers.environmentVariable("ROUTEMPO_SIGNING_KEY_ALIAS").orNull,
    "keyPassword" to providers.environmentVariable("ROUTEMPO_SIGNING_KEY_PASSWORD").orNull,
)
val hasReleaseSigning = releaseSigningValues.values.all { !it.isNullOrBlank() }

android {
    namespace = "com.montasim.routempo"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.montasim.routempo"
        minSdk = 26
        targetSdk = 36
        versionCode = routempoVersionCode
        versionName = routempoVersionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true
        buildConfigField("String", "API_BASE_URL", "\"https://routempo.netlify.app/api/v1\"")
        manifestPlaceholders["authScheme"] = "routempo"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/v1\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.create("githubRelease") {
                    storeFile = file(requireNotNull(releaseSigningValues["storeFile"]))
                    storePassword = requireNotNull(releaseSigningValues["storePassword"])
                    keyAlias = requireNotNull(releaseSigningValues["keyAlias"])
                    keyPassword = requireNotNull(releaseSigningValues["keyPassword"])
                }
            }
        }
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    packaging.resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
}

tasks.register<Copy>("packageGithubRelease") {
    group = "distribution"
    description = "Builds and collects the signed APK using the canonical GitHub Release filename."
    dependsOn("assembleRelease")
    from(layout.buildDirectory.dir("outputs/apk/release")) {
        include("app-release.apk")
        rename { "Routempo-android-v$routempoVersionName.apk" }
    }
    into(layout.buildDirectory.dir("outputs/github-release"))
    doFirst {
        check(hasReleaseSigning) {
            "GitHub Release packaging requires all ROUTEMPO_SIGNING_* environment variables."
        }
    }
}

dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:network"))
    implementation(project(":core:designsystem"))
    implementation(project(":core:data"))
    implementation(project(":feature:auth"))
    implementation(project(":feature:today"))
    implementation(project(":feature:routines"))
    implementation(project(":feature:plan"))
    implementation(project(":feature:review"))
    implementation(project(":feature:settings"))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.browser)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.extended)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)
    testImplementation(libs.junit4)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.androidx.test.junit)
    androidTestImplementation(libs.androidx.test.espresso.core)
    androidTestImplementation(libs.compose.ui.test.junit4)
}
