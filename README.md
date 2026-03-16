# AEGIS — CyberShield Android Application

AEGIS is a cutting-edge Android application designed for Security Orchestration, Automation, and Response (SOAR). It provides a comprehensive, mobile-first interface for security analysts to monitor, investigate, and respond to cyber threats in real-time.

Built with modern Android development practices, AEGIS features a stunning dark "cyber" theme, rich visualizations, and direct integration with backend infrastructure to execute automated playbooks.

## Key Features

*   **Live Dashboard & 3D Attack visualization:** Provides a real-time, interactive 3D globe visualization (powered by Three.js and Globe.gl) showing the origin, target, and severity of cyber attacks as they happen. Includes live statistics for critical threats and active alerts.
*   **Threat Intelligence & Management:** A dedicated view to monitor active threats, categorizing them by severity, type, and source. Analysts can drill down into specific incident details and manage threat status.
*   **Playbook Action Engine (SOAR):** Create, modify, and execute automated incident response playbooks. 
    *   **Visual Builder:** Construct playbooks using pre-defined action steps organized by category (Network, Endpoint, IAM, Platform).
    *   **Dynamic Variables:** Inject threat-specific context (e.g., `{source_ip}`, `{target_system}`) dynamically into playbook actions at execution time.
    *   **Audit Logging:** Comprehensive tracking of all playbook executions, detailing the success/failure of individual steps for accountability.
*   **Modern UI/UX:** Built entirely with Jetpack Compose, featuring fluid animations, custom dark theme styling, and an intuitive navigation structure tailored for incident responders.

## Supported Playbook Actions

The Action Engine natively supports executing the following operations directly against the infrastructure:

*   **Network:** Block IP (`block_ip`), Isolate Subnet (`isolate_subnet`)
*   **Endpoint:** Quarantine Device (`quarantine_device`), Trigger Antivirus Scan (`trigger_antivirus_scan`)
*   **IAM:** Force User Logout (`force_user_logout`), Lock AD Account (`lock_active_directory_account`)
*   **Platform:** Update Threat Status (`update_threat_status`), Escalate to Tier 2 (`escalate_to_tier2`)

## Tech Stack

*   **UI Framework:** Jetpack Compose (Kotlin)
*   **Architecture:** MVVM Design Pattern
*   **Networking:** Retrofit2 + Gson for REST API communication
*   **Asynchronous Processing:** Kotlin Coroutines & Flow
*   **Visualizations:** Android WebView embedding WebGL models (Three.js/Globe.gl)
*   **Navigation:** Jetpack Navigation component with Compose integration

## Getting Started

### Prerequisites

*   Android Studio (latest version recommended)
*   Android SDK Platform 34 or higher
*   A running instance of the AEGIS Backend server.

### Setup Instructions

1.  **Clone the Repository** and open the `AndroidCode` directory in Android Studio.
2.  **Backend Configuration:** The application expects the AEGIS backend to be reachable. By default, it looks for the backend at `http://10.0.2.2:8000` (the Android emulator's alias to the host machine's `localhost`).
    *   If testing on a physical device, update the `BASE_URL` in your API configuration (e.g., `AegisApi.kt` or `ApiClient.kt`) to point to your development machine's local IP address.
3.  **Build & Run:** Use Android Studio to sync Gradle and run the application on an emulator or physical device.

### Running the Backend (Developer Notes)

The local Python FastAPI backend should be running on your machine:
```bash
python -m uvicorn app.main:app --reload
```

## Project Structure

*   `app/src/main/java/.../`
    *   `data/`: Contains Data Models (`Models.kt`) and the networking layer (`AegisApi.kt`, `ApiClient.kt`).
    *   `ui/`: Organized by feature screens.
        *   `dashboard/`: Dashboard view and 3D globe integration.
        *   `threats/`: Threat list and detailed investigation views.
        *   `playbooks/`: Playbook management, the visual builder, and execution logs.
        *   `settings/`: Application configuration.
        *   `theme/`: Custom Compose theming, colors, shapes, and typography.
*   `app/src/main/assets/`: Contains `globe.html` for the 3D WebGL visualization.

## Development Status

AEGIS is actively developed. Recent updates include replacing legacy text-based playbooks with the structured Event-Driven Action Engine and comprehensive UI refinements.
