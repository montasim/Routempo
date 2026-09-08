pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "RoutempoMobile"

include(
    ":app",
    ":core:model",
    ":core:network",
    ":core:designsystem",
    ":core:data",
    ":feature:auth",
    ":feature:today",
    ":feature:routines",
    ":feature:plan",
    ":feature:review",
    ":feature:settings",
)
