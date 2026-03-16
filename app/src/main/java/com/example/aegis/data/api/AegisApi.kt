package com.example.aegis.data.api

import com.example.aegis.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface AegisApi {

    @GET("api/dashboard/stats")
    suspend fun getDashboardStats(): Response<DashboardStats>

    @GET("api/attacks/global")
    suspend fun getGlobalAttacks(): Response<List<AttackGlobal>>

    @GET("api/threats")
    suspend fun getThreats(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("severity") severity: String? = null,
        @Query("search") search: String? = null
    ): Response<ThreatListResponse>

    @GET("api/threats/{id}")
    suspend fun getThreat(@Path("id") id: Int): Response<ThreatItem>

    @PATCH("api/threats/{id}/status")
    suspend fun updateThreatStatus(
        @Path("id") id: Int,
        @Body body: StatusUpdateRequest
    ): Response<ThreatItem>

    @GET("api/playbooks")
    suspend fun getPlaybooks(): Response<List<Playbook>>

    @GET("api/playbooks/{id}")
    suspend fun getPlaybook(@Path("id") id: Int): Response<Playbook>

    @POST("api/playbooks")
    suspend fun createPlaybook(@Body body: PlaybookCreateRequest): Response<Playbook>

    @PUT("api/playbooks/{id}")
    suspend fun updatePlaybook(
        @Path("id") id: Int,
        @Body body: PlaybookUpdateRequest
    ): Response<Playbook>

    @POST("api/playbooks/{id}/execute")
    suspend fun executePlaybook(
        @Path("id") id: Int,
        @Body body: PlaybookExecuteRequest
    ): Response<PlaybookLog>

    @GET("api/playbooks/logs")
    suspend fun getPlaybookLogs(): Response<List<PlaybookLog>>

    @GET("api/settings")
    suspend fun getSettings(): Response<SettingsData>

    @PUT("api/settings")
    suspend fun updateSettings(@Body body: SettingsData): Response<SettingsData>
}
