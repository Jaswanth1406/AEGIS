package com.example.aegis

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.aegis.data.api.ApiClient
import com.example.aegis.service.ThreatPollingService
import com.example.aegis.ui.dashboard.DashboardScreen
import com.example.aegis.ui.intro.IntroScreen
import com.example.aegis.ui.playbooks.PlaybookBuilderScreen
import com.example.aegis.ui.playbooks.PlaybookDetailScreen
import com.example.aegis.ui.playbooks.PlaybooksScreen
import com.example.aegis.ui.settings.SettingsScreen
import com.example.aegis.ui.theme.*
import com.example.aegis.ui.threats.ThreatDetailScreen
import com.example.aegis.ui.threats.ThreatsListScreen

class MainActivity : ComponentActivity() {

    private val deepLinkThreatId = mutableStateOf<Int?>(null)

    private val notifPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> startThreatService() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ApiClient.init()
        enableEdgeToEdge()
        requestNotificationPermission()
        handleDeepLink(intent)

        setContent {
            var isDarkTheme by rememberSaveable { mutableStateOf(true) }

            AEGISTheme(darkTheme = isDarkTheme) {
                AegisApp(
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    deepLinkThreatId = deepLinkThreatId
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        if (intent?.getStringExtra("navigate_to") == "threat_detail") {
            val threatId = intent.getIntExtra("threat_id", -1)
            if (threatId > 0) deepLinkThreatId.value = threatId
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                return
            }
        }
        startThreatService()
    }

    private fun startThreatService() {
        val serviceIntent = Intent(this, ThreatPollingService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}

// Bottom Nav Items — 5 tabs now
data class BottomNavItem(val route: String, val label: String, val icon: ImageVector, val index: Int)

val bottomNavItems = listOf(
    BottomNavItem("main_dashboard", "Dashboard", Icons.Default.Dashboard, 0),
    BottomNavItem("main_threats", "Threats", Icons.Default.Security, 1),
    BottomNavItem("main_playbooks", "Playbooks", Icons.Default.AutoFixHigh, 2),
    BottomNavItem("main_honeytokens", "Decoys", Icons.Default.BugReport, 3),
    BottomNavItem("main_settings", "Settings", Icons.Default.Settings, 4),
)

@Composable
fun AegisApp(isDarkTheme: Boolean, onToggleTheme: () -> Unit, deepLinkThreatId: MutableState<Int?> = mutableStateOf(null)) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val cyber = LocalCyberColors.current

    LaunchedEffect(deepLinkThreatId.value) {
        val tid = deepLinkThreatId.value ?: return@LaunchedEffect
        navController.navigate("threat_detail/$tid") {
            launchSingleTop = true
        }
        deepLinkThreatId.value = null
    }

    // Track previous tab index for directional slide
    var previousTabIndex by remember { mutableIntStateOf(0) }
    val currentTabIndex = bottomNavItems.find { it.route == currentRoute }?.index ?: previousTabIndex

    val showBottomBar = currentRoute in bottomNavItems.map { it.route }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showBottomBar) {
                CyberBottomBar(
                    currentRoute = currentRoute,
                    onItemClick = { route ->
                        previousTabIndex = currentTabIndex
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "intro",
            modifier = Modifier.padding(
                bottom = if (showBottomBar) innerPadding.calculateBottomPadding() else 0.dp
            )
        ) {
            // ── Intro (splash) ──
            composable(
                "intro",
                exitTransition = {
                    fadeOut(animationSpec = tween(600)) +
                    scaleOut(targetScale = 1.1f, animationSpec = tween(600))
                }
            ) {
                IntroScreen(
                    onGetStartedClick = {
                        navController.navigate("main_dashboard") {
                            popUpTo("intro") { inclusive = true }
                        }
                    }
                )
            }

            // ── Dashboard Tab ──
            composable(
                "main_dashboard",
                enterTransition = {
                    val fromIntro = initialState.destination.route == "intro"
                    if (fromIntro) {
                        fadeIn(animationSpec = tween(700)) +
                        scaleIn(initialScale = 0.92f, animationSpec = tween(700))
                    } else {
                        slideInHorizontally(
                            initialOffsetX = { if (currentTabIndex > previousTabIndex) it else -it },
                            animationSpec = tween(350)
                        ) + fadeIn(animationSpec = tween(350))
                    }
                },
                exitTransition = {
                    val toDetail = targetState.destination.route?.startsWith("threat_detail") == true
                    if (toDetail) {
                        fadeOut(animationSpec = tween(300))
                    } else {
                        slideOutHorizontally(
                            targetOffsetX = { if (currentTabIndex > previousTabIndex) -it else it },
                            animationSpec = tween(350)
                        ) + fadeOut(animationSpec = tween(350))
                    }
                }
            ) {
                DashboardScreen(
                    onNavigateToThreat = { threatId ->
                        navController.navigate("threat_detail/$threatId")
                    }
                )
            }

            // ── Threats Tab ──
            composable(
                "main_threats",
                enterTransition = {
                    slideInHorizontally(
                        initialOffsetX = { if (currentTabIndex > previousTabIndex) it else -it },
                        animationSpec = tween(350)
                    ) + fadeIn(animationSpec = tween(350))
                },
                exitTransition = {
                    val toDetail = targetState.destination.route?.startsWith("threat_detail") == true
                    if (toDetail) {
                        fadeOut(animationSpec = tween(300))
                    } else {
                        slideOutHorizontally(
                            targetOffsetX = { if (currentTabIndex > previousTabIndex) -it else it },
                            animationSpec = tween(350)
                        ) + fadeOut(animationSpec = tween(350))
                    }
                }
            ) {
                ThreatsListScreen(
                    onThreatClick = { threatId ->
                        navController.navigate("threat_detail/$threatId")
                    }
                )
            }

            // ── Playbooks Tab ──
            composable(
                "main_playbooks",
                enterTransition = {
                    slideInHorizontally(
                        initialOffsetX = { if (currentTabIndex > previousTabIndex) it else -it },
                        animationSpec = tween(350)
                    ) + fadeIn(animationSpec = tween(350))
                },
                exitTransition = {
                    val toDetail = targetState.destination.route?.startsWith("playbook_detail") == true ||
                                   targetState.destination.route == "playbook_builder"
                    if (toDetail) {
                        fadeOut(animationSpec = tween(300))
                    } else {
                        slideOutHorizontally(
                            targetOffsetX = { if (currentTabIndex > previousTabIndex) -it else it },
                            animationSpec = tween(350)
                        ) + fadeOut(animationSpec = tween(350))
                    }
                }
            ) {
                PlaybooksScreen(
                    onPlaybookClick = { id -> navController.navigate("playbook_detail/$id") },
                    onCreateClick = { navController.navigate("playbook_builder") }
                )
            }

            // ── Honeytokens Tab ──
            composable(
                "main_honeytokens",
                enterTransition = {
                    slideInHorizontally(
                        initialOffsetX = { if (currentTabIndex > previousTabIndex) it else -it },
                        animationSpec = tween(350)
                    ) + fadeIn(animationSpec = tween(350))
                },
                exitTransition = {
                    slideOutHorizontally(
                        targetOffsetX = { if (currentTabIndex > previousTabIndex) -it else it },
                        animationSpec = tween(350)
                    ) + fadeOut(animationSpec = tween(350))
                }
            ) {
                com.example.aegis.ui.honeytokens.HoneytokensScreen()
            }

            // ── Settings Tab ──
            composable(
                "main_settings",
                enterTransition = {
                    slideInHorizontally(
                        initialOffsetX = { if (currentTabIndex > previousTabIndex) it else -it },
                        animationSpec = tween(350)
                    ) + fadeIn(animationSpec = tween(350))
                },
                exitTransition = {
                    slideOutHorizontally(
                        targetOffsetX = { if (currentTabIndex > previousTabIndex) -it else it },
                        animationSpec = tween(350)
                    ) + fadeOut(animationSpec = tween(350))
                }
            ) {
                SettingsScreen(
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = onToggleTheme
                )
            }

            // ── Threat Detail (slides up from bottom) ──
            composable(
                "threat_detail/{threatId}",
                enterTransition = {
                    slideInVertically(
                        initialOffsetY = { it },
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioLowBouncy,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    ) + fadeIn(animationSpec = tween(400))
                },
                exitTransition = {
                    slideOutVertically(
                        targetOffsetY = { it },
                        animationSpec = tween(350)
                    ) + fadeOut(animationSpec = tween(300))
                },
                popEnterTransition = {
                    fadeIn(animationSpec = tween(300))
                },
                popExitTransition = {
                    slideOutVertically(
                        targetOffsetY = { it },
                        animationSpec = tween(350)
                    ) + fadeOut(animationSpec = tween(300))
                }
            ) { backStackEntry ->
                val threatId = backStackEntry.arguments?.getString("threatId")?.toIntOrNull() ?: 0
                ThreatDetailScreen(
                    threatId = threatId,
                    onBack = { navController.popBackStack() }
                )
            }

            // ── Playbook Detail ──
            composable(
                "playbook_detail/{playbookId}",
                enterTransition = {
                    slideInVertically(
                        initialOffsetY = { it },
                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow)
                    ) + fadeIn(animationSpec = tween(400))
                },
                exitTransition = { fadeOut(animationSpec = tween(300)) },
                popExitTransition = {
                    slideOutVertically(targetOffsetY = { it }, animationSpec = tween(350)) +
                    fadeOut(animationSpec = tween(300))
                }
            ) { backStackEntry ->
                val playbookId = backStackEntry.arguments?.getString("playbookId")?.toIntOrNull() ?: 0
                PlaybookDetailScreen(
                    playbookId = playbookId,
                    onBack = { navController.popBackStack() },
                    onEdit = { id -> navController.navigate("playbook_builder/$id") }
                )
            }

            // ── Playbook Builder (Create) ──
            composable(
                "playbook_builder",
                enterTransition = {
                    slideInVertically(
                        initialOffsetY = { it },
                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow)
                    ) + fadeIn(animationSpec = tween(400))
                },
                popExitTransition = {
                    slideOutVertically(targetOffsetY = { it }, animationSpec = tween(350)) +
                    fadeOut(animationSpec = tween(300))
                }
            ) {
                PlaybookBuilderScreen(
                    onBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }

            // ── Playbook Builder (Edit) ──
            composable(
                "playbook_builder/{playbookId}",
                enterTransition = {
                    slideInVertically(
                        initialOffsetY = { it },
                        animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy, stiffness = Spring.StiffnessMediumLow)
                    ) + fadeIn(animationSpec = tween(400))
                },
                popExitTransition = {
                    slideOutVertically(targetOffsetY = { it }, animationSpec = tween(350)) +
                    fadeOut(animationSpec = tween(300))
                }
            ) { backStackEntry ->
                val playbookId = backStackEntry.arguments?.getString("playbookId")?.toIntOrNull()
                PlaybookBuilderScreen(
                    editPlaybookId = playbookId,
                    onBack = { navController.popBackStack() },
                    onSaved = { navController.popBackStack() }
                )
            }
        }
    }
}

@Composable
fun CyberBottomBar(currentRoute: String?, onItemClick: (String) -> Unit) {
    val cyber = LocalCyberColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(cyber.cardBackground)
                .padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            bottomNavItems.forEach { item ->
                val isSelected = currentRoute == item.route
                val bgColor = if (isSelected) cyber.neonCyan.copy(alpha = 0.15f) else Color.Transparent
                val contentColor = if (isSelected) cyber.neonCyan else cyber.textSecondary

                IconButton(
                    onClick = { onItemClick(item.route) },
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(bgColor)
                        .weight(1f)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(item.icon, contentDescription = item.label, tint = contentColor, modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(item.label, fontSize = 10.sp, color = contentColor, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal)
                    }
                }
            }
        }
    }
}
