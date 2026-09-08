package com.montasim.routempo.core.network

import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient

object RoutempoNetwork {
    val defaultJson: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = true
        encodeDefaults = false
    }

    fun create(
        baseUrl: String,
        sessionStore: BearerSessionStore,
        json: Json = defaultJson,
        configureClient: OkHttpClient.Builder.() -> Unit = {},
    ): RoutempoApi {
        val normalized = (if (baseUrl.endsWith('/')) baseUrl else "$baseUrl/").toHttpUrl()
        val refreshClient = OkHttpClient.Builder().apply(configureClient).build()
        val client = OkHttpClient.Builder()
            .apply(configureClient)
            .addInterceptor(RequestIdInterceptor())
            .addInterceptor(DeviceTimezoneInterceptor())
            .addInterceptor(BearerInterceptor(sessionStore))
            .authenticator(RefreshingAuthenticator(normalized, sessionStore, refreshClient, json))
            .build()
        return OkHttpRoutempoApi(normalized, client, sessionStore, json)
    }
}
